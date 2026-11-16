import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPapeis, poderesDo } from '@/lib/poderes'

/**
 * Marco Zero.
 * POST   { acao: 'preparar', quantidade } = registra os N mais antigos que esperam como um novo lote.
 * DELETE ?lote=N = desfaz um lote inteiro (para corrigir antes do disparo).
 * Só quem enxerga a operação inteira (gestor/supervisor/admin) pode agir.
 */
async function usuarioAtual() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, perfil: null, poderes: { verTudo: false, cobrar: false } }
  const [{ data: perfil }, papeis] = await Promise.all([
    supabase.from('usuarios').select('role, nome, ativo').eq('id', user.id).maybeSingle(),
    getPapeis(true),
  ])
  const p = perfil as { role?: string; nome?: string; ativo?: boolean } | null
  if (p?.ativo === false) return { supabase, user: null, perfil: null, poderes: { verTudo: false, cobrar: false } }
  return { supabase, user, perfil: p, poderes: poderesDo(p?.role ?? '', papeis) }
}

export async function POST(req: Request) {
  const { supabase, user, perfil, poderes } = await usuarioAtual()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.verTudo) return NextResponse.json({ erro: 'seu papel não permite gerenciar o Marco Zero' }, { status: 403 })

  let body: { acao?: string; quantidade?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  if (body.acao !== 'preparar') return NextResponse.json({ erro: 'ação inválida' }, { status: 400 })

  const quantidade = Math.min(Math.max(Number(body.quantidade) || 40, 1), 500)
  const { data, error } = await supabase.rpc('at_marco_zero_preparar_lote', {
    p_quantidade: quantidade,
    p_criado_por_nome: perfil?.nome ?? null,
  })
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  const linha = (Array.isArray(data) ? data[0] : data) as { lote?: number; inseridos?: number } | null
  return NextResponse.json({ ok: true, lote: linha?.lote ?? null, inseridos: linha?.inseridos ?? 0 })
}

export async function DELETE(req: Request) {
  const { supabase, user, poderes } = await usuarioAtual()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.verTudo) return NextResponse.json({ erro: 'seu papel não permite gerenciar o Marco Zero' }, { status: 403 })

  const url = new URL(req.url)
  const id = (url.searchParams.get('id') ?? '').trim()
  const lote = Number(url.searchParams.get('lote'))

  // ?id=... remove UMA pessoa do lote; ?lote=N desfaz o lote inteiro.
  if (id) {
    const { error } = await supabase.from('at_marco_zero').delete().eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (lote && lote >= 1) {
    const { error } = await supabase.from('at_marco_zero').delete().eq('lote', lote)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ erro: 'informe id ou lote' }, { status: 400 })
}
