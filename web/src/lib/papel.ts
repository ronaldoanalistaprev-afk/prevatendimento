import { createClient } from '@/lib/supabase/server'
import { getPapeis, poderesDo } from '@/lib/poderes'
import { rotuloPapel } from '@/lib/papeis'
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
  email: string | null
  /** Login ativo? Desativado perde o acesso na hora, mesmo com a sessão aberta. */
  ativo: boolean
  /** Nome do papel como aparece na tela ("Supervisor"), já resolvido. */
  rotulo: string
  /** Momento do último login — serve para mostrar há quanto tempo a pessoa está no sistema. */
  entrouEm: string | null
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
  email: null,
  ativo: true,
  rotulo: 'Colaborador',
  entrouEm: null,
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
        .select('nome, role, ativo, at_colaborador_id, at_colaboradores(nome)')
        .eq('id', user.id)
        .maybeSingle(),
      getPapeis(true),
    ])
    const entrouEm = (user.last_sign_in_at as string | undefined) ?? null
    if (!data) return { ...FALLBACK, id: user.id, email: user.email ?? null, entrouEm }
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
      email: user.email ?? null,
      ativo: (data.ativo as boolean | null) !== false,
      rotulo: rotuloPapel(role, papeis),
      entrouEm,
      verTudo: poderes.verTudo,
      cobrar: poderes.cobrar,
    }
  } catch {
    return FALLBACK
  }
}
