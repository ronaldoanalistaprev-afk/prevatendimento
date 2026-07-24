import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'

export type CobrancaStatus = 'ABERTA' | 'RESOLVIDA' | 'CANCELADA'

export interface Cobranca {
  id: string
  protocolo_id: string | null
  cliente_id: string | null
  colaborador_id: string | null
  colaborador_nome: string | null
  criado_por: string | null
  criado_por_nome: string | null
  mensagem: string
  prazo: string | null
  status: CobrancaStatus
  resolvido_por: string | null
  resolvido_em: string | null
  nota_resolucao: string | null
  criado_em: string
  editado_em?: string | null
  editado_por_nome?: string | null
  // embutidos
  at_clientes?: { nome?: string | null; telefone?: string | null } | null
  at_protocolos?: { numero_protocolo?: string | null; departamento?: string | null; status_multi360?: string | null } | null
}

const SELECT =
  '*, at_clientes(nome, telefone), at_protocolos(numero_protocolo, departamento, status_multi360)'

/** 'TODAS' = qualquer situação (o histórico). */
export type FiltroStatus = CobrancaStatus | 'TODAS'

export const ROTULO_STATUS: Record<CobrancaStatus, string> = {
  ABERTA: 'A resolver',
  RESOLVIDA: 'Resolvida',
  CANCELADA: 'Cancelada',
}

/** Cobranças de todos (visão do supervisor/gestor). Abertas por padrão. */
export async function getCobrancas(status: FiltroStatus = 'ABERTA'): Promise<Cobranca[]> {
  if (!bancoConfigurado()) return []
  try {
    const supabase = await createClient()
    let q = supabase.from('at_cobrancas').select(SELECT)
    if (status !== 'TODAS') q = q.eq('status', status)
    // Abertas: quem vence primeiro no topo. Histórico: mais recente no topo.
    q = status === 'ABERTA' ? q.order('prazo', { ascending: true, nullsFirst: false }) : q.order('criado_em', { ascending: false })
    const { data } = await q.order('criado_em', { ascending: false }).limit(500)
    return (data ?? []) as Cobranca[]
  } catch {
    return []
  }
}

/** Cobranças de um colaborador específico ("Minhas cobranças"). */
export async function getMinhasCobrancas(colaboradorId: string | null, status: FiltroStatus = 'ABERTA'): Promise<Cobranca[]> {
  if (!bancoConfigurado() || !colaboradorId) return []
  try {
    const supabase = await createClient()
    let q = supabase.from('at_cobrancas').select(SELECT).eq('colaborador_id', colaboradorId)
    if (status !== 'TODAS') q = q.eq('status', status)
    q = status === 'ABERTA' ? q.order('prazo', { ascending: true, nullsFirst: false }) : q.order('criado_em', { ascending: false })
    const { data } = await q.order('criado_em', { ascending: false }).limit(500)
    return (data ?? []) as Cobranca[]
  } catch {
    return []
  }
}

export interface LinhaAtendenteCobranca {
  nome: string
  criadas: number
  resolvidas: number
  abertas: number
  canceladas: number
  atrasadas: number
  /** Horas médias entre a cobrança e a resposta ao cliente. */
  tempoMedioHoras: number | null
}

export interface MetricasCobranca {
  periodoDias: number
  criadas: number
  abertas: number
  resolvidas: number
  canceladas: number
  /** Abertas cujo prazo já venceu. */
  atrasadas: number
  /** Das criadas no período, quantas % já foram resolvidas. */
  taxaResolucao: number
  tempoMedioHoras: number | null
  porAtendente: LinhaAtendenteCobranca[]
  temDados: boolean
}

const HORA_MS = 3_600_000

/**
 * Métricas das cobranças criadas nos últimos `dias`.
 * Agrega no servidor (volume é pequeno: cobranças são criadas à mão).
 */
export async function getMetricasCobrancas(dias = 30): Promise<MetricasCobranca> {
  const vazio: MetricasCobranca = {
    periodoDias: dias, criadas: 0, abertas: 0, resolvidas: 0, canceladas: 0,
    atrasadas: 0, taxaResolucao: 0, tempoMedioHoras: null, porAtendente: [], temDados: false,
  }
  if (!bancoConfigurado()) return vazio
  try {
    const supabase = await createClient()
    const desde = new Date(Date.now() - dias * 24 * HORA_MS).toISOString()
    const { data, error } = await supabase
      .from('at_cobrancas')
      .select('colaborador_nome, status, prazo, criado_em, resolvido_em')
      .gte('criado_em', desde)
      .limit(2000)
    if (error || !data) return vazio

    type Linha = { colaborador_nome: string | null; status: CobrancaStatus; prazo: string | null; criado_em: string; resolvido_em: string | null }
    const linhas = data as Linha[]
    const agora = Date.now()
    const atrasou = (l: Linha) => l.status === 'ABERTA' && !!l.prazo && new Date(l.prazo).getTime() < agora
    const duracao = (l: Linha) =>
      l.status === 'RESOLVIDA' && l.resolvido_em ? (new Date(l.resolvido_em).getTime() - new Date(l.criado_em).getTime()) / HORA_MS : null

    const media = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : null)

    const porNome = new Map<string, Linha[]>()
    for (const l of linhas) {
      const nome = l.colaborador_nome ?? 'Sem atendente'
      porNome.set(nome, [...(porNome.get(nome) ?? []), l])
    }

    const porAtendente: LinhaAtendenteCobranca[] = [...porNome.entries()]
      .map(([nome, ls]) => ({
        nome,
        criadas: ls.length,
        resolvidas: ls.filter((l) => l.status === 'RESOLVIDA').length,
        abertas: ls.filter((l) => l.status === 'ABERTA').length,
        canceladas: ls.filter((l) => l.status === 'CANCELADA').length,
        atrasadas: ls.filter(atrasou).length,
        tempoMedioHoras: media(ls.map(duracao).filter((n): n is number => n !== null)),
      }))
      .sort((a, b) => b.criadas - a.criadas)

    const resolvidas = linhas.filter((l) => l.status === 'RESOLVIDA').length
    return {
      periodoDias: dias,
      criadas: linhas.length,
      abertas: linhas.filter((l) => l.status === 'ABERTA').length,
      resolvidas,
      canceladas: linhas.filter((l) => l.status === 'CANCELADA').length,
      atrasadas: linhas.filter(atrasou).length,
      taxaResolucao: linhas.length ? Math.round((resolvidas / linhas.length) * 100) : 0,
      tempoMedioHoras: media(linhas.map(duracao).filter((n): n is number => n !== null)),
      porAtendente,
      temDados: linhas.length > 0,
    }
  } catch {
    return vazio
  }
}

/** Contadores rápidos para o menu/cards. */
export async function contarCobrancas(): Promise<{ abertas: number }> {
  if (!bancoConfigurado()) return { abertas: 0 }
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('at_cobrancas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ABERTA')
    return { abertas: count ?? 0 }
  } catch {
    return { abertas: 0 }
  }
}
