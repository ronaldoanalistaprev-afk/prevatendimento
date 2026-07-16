import { createClient } from '@/lib/supabase/server'
import { getPapeis, poderesDo } from '@/lib/poderes'
import type { UsuarioRole } from '@/lib/tipos'

// Reexporta as regras puras para quem já importa de '@/lib/papel'.
export { ehGestor, podeVerTudo, soAsMinhas, ROTULO_PAPEL, rotuloPapel } from '@/lib/papeis'

export interface PapelAtual {
  id: string | null
  role: UsuarioRole
  atColaboradorId: string | null
  /** Nome do atendente no Multi360 que este login representa (para quem só vê o dele). */
  colaboradorNome: string | null
  nome: string | null
  /** Vê as conversas de todos? (vem dos poderes do papel, editáveis em Configurações) */
  verTudo: boolean
  /** Pode criar/editar/cancelar cobranças? */
  cobrar: boolean
}

const FALLBACK: PapelAtual = {
  id: null,
  role: 'COLABORADOR',
  atColaboradorId: null,
  colaboradorNome: null,
  nome: null,
  verTudo: false,
  cobrar: false,
}

/** Papel do usuário logado + o atendente do Multi360 vinculado + os poderes do papel. */
export async function getPapelAtual(): Promise<PapelAtual> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return FALLBACK
    const [{ data }, papeis] = await Promise.all([
      supabase
        .from('usuarios')
        .select('nome, role, at_colaborador_id, at_colaboradores(nome)')
        .eq('id', user.id)
        .maybeSingle(),
      getPapeis(true),
    ])
    if (!data) return { ...FALLBACK, id: user.id }
    const rel = (data as { at_colaboradores?: { nome?: string } | { nome?: string }[] }).at_colaboradores
    const colaboradorNome = Array.isArray(rel) ? rel[0]?.nome ?? null : rel?.nome ?? null
    const role = ((data.role as UsuarioRole) ?? 'COLABORADOR') as string
    const poderes = poderesDo(role, papeis)
    return {
      id: user.id,
      role,
      atColaboradorId: (data.at_colaborador_id as string | null) ?? null,
      colaboradorNome,
      nome: (data.nome as string | null) ?? null,
      verTudo: poderes.verTudo,
      cobrar: poderes.cobrar,
    }
  } catch {
    return FALLBACK
  }
}
