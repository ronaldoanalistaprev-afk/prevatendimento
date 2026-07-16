import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'

/** Texto pré-escrito de cobrança (o supervisor escolhe em vez de digitar tudo de novo). */
export interface ModeloCobranca {
  id: string
  titulo: string
  texto: string
  /** Prazo sugerido, de 1 a 5 dias (opcional). */
  prazo_dias: number | null
  ativo: boolean
  ordem: number
  vezes_usado: number
  criado_por_nome: string | null
  criado_em: string
  atualizado_em: string | null
}

/**
 * Modelos de cobrança. `somenteAtivos` para a hora de cobrar; a tela de
 * configuração mostra também os desativados.
 * Retorna [] se a tabela ainda não existir (SQL não colado) — a tela de cobrar
 * continua funcionando com texto livre.
 */
export async function getModelosCobranca(somenteAtivos = true): Promise<ModeloCobranca[]> {
  if (!bancoConfigurado()) return []
  try {
    const supabase = await createClient()
    let q = supabase.from('at_modelos_cobranca').select('*')
    if (somenteAtivos) q = q.eq('ativo', true)
    const { data, error } = await q.order('ordem', { ascending: true }).order('criado_em', { ascending: true })
    if (error) return []
    return (data ?? []) as ModeloCobranca[]
  } catch {
    return []
  }
}
