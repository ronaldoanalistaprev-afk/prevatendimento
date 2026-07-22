import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Retorno dos links de e-mail do Supabase (recuperar senha, convite, confirmação).
// Troca o código temporário por uma sessão e leva o usuário para onde ele precisa ir.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const tipo = searchParams.get('type') // 'recovery' | 'invite' | 'signup' | ...
  const proximo = searchParams.get('next')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/login?erro=link_invalido', origin))
    }
  } else if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as 'recovery' | 'invite' | 'signup' | 'email_change' | 'magiclink',
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(new URL('/login?erro=link_invalido', origin))
    }
  } else {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Recuperação de senha e convite caem na tela de definir senha.
  if (tipo === 'recovery' || tipo === 'invite' || !tipo) {
    return NextResponse.redirect(new URL(proximo || '/nova-senha', origin))
  }

  return NextResponse.redirect(new URL(proximo || '/dashboard', origin))
}
