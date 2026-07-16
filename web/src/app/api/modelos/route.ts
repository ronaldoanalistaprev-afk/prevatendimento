import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPapeis, poderesDo } from '@/lib/poderes'

/**
 * Modelos de cobrança (textos pré-escritos).
 * POST = criar · PATCH = editar/ativar/desativar · DELETE = excluir.
 * Só quem tem o poder de cobrar mexe nos modelos.
 */

async function quemSou() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, perfil: null, poderes: { verTudo: false, cobrar: false } }
  const [{ data: perfil }, papeis] = await Promise.all([
    supabase.from('usuarios').select('role, nome').eq('id', user.id).maybeSingle(),
    getPapeis(true),
  ])
  const p = perfil as { role?: string; nome?: string } | null
  return { supabase, user, perfil: p, poderes: poderesDo(p?.role ?? '', papeis) }
}

/** 1 a 5 dias, ou nada. */
function prazoDias(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

export async function POST(req: Request) {
  const { supabase, user, perfil, poderes } = await quemSou()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite criar modelos' }, { status: 403 })

  let body: { titulo?: string; texto?: string; prazo_dias?: number; ordem?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const titulo = (body.titulo ?? '').trim()
  const texto = (body.texto ?? '').trim()
  if (!titulo || !texto) return NextResponse.json({ erro: 'título e texto são obrigatórios' }, { status: 400 })

  const { data, error } = await supabase
    .from('at_modelos_cobranca')
    .insert({
      titulo,
      texto,
      prazo_dias: prazoDias(body.prazo_dias),
      ordem: Number.isFinite(Number(body.ordem)) ? Number(body.ordem) : 0,
      criado_por: user.id,
      criado_por_nome: perfil?.nome ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data?.id })
}

export async function PATCH(req: Request) {
  const { supabase, user, poderes } = await quemSou()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite editar modelos' }, { status: 403 })

  let body: { id?: string; titulo?: string; texto?: string; prazo_dias?: number | null; ativo?: boolean; ordem?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() }
  if (body.titulo !== undefined) {
    const t = body.titulo.trim()
    if (!t) return NextResponse.json({ erro: 'o título não pode ficar vazio' }, { status: 400 })
    patch.titulo = t
  }
  if (body.texto !== undefined) {
    const t = body.texto.trim()
    if (!t) return NextResponse.json({ erro: 'o texto não pode ficar vazio' }, { status: 400 })
    patch.texto = t
  }
  if (body.prazo_dias !== undefined) patch.prazo_dias = prazoDias(body.prazo_dias)
  if (body.ativo !== undefined) patch.ativo = Boolean(body.ativo)
  if (body.ordem !== undefined && Number.isFinite(Number(body.ordem))) patch.ordem = Number(body.ordem)

  const { error } = await supabase.from('at_modelos_cobranca').update(patch).eq('id', id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { supabase, user, poderes } = await quemSou()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite excluir modelos' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  const { error } = await supabase.from('at_modelos_cobranca').delete().eq('id', id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
