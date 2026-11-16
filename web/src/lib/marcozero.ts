import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'

/**
 * Marco Zero — acompanhamento do reengajamento em lotes.
 * O status de cada pessoa é CALCULADO ao vivo pela view v_at_marco_zero
 * (lendo o que o leitor traz do Multi360). Aqui só lemos e agregamos.
 */

export type MarcoZeroStatus =
  | 'AGUARDANDO_RESPOSTA' // enviado, ainda dentro do prazo, sem resposta
  | 'RESPONDEU' // voltou a falar, aguardando o atendente
  | 'ATENDIDO' // voltou e já foi respondido
  | 'SEM_RESPOSTA' // passou do prazo (7 dias) sem responder

export interface MarcoZeroItem {
  id: string
  lote: number
  enviado_em: string
  protocolo_id: string | null
  protocolo_link: string | null
  cliente_id: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  departamento: string | null
  atendente_nome: string | null
  respondeu: boolean
  atendido: boolean
  status_calc: MarcoZeroStatus
  respondeu_em: string | null
  ultima_atividade_em: string | null
}

export interface MarcoZeroLoteResumo {
  lote: number
  enviado_em: string | null
  enviados: number
  responderam: number
  atendidos: number
  aguardandoAtendimento: number
  semResposta: number
  aguardandoResposta: number
}

export interface MarcoZeroResumo {
  enviados: number
  responderam: number
  atendidos: number
  /** Voltaram a falar mas ainda NÃO foram atendidos — é o freio do plano. */
  aguardandoAtendimento: number
  semResposta: number
  aguardandoResposta: number
  /** % de quem respondeu sobre quem foi contatado. */
  taxaResposta: number
  lotes: MarcoZeroLoteResumo[]
  /** Verdadeiro quando ninguém está aguardando atendimento (pode liberar o próximo lote). */
  podeLiberarProximo: boolean
  temDados: boolean
}

export interface MarcoZero {
  itens: MarcoZeroItem[]
  resumo: MarcoZeroResumo
}

function zerarResumo(): MarcoZeroResumo {
  return {
    enviados: 0, responderam: 0, atendidos: 0, aguardandoAtendimento: 0,
    semResposta: 0, aguardandoResposta: 0, taxaResposta: 0, lotes: [],
    podeLiberarProximo: false, temDados: false,
  }
}

/** Carrega toda a coorte (ordenada por lote e por maior espera) + o resumo agregado. */
export async function getMarcoZero(): Promise<MarcoZero> {
  if (!bancoConfigurado()) return { itens: [], resumo: zerarResumo() }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('v_at_marco_zero')
      .select('*')
      .order('lote', { ascending: false })
      .order('enviado_em', { ascending: true })
      .limit(4000)
    const itens = (data ?? []) as MarcoZeroItem[]

    const resumo = zerarResumo()
    resumo.enviados = itens.length
    resumo.temDados = itens.length > 0

    const porLote = new Map<number, MarcoZeroLoteResumo>()
    for (const it of itens) {
      if (it.status_calc === 'RESPONDEU') resumo.aguardandoAtendimento++
      if (it.status_calc === 'ATENDIDO') resumo.atendidos++
      if (it.status_calc === 'SEM_RESPOSTA') resumo.semResposta++
      if (it.status_calc === 'AGUARDANDO_RESPOSTA') resumo.aguardandoResposta++
      if (it.respondeu) resumo.responderam++

      const l = porLote.get(it.lote) ?? {
        lote: it.lote, enviado_em: it.enviado_em, enviados: 0, responderam: 0,
        atendidos: 0, aguardandoAtendimento: 0, semResposta: 0, aguardandoResposta: 0,
      }
      l.enviados++
      if (it.respondeu) l.responderam++
      if (it.status_calc === 'ATENDIDO') l.atendidos++
      if (it.status_calc === 'RESPONDEU') l.aguardandoAtendimento++
      if (it.status_calc === 'SEM_RESPOSTA') l.semResposta++
      if (it.status_calc === 'AGUARDANDO_RESPOSTA') l.aguardandoResposta++
      // enviado_em do lote = o mais antigo (todos são ~iguais no mesmo lote)
      if (it.enviado_em && (!l.enviado_em || it.enviado_em < l.enviado_em)) l.enviado_em = it.enviado_em
      porLote.set(it.lote, l)
    }

    resumo.lotes = [...porLote.values()].sort((a, b) => b.lote - a.lote)
    resumo.taxaResposta = resumo.enviados ? Math.round((resumo.responderam / resumo.enviados) * 100) : 0
    resumo.podeLiberarProximo = resumo.enviados > 0 && resumo.aguardandoAtendimento === 0

    return { itens, resumo }
  } catch {
    return { itens: [], resumo: zerarResumo() }
  }
}

export const ROTULO_MZ_STATUS: Record<MarcoZeroStatus, string> = {
  AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  RESPONDEU: 'Respondeu — atender',
  ATENDIDO: 'Atendido',
  SEM_RESPOSTA: 'Sem resposta',
}
