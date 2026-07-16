import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PAPEIS_FABRICA } from '@/lib/papeis'

/**
 * Papéis que podem ser atribuídos a um login: os ativos de at_papeis
 * (o Administrador cria/edita em Configurações → Papéis). Reserva = os de fábrica.
 */
async function papeisValidos(db: SupabaseClient): Promise<string[]> {
  try {
    const { data, error } = await db.from('at_papeis').select('codigo, ativo')
    if (error || !data || data.length === 0) return PAPEIS_FABRICA.map((p) => p.codigo)
    return (data as { codigo: string; ativo: boolean }[]).filter((p) => p.ativo).map((p) => p.codigo)
  } catch {
    return PAPEIS_FABRICA.map((p) => p.codigo)
  }
}

/**
 * Cadastro de colaboradores (somente ADMIN).
 * Cria o usuário no Supabase Auth (via service_role) e o vínculo na tabela `usuarios`.
 * Requer SUPABASE_SERVICE_ROLE_KEY configurada.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local (necessária para criar usuários).' },
      { status: 500 }
    )
  }

  const db = createAdminClient()

  // Só ADMIN pode cadastrar
  const { data: perfil } = await db.from('usuarios').select('role').eq('id', user.id).maybeSingle()
  if (perfil?.role !== 'ADMIN') {
    return NextResponse.json({ erro: 'apenas administradores podem cadastrar colaboradores' }, { status: 403 })
  }

  let body: { nome?: string; email?: string; senha?: string; role?: string; telefone?: string; at_colaborador_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const nome = (body.nome ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const senha = body.senha ?? ''
  const validos = await papeisValidos(db)
  const pedido = (body.role ?? '').trim()
  if (pedido && !validos.includes(pedido)) {
    return NextResponse.json({ erro: `papel "${pedido}" não existe ou está desativado` }, { status: 400 })
  }
  const role = pedido || 'COLABORADOR'
  const telefone = (body.telefone ?? '').trim() || null
  const atColaboradorId = (body.at_colaborador_id ?? '').trim() || null

  if (!nome || !email || senha.length < 6) {
    return NextResponse.json(
      { erro: 'nome, e-mail e senha (mín. 6 caracteres) são obrigatórios' },
      { status: 400 }
    )
  }

  // 1) Cria no Auth já confirmado
  const { data: created, error: errAuth } = await db.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })
  if (errAuth || !created?.user) {
    return NextResponse.json({ erro: `falha no Auth: ${errAuth?.message ?? 'desconhecido'}` }, { status: 400 })
  }

  // 2) Vincula na tabela usuarios
  const { error: errIns } = await db.from('usuarios').insert({
    id: created.user.id,
    email,
    nome,
    telefone,
    role,
    at_colaborador_id: atColaboradorId,
  })
  if (errIns) {
    // desfaz o usuário do Auth para não deixar órfão
    await db.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ erro: `falha ao vincular: ${errIns.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: created.user.id, nome, email, role })
}

// Confere que o usuário logado é ADMIN. Devolve {db, user} ou uma resposta de erro.
async function garantirAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: NextResponse.json({ erro: 'não autenticado' }, { status: 401 }) }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { erro: NextResponse.json({ erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 500 }) }
  }
  const db = createAdminClient()
  const { data: perfil } = await db.from('usuarios').select('role').eq('id', user.id).maybeSingle()
  if (perfil?.role !== 'ADMIN') {
    return { erro: NextResponse.json({ erro: 'apenas administradores podem gerenciar acessos' }, { status: 403 }) }
  }
  return { db, user }
}

// Editar um login: papel, atendente vinculado, ativo/inativo, nome.
export async function PATCH(req: Request) {
  const g = await garantirAdmin()
  if ('erro' in g) return g.erro
  const { db } = g

  let body: { id?: string; nome?: string; role?: string; at_colaborador_id?: string | null; ativo?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (typeof body.nome === 'string' && body.nome.trim()) patch.nome = body.nome.trim()
  if (body.role !== undefined) {
    const validos = await papeisValidos(db)
    if (!validos.includes(body.role)) {
      return NextResponse.json({ erro: `papel "${body.role}" não existe ou está desativado` }, { status: 400 })
    }
    patch.role = body.role
  }
  if ('at_colaborador_id' in body) patch.at_colaborador_id = (body.at_colaborador_id ?? '') || null
  if (typeof body.ativo === 'boolean') patch.ativo = body.ativo
  if (Object.keys(patch).length === 0) return NextResponse.json({ erro: 'nada para atualizar' }, { status: 400 })

  const { error } = await db.from('usuarios').update(patch).eq('id', id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Excluir um login (remove do Auth e da tabela). Não permite excluir a si mesmo.
export async function DELETE(req: Request) {
  const g = await garantirAdmin()
  if ('erro' in g) return g.erro
  const { db, user } = g

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })
  if (id === user.id) return NextResponse.json({ erro: 'você não pode excluir o seu próprio acesso' }, { status: 400 })

  await db.from('usuarios').delete().eq('id', id)
  const { error } = await db.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ erro: `removido da tabela, mas falhou no Auth: ${error.message}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}
