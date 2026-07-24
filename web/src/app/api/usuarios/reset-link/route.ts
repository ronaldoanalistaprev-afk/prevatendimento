import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Gera um link de "criar nova senha" para um login (só ADMIN).
 * Serve para redefinir a senha de qualquer pessoa sem depender de e-mail real:
 * o Administrador copia o link e entrega à pessoa, que cria a própria senha.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  const db = createAdminClient()
  const { data: perfil } = await db.from('usuarios').select('role, ativo').eq('id', user.id).maybeSingle()
  if ((perfil as { ativo?: boolean } | null)?.ativo === false) {
    return NextResponse.json({ erro: 'este login está desativado' }, { status: 403 })
  }
  if ((perfil as { role?: string } | null)?.role !== 'ADMIN') {
    return NextResponse.json({ erro: 'apenas administradores redefinem senhas' }, { status: 403 })
  }

  let body: { id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ erro: 'json inválido' }, { status: 400 }) }
  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  const { data: alvo } = await db.from('usuarios').select('email').eq('id', id).maybeSingle()
  const email = (alvo as { email?: string } | null)?.email
  if (!email) return NextResponse.json({ erro: 'login não encontrado' }, { status: 404 })

  const origin = new URL(req.url).origin
  const { data, error } = await db.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ erro: 'não foi possível gerar o link' }, { status: 500 })
  }
  return NextResponse.json({ link: data.properties.action_link })
}
