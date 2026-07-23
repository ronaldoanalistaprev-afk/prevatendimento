import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Encerra a sessão pelo servidor e volta para o login.
 * Usada quando um login é desativado enquanto a pessoa ainda está navegando:
 * derrubar a sessão de verdade é o que impede que ela continue usando o sistema.
 */
export async function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get('motivo')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const destino = new URL('/login', request.nextUrl.origin)
  if (motivo) destino.searchParams.set('erro', motivo)
  return NextResponse.redirect(destino)
}
