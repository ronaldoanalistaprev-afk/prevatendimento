import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'
import { PAPEIS_FABRICA, type PapelDef } from '@/lib/papeis'

/**
 * Papéis do sistema. Quem manda é a tabela at_papeis (o Administrador edita em
 * Configurações → Papéis). Se a tabela ainda não existir, usa os 4 de fábrica —
 * assim o sistema nunca fica sem papel nenhum.
 */
export async function getPapeis(incluirInativos = false): Promise<PapelDef[]> {
  if (!bancoConfigurado()) return PAPEIS_FABRICA
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('at_papeis').select('*').order('ordem', { ascending: true })
    if (error || !data || data.length === 0) return PAPEIS_FABRICA
    const papeis = data as PapelDef[]
    return incluirInativos ? papeis : papeis.filter((p) => p.ativo)
  } catch {
    return PAPEIS_FABRICA
  }
}

export interface Poderes {
  /** Vê as conversas de todos (false = só as suas). */
  verTudo: boolean
  /** Cria, edita, cancela e exclui cobranças. */
  cobrar: boolean
}

/** Poderes de um papel. O ADMIN sempre pode tudo, aconteça o que acontecer. */
export function poderesDo(codigo: string, papeis: PapelDef[]): Poderes {
  if (codigo === 'ADMIN') return { verTudo: true, cobrar: true }
  const p = papeis.find((x) => x.codigo === codigo)
  // Papel desconhecido (ex.: excluído depois de atribuído) ou desativado = o mínimo de acesso.
  if (!p || !p.ativo) return { verTudo: false, cobrar: false }
  return { verTudo: p.pode_ver_tudo, cobrar: p.pode_cobrar }
}
