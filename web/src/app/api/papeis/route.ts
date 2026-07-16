import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Papéis (cargos) do sistema — só o ADMIN mexe.
 * POST = criar · PATCH = editar · DELETE = excluir.
 * Regras de proteção:
 *  - papel de fábrica (sistema=true) não pode ser excluído, nem ter o código mudado;
 *  - o ADMIN não pode perder poderes (ele é a porta de entrada do sistema);
 *  - papel em uso por algum login não pode ser excluído.
 */

async function souAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, admin: false }
  const { data } = await supabase.from('usuarios').select('role').eq('id', user.id).maybeSingle()
  return { supabase, user, admin: (data as { role?: string } | null)?.role === 'ADMIN' }
}

/** ESTAGIARIO_JR a partir de "Estagiário Jr" — o código é a chave interna. */
function gerarCodigo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
}

export async function POST(req: Request) {
  const { supabase, user, admin } = await souAdmin()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!admin) return NextResponse.json({ erro: 'apenas o administrador gerencia papéis' }, { status: 403 })

  let body: { nome?: string; descricao?: string; pode_ver_tudo?: boolean; pode_cobrar?: boolean; ordem?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const nome = (body.nome ?? '').trim()
  if (!nome) return NextResponse.json({ erro: 'o nome do papel é obrigatório' }, { status: 400 })
  const codigo = gerarCodigo(nome)
  if (!codigo) return NextResponse.json({ erro: 'nome inválido para gerar o código do papel' }, { status: 400 })

  const { data: existe } = await supabase.from('at_papeis').select('codigo').eq('codigo', codigo).maybeSingle()
  if (existe) return NextResponse.json({ erro: `já existe um papel com o código ${codigo}` }, { status: 409 })

  const { error } = await supabase.from('at_papeis').insert({
    codigo,
    nome,
    descricao: (body.descricao ?? '').trim() || null,
    sistema: false,
    pode_ver_tudo: Boolean(body.pode_ver_tudo),
    pode_cobrar: Boolean(body.pode_cobrar),
    ordem: Number.isFinite(Number(body.ordem)) ? Number(body.ordem) : 50,
  })
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, codigo })
}

export async function PATCH(req: Request) {
  const { supabase, user, admin } = await souAdmin()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!admin) return NextResponse.json({ erro: 'apenas o administrador gerencia papéis' }, { status: 403 })

  let body: { codigo?: string; nome?: string; descricao?: string; pode_ver_tudo?: boolean; pode_cobrar?: boolean; ativo?: boolean; ordem?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const codigo = (body.codigo ?? '').trim()
  if (!codigo) return NextResponse.json({ erro: 'código é obrigatório' }, { status: 400 })

  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() }
  if (body.nome !== undefined) {
    const n = body.nome.trim()
    if (!n) return NextResponse.json({ erro: 'o nome não pode ficar vazio' }, { status: 400 })
    patch.nome = n
  }
  if (body.descricao !== undefined) patch.descricao = body.descricao.trim() || null
  if (body.pode_ver_tudo !== undefined) patch.pode_ver_tudo = Boolean(body.pode_ver_tudo)
  if (body.pode_cobrar !== undefined) patch.pode_cobrar = Boolean(body.pode_cobrar)
  if (body.ativo !== undefined) patch.ativo = Boolean(body.ativo)
  if (body.ordem !== undefined && Number.isFinite(Number(body.ordem))) patch.ordem = Number(body.ordem)

  // O Administrador não pode ser enfraquecido nem desligado — senão ninguém mais entra.
  if (codigo === 'ADMIN') {
    delete patch.pode_ver_tudo
    delete patch.pode_cobrar
    delete patch.ativo
  }

  const { error } = await supabase.from('at_papeis').update(patch).eq('codigo', codigo)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { supabase, user, admin } = await souAdmin()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!admin) return NextResponse.json({ erro: 'apenas o administrador gerencia papéis' }, { status: 403 })

  const codigo = new URL(req.url).searchParams.get('codigo')?.trim()
  if (!codigo) return NextResponse.json({ erro: 'código é obrigatório' }, { status: 400 })

  const { data: papel } = await supabase.from('at_papeis').select('sistema, nome').eq('codigo', codigo).maybeSingle()
  if (!papel) return NextResponse.json({ erro: 'papel não encontrado' }, { status: 404 })
  if ((papel as { sistema?: boolean }).sistema) {
    return NextResponse.json({ erro: 'os papéis de fábrica não podem ser excluídos (mas podem ser desativados)' }, { status: 400 })
  }

  // Papel em uso não some — senão o login fica órfão, sem acesso a nada.
  const { count } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('role', codigo)
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { erro: `${count} login(s) usam este papel. Troque o papel dessas pessoas antes de excluir.` },
      { status: 409 }
    )
  }

  const { error: err1 } = await supabase.from('at_papeis').delete().eq('codigo', codigo)
  if (err1) return NextResponse.json({ erro: err1.message }, { status: 500 })
  // Limpa as permissões de tela desse papel (senão ficam linhas órfãs na matriz).
  await supabase.from('at_permissoes').delete().eq('role', codigo)
  return NextResponse.json({ ok: true })
}
