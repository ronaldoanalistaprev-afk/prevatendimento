import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizarFonetico } from '@/lib/utils'

/**
 * Busca de clientes por nome ou telefone, para vincular uma cobrança.
 * Respeita o papel (RLS): supervisor/gestor veem todos; colaborador só os seus.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ clientes: [] })

  // Busca tolerante a grafia: nome por forma fonética (ignora acento/maiúscula e
  // troca s↔ss↔z↔ç, c↔ch↔x↔s, g↔j, i↔y, u↔w) via a função at_buscar_clientes;
  // telefone por dígitos. Respeita o papel (RLS) na própria função.
  const nomeFon = normalizarFonetico(q).replace(/[,%()]/g, '')
  const digitos = q.replace(/\D/g, '')
  const { data } = await supabase.rpc('at_buscar_clientes', {
    p_nome: nomeFon,
    p_digitos: digitos.length >= 3 ? digitos : '',
  })

  return NextResponse.json({ clientes: data ?? [] })
}
