// Regras de papel PURAS (sem código de servidor) — podem ser usadas em
// componentes client (Sidebar) e server (páginas).
import type { UsuarioRole } from '@/lib/tipos'

/** Um papel (cargo) do sistema. Os de fábrica não podem ser excluídos. */
export interface PapelDef {
  codigo: string
  nome: string
  descricao: string | null
  /** Papel de fábrica: não pode ser excluído. */
  sistema: boolean
  /** Vê as conversas de todos (false = só as suas). */
  pode_ver_tudo: boolean
  /** Cria, edita, cancela e exclui cobranças. */
  pode_cobrar: boolean
  ativo: boolean
  ordem: number
}

/**
 * Papéis de fábrica — os mesmos poderes que o código aplicava fixo antes de a
 * tabela at_papeis existir. Servem de reserva se a tabela ainda não foi criada.
 */
export const PAPEIS_FABRICA: PapelDef[] = [
  { codigo: 'ADMIN', nome: 'Administrador', descricao: 'Dono do sistema. Cadastra e remove logins, define papéis e permissões. Garante que só as pessoas certas tenham acesso.', sistema: true, pode_ver_tudo: true, pode_cobrar: true, ativo: true, ordem: 1 },
  { codigo: 'GESTOR', nome: 'Gestor', descricao: 'Responsável pelo resultado. Enxerga a operação inteira e o desempenho de cada atendente; age sobre padrões e gargalos. Também pode cobrar.', sistema: true, pode_ver_tudo: true, pode_cobrar: true, ativo: true, ordem: 2 },
  { codigo: 'SUPERVISOR', nome: 'Supervisor', descricao: 'Guardião das respostas. Vigia a fila, identifica quem ficou sem resposta e cobra o atendente responsável até resolver.', sistema: true, pode_ver_tudo: true, pode_cobrar: true, ativo: true, ordem: 3 },
  { codigo: 'COLABORADOR', nome: 'Atendente', descricao: 'Linha de frente. Responde os próprios clientes, dá sequência a cada conversa e resolve as cobranças que recebe.', sistema: true, pode_ver_tudo: false, pode_cobrar: false, ativo: true, ordem: 4 },
]

export const soAdmin = (r: UsuarioRole) => r === 'ADMIN'
export const ehGestor = (r: UsuarioRole) => r === 'ADMIN' || r === 'GESTOR'
/** Reserva (usada se at_papeis não existir): supervisor, gestor e admin veem todas as conversas. */
export const podeVerTudo = (r: UsuarioRole) => r === 'ADMIN' || r === 'GESTOR' || r === 'SUPERVISOR'
/** Reserva: colaborador vê apenas as próprias conversas. */
export const soAsMinhas = (r: UsuarioRole) => !podeVerTudo(r)

export const ROTULO_PAPEL: Record<string, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  SUPERVISOR: 'Supervisor',
  COLABORADOR: 'Atendente',
}

/** Rótulo do papel; para papéis criados pelo admin, usa a lista vinda do banco. */
export function rotuloPapel(codigo: string, papeis?: PapelDef[]): string {
  const achado = papeis?.find((p) => p.codigo === codigo)
  return achado?.nome ?? ROTULO_PAPEL[codigo] ?? codigo
}
