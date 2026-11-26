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
    pathname.startsWith('/auth/') || // retorno dos links de e-mail e saída do sistema
    pathname.startsWith('/nova-senha') || // definir senha vinda do link de recuperação
    pathname.startsWith('/vitrine') || // telas de amostra com dados fictícios, sem login (para aprovar a aparência)
    pathname.startsWith('/api/webhook') || // protegida por INGEST_SECRET
    pathname.startsWith('/api/whatsapp/cloud/webhook') // webhook da Meta (verify_token no GET; a Meta chama sem login)
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

  // Senha provisória: enquanto a pessoa não cria a sua senha, as ROTAS DE DADOS ficam bloqueadas
  // (as telas já são barradas pela casca do /dashboard). Só a troca da própria senha é liberada.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/conta/definir-minha-senha')) {
    const { data: u } = await supabase
      .from('usuarios')
      .select('senha_provisoria_desde')
      .eq('id', user.id)
      .maybeSingle()
    if ((u as { senha_provisoria_desde?: string | null } | null)?.senha_provisoria_desde) {
      return NextResponse.json({ erro: 'Crie a sua senha para continuar.' }, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
