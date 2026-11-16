import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPapeis, poderesDo } from '@/lib/poderes'
import { STATUS_ABERTAS } from '@/lib/dados'

/**
 * Cobranças do supervisor.
 * POST   = criar cobrança para o colaborador de um protocolo.
 * PATCH  = editar (mensagem/prazo), resolver ou cancelar.
 * DELETE = excluir de vez (some do histórico).
 * Quem pode cobrar vem dos poderes do papel (Configurações → Papéis).
 */

async function usuarioAtual() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, perfil: null, poderes: { verTudo: false, cobrar: false } }
  const [{ data: perfil }, papeis] = await Promise.all([
    supabase.from('usuarios').select('role, nome, ativo, at_colaborador_id').eq('id', user.id).maybeSingle(),
    getPapeis(true),
  ])
  const p = perfil as { role?: string; nome?: string; ativo?: boolean; at_colaborador_id?: string } | null
  // Login desativado não age, nem pelas telas nem por fora delas.
  if (p?.ativo === false) {
    return { supabase, user: null, perfil: null, poderes: { verTudo: false, cobrar: false } }
  }
  return { supabase, user, perfil: p, poderes: poderesDo(p?.role ?? '', papeis) }
}

export async function POST(req: Request) {
  const { supabase, user, perfil, poderes } = await usuarioAtual()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.cobrar) {
    return NextResponse.json({ erro: 'seu papel não permite cobrar' }, { status: 403 })
  }

  let body: { protocolo_id?: string; colaborador_id?: string; colaborador_nome?: string; cliente_id?: string; mensagem?: string; prazo?: string; modelo_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const protocoloId = (body.protocolo_id ?? '').trim()
  const mensagem = (body.mensagem ?? '').trim()
  if (!mensagem) return NextResponse.json({ erro: 'a mensagem é obrigatória' }, { status: 400 })

  // Dois modos: (A) a partir de uma CONVERSA (BotaoCobrar) — deriva cliente+atendente do
  // protocolo; (B) DIRETO da página — informa o colaborador e, opcionalmente, o cliente
  // (que liga ao atendimento aberto mais recente dele, p/ contexto + fecha-sozinho).
  let empresa_id: string | null = null
  let cliente_id: string | null = null
  let colaborador_id: string | null = null
  let colaborador_nome: string | null = null
  let protocolo_id: string | null = null

  if (protocoloId) {
    const { data: proto } = await supabase
      .from('at_protocolos')
      .select('id, empresa_id, cliente_id, responsavel_id, atendente_nome')
      .eq('id', protocoloId)
      .maybeSingle()
    if (!proto) return NextResponse.json({ erro: 'protocolo não encontrado' }, { status: 404 })
    const p = proto as { empresa_id?: string; cliente_id?: string; responsavel_id?: string; atendente_nome?: string }
    protocolo_id = protocoloId
    empresa_id = p.empresa_id ?? null
    cliente_id = p.cliente_id ?? null
    colaborador_id = p.responsavel_id ?? null
    colaborador_nome = p.atendente_nome ?? null
  } else {
    colaborador_id = (body.colaborador_id ?? '').trim() || null
    if (!colaborador_id) return NextResponse.json({ erro: 'informe o colaborador' }, { status: 400 })
    const { data: col } = await supabase.from('at_colaboradores').select('nome').eq('id', colaborador_id).maybeSingle()
    colaborador_nome = (col as { nome?: string } | null)?.nome ?? (body.colaborador_nome ?? null)
    const cliDireto = (body.cliente_id ?? '').trim()
    if (cliDireto) {
      cliente_id = cliDireto
      const { data: proto } = await supabase
        .from('at_protocolos')
        .select('id, empresa_id')
        .eq('cliente_id', cliDireto)
        .in('status_multi360', STATUS_ABERTAS)
        .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()
      if (proto) {
        protocolo_id = (proto as { id: string }).id
        empresa_id = (proto as { empresa_id?: string }).empresa_id ?? null
      }
    }
  }

  const { data: nova, error } = await supabase
    .from('at_cobrancas')
    .insert({
      empresa_id,
      protocolo_id,
      cliente_id,
      colaborador_id,
      colaborador_nome,
      criado_por: user.id,
      criado_por_nome: perfil?.nome ?? null,
      mensagem,
      prazo: body.prazo ? new Date(body.prazo).toISOString() : null,
      modelo_id: body.modelo_id || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  // Conta o uso do modelo (best-effort: se falhar, a cobrança já foi criada).
  if (body.modelo_id) {
    const { data: m } = await supabase.from('at_modelos_cobranca').select('vezes_usado').eq('id', body.modelo_id).maybeSingle()
    const usos = (m as { vezes_usado?: number } | null)?.vezes_usado
    if (typeof usos === 'number') {
      await supabase.from('at_modelos_cobranca').update({ vezes_usado: usos + 1 }).eq('id', body.modelo_id)
    }
  }

  return NextResponse.json({ ok: true, id: nova?.id })
}

export async function PATCH(req: Request) {
  const { supabase, user, perfil, poderes } = await usuarioAtual()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })

  let body: { id?: string; acao?: string; nota?: string; mensagem?: string; prazo?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }
  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  // EDITAR: muda o texto/prazo de uma cobrança já criada (só quem cobra).
  if (body.acao === 'editar') {
    if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite editar cobranças' }, { status: 403 })
    const mensagem = (body.mensagem ?? '').trim()
    if (!mensagem) return NextResponse.json({ erro: 'a mensagem não pode ficar vazia' }, { status: 400 })
    const { error } = await supabase
      .from('at_cobrancas')
      .update({
        mensagem,
        prazo: body.prazo ? new Date(body.prazo).toISOString() : null,
        editado_em: new Date().toISOString(),
        editado_por: user.id,
        editado_por_nome: perfil?.nome ?? null,
      })
      .eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // REABRIR: volta uma resolvida/cancelada para aberta (só quem cobra).
  if (body.acao === 'reabrir') {
    if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite reabrir cobranças' }, { status: 403 })
    const { error } = await supabase
      .from('at_cobrancas')
      .update({ status: 'ABERTA', resolvido_por: null, resolvido_em: null, nota_resolucao: null })
      .eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // RESOLVER (o colaborador cobrado ou quem cobra) / CANCELAR (só quem cobra).
  const acao = body.acao === 'cancelar' ? 'CANCELADA' : 'RESOLVIDA'
  if (acao === 'CANCELADA' && !poderes.cobrar) {
    return NextResponse.json({ erro: 'seu papel não permite cancelar cobranças' }, { status: 403 })
  }
  // Quem não cobra (atendente) só resolve as cobranças dirigidas a ele.
  if (!poderes.cobrar) {
    const { data: alvo } = await supabase.from('at_cobrancas').select('colaborador_id').eq('id', id).maybeSingle()
    const dono = (alvo as { colaborador_id?: string } | null)?.colaborador_id ?? null
    if (!dono || !perfil?.at_colaborador_id || dono !== perfil.at_colaborador_id) {
      return NextResponse.json({ erro: 'esta cobrança não é sua' }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('at_cobrancas')
    .update({
      status: acao,
      resolvido_por: user.id,
      resolvido_em: new Date().toISOString(),
      nota_resolucao: (body.nota ?? '').trim() || null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { supabase, user, poderes } = await usuarioAtual()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  if (!poderes.cobrar) return NextResponse.json({ erro: 'seu papel não permite excluir cobranças' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ erro: 'id é obrigatório' }, { status: 400 })

  const { error } = await supabase.from('at_cobrancas').delete().eq('id', id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
