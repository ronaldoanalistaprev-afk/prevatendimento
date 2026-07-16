import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'
import { PERMISSOES_PADRAO } from '@/lib/telas'
import type { UsuarioRole } from '@/lib/tipos'

export type MapaPermissoes = Record<string, Set<string>>

/**
 * Mapa de permissões {tela → papéis que veem}.
 * Se a tabela at_permissoes tiver dados, ela manda; senão, usa o padrão de fábrica.
 */
export async function getPermissoesMapa(): Promise<MapaPermissoes> {
  const padrao: MapaPermissoes = {}
  for (const [tela, papeis] of Object.entries(PERMISSOES_PADRAO)) padrao[tela] = new Set(papeis)
  if (!bancoConfigurado()) return padrao
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('at_permissoes').select('tela, role, permitido')
    if (error || !data || data.length === 0) return padrao
    // banco é a verdade: começa vazio e adiciona só os permitidos
    const mapa: MapaPermissoes = {}
    for (const tela of Object.keys(PERMISSOES_PADRAO)) mapa[tela] = new Set()
    for (const r of data as { tela: string; role: string; permitido: boolean }[]) {
      if (!mapa[r.tela]) mapa[r.tela] = new Set()
      if (r.permitido) mapa[r.tela].add(r.role)
    }
    return mapa
  } catch {
    return padrao
  }
}

/** O papel pode acessar a tela? ADMIN sempre pode. */
export function podeAcessar(mapa: MapaPermissoes, tela: string, role: UsuarioRole): boolean {
  if (role === 'ADMIN') return true
  return mapa[tela]?.has(role) ?? false
}
