import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Salva a matriz de permissões (papel × tela). Só ADMIN. */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('usuarios').select('role').eq('id', user.id).maybeSingle()
  if ((perfil as { role?: string } | null)?.role !== 'ADMIN') {
    return NextResponse.json({ erro: 'apenas administradores alteram permissões' }, { status: 403 })
  }

  let body: { itens?: { tela: string; role: string; permitido: boolean }[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const itens = Array.isArray(body.itens) ? body.itens : []
  if (itens.length === 0) return NextResponse.json({ erro: 'nada para salvar' }, { status: 400 })

  const linhas = itens.map((i) => ({ tela: String(i.tela), role: String(i.role), permitido: Boolean(i.permitido) }))
  const { error } = await supabase.from('at_permissoes').upsert(linhas, { onConflict: 'tela,role' })
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
