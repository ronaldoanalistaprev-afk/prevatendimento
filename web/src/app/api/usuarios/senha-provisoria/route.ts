import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Define uma SENHA PROVISÓRIA para um login que já existe (só ADMIN).
 * O administrador gera a senha e entrega à pessoa; no primeiro acesso o sistema
 * obriga a criar uma senha nova (a casca do painel redireciona para /nova-senha
 * enquanto `usuarios.senha_provisoria_desde` não for nulo). Nenhum e-mail é enviado.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 500 })
  }

  const db = createAdminClient()
  const { data: perfil } = await db.from('usuarios').select('role, ativo').eq('id', user.id).maybeSingle()
  if ((perfil as { ativo?: boolean } | null)?.ativo === false) {
    return NextResponse.json({ erro: 'este login está desativado' }, { status: 403 })
  }
  if ((perfil as { role?: string } | null)?.role !== 'ADMIN') {
    return NextResponse.json({ erro: 'apenas administradores definem senhas' }, { status: 403 })
  }

  let body: { id?: string; senha?: string }
  try { body = await req.json() } catch { return NextResponse.json({ erro: 'json inválido' }, { status: 400 }) }
  const id = (body.id ?? '').trim()
  const senha = body.senha ?? ''
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })
  if (senha.length < 8) return NextResponse.json({ erro: 'A senha provisória precisa ter pelo menos 8 caracteres.' }, { status: 400 })

  const { data: alvo } = await db.from('usuarios').select('email').eq('id', id).maybeSingle()
  if (!(alvo as { email?: string } | null)?.email) {
    return NextResponse.json({ erro: 'login não encontrado' }, { status: 404 })
  }

  // 1) Troca a senha no Auth
  const { error: errSenha } = await db.auth.admin.updateUserById(id, { password: senha })
  if (errSenha) {
    const bruto = (errSenha.message ?? '').toLowerCase()
    const amigavel = bruto.includes('password')
      ? 'A senha não atende aos requisitos. Use pelo menos 8 caracteres.'
      : 'Não foi possível definir a senha provisória. Tente de novo.'
    return NextResponse.json({ erro: amigavel }, { status: 400 })
  }

  // 2) Marca como provisória (força a troca no primeiro acesso)
  const { error: errMarca } = await db.from('usuarios')
    .update({ senha_provisoria_desde: new Date().toISOString() }).eq('id', id)
  if (errMarca) {
    return NextResponse.json({ erro: `a senha foi trocada, mas não consegui marcar como provisória: ${errMarca.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
