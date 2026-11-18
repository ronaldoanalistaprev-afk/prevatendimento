import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'

/**
 * Quando o leitor do Multi360 sincronizou pela última vez (camada A = lista de conversas).
 * É o mesmo dado que o Monitor já mostrava; virou função própria para as demais telas usarem.
 */
async function getUltimaAtualizacaoSemCache(): Promise<string | null> {
  if (!bancoConfigurado()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('at_extracao_log')
      .select('executado_em')
      .eq('camada', 'A')
      .order('executado_em', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as { executado_em?: string } | null)?.executado_em ?? null
  } catch {
    return null
  }
}

export const getUltimaAtualizacao = cache(getUltimaAtualizacaoSemCache)

/**
 * O leitor roda a cada 15 minutos (POLL_INTERVAL_MIN no multi360-reader) e grava o registro no FIM da rodada.
 * 45 min = três rodadas: cobre uma rodada longa sem acender aviso à toa. Se o intervalo do leitor mudar, ajuste aqui.
 */
export const ATRASO_MAXIMO_MIN = 45
