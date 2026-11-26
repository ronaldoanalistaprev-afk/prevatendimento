import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * A PRÓPRIA pessoa define a sua senha (usada pela tela /nova-senha no primeiro acesso
 * com senha provisória). Faz TUDO no servidor, numa coisa só:
 *   1) troca a senha do usuário logado;
 *   2) só então apaga a marca `senha_provisoria_desde`.
 * Assim a marca nunca some sem a senha ter sido realmente trocada (não dá para burlar a
 * troca obrigatória chamando a rota direto). Age apenas sobre o próprio usuário da sessão.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 500 })
  }

  let body: { senha?: string }
  try { body = await req.json() } catch { return NextResponse.json({ erro: 'json inválido' }, { status: 400 }) }
  const senha = body.senha ?? ''
  if (senha.length < 8) {
    return NextResponse.json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
  }

  const db = createAdminClient()

  // 1) Troca a senha no Auth (do próprio usuário da sessão).
  const { error: errSenha } = await db.auth.admin.updateUserById(user.id, { password: senha })
  if (errSenha) {
    const bruto = (errSenha.message ?? '').toLowerCase()
    const amigavel = bruto.includes('password')
      ? 'A senha não atende aos requisitos. Use pelo menos 8 caracteres.'
      : 'Não foi possível salvar a senha. Tente de novo.'
    return NextResponse.json({ erro: amigavel }, { status: 400 })
  }

  // 2) Só agora apaga a marca de senha provisória (se houver).
  const { error: errMarca } = await db.from('usuarios').update({ senha_provisoria_desde: null }).eq('id', user.id)
  if (errMarca) {
    // A senha já foi trocada; se a marca não saiu, a pessoa tenta de novo (a troca é idempotente).
    return NextResponse.json({ erro: 'A senha foi salva, mas houve um problema ao liberar o acesso. Tente de novo.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
