import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Proxy de autenticação (equivalente ao antigo "middleware" do Next).
// Deixa passar rotas públicas e a ingestão de mensagens (protegida por segredo próprio);
// as demais exigem usuário logado.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas ou com autenticação própria
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/callback') || // retorno dos links de e-mail do Supabase
    pathname.startsWith('/nova-senha') || // definir senha vinda do link de recuperação
    pathname.startsWith('/api/webhook') // protegida por INGEST_SECRET
  ) {
    return NextResponse.next()
  }

  // Banco ainda não configurado: libera para poder navegar a interface
  // (cada página mostra o aviso de "conectar banco"). Reativa auth ao configurar.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
