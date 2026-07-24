// Telas cujo acesso o Administrador pode configurar por papel (matriz de permissões).
// PURO (sem código de servidor) — usado no client (editor) e no server (guardas).

export interface TelaConfig {
  chave: string
  label: string
  descricao: string
}

export const TELAS: TelaConfig[] = [
  { chave: 'inicio', label: 'Início', descricao: 'O painel: a situação do escritório e o que precisa de decisão' },
  { chave: 'monitor', label: 'Monitor', descricao: 'As conversas do Multi360' },
  { chave: 'cobrancas', label: 'Cobranças', descricao: 'Painel de cobrança / minhas cobranças' },
  { chave: 'modelos', label: 'Modelos de cobrança', descricao: 'Os textos prontos usados na hora de cobrar' },
  { chave: 'auditoria', label: 'Auditoria', descricao: 'Quem ficou sem resposta' },
  { chave: 'desempenho', label: 'Desempenho', descricao: 'Métricas da equipe' },
  { chave: 'colaboradores', label: 'Colaboradores', descricao: 'Equipe e acessos' },
  { chave: 'configuracoes', label: 'Configurações', descricao: 'Sistema, permissões e catálogo' },
]

// Papéis configuráveis de fábrica (o ADMIN sempre vê tudo e não entra na matriz).
// Reserva: a lista de verdade vem de at_papeis (Configurações → Papéis).
export const PAPEIS_CONFIG = ['COLABORADOR', 'SUPERVISOR', 'GESTOR'] as const

export const ROTULO_PAPEL_CONFIG: Record<string, string> = {
  COLABORADOR: 'Atendente',
  SUPERVISOR: 'Supervisor',
  GESTOR: 'Gestor',
}

// Padrão de fábrica: quais papéis veem cada tela (usado enquanto o Admin não configurar).
export const PERMISSOES_PADRAO: Record<string, string[]> = {
  // O colaborador não vê o Início: a home dele é o Monitor (ele age em conversa,
  // não em média da equipe). A página redireciona quem não enxerga tudo.
  inicio: ['SUPERVISOR', 'GESTOR'],
  monitor: ['COLABORADOR', 'SUPERVISOR', 'GESTOR'],
  cobrancas: ['COLABORADOR', 'SUPERVISOR', 'GESTOR'],
  modelos: ['SUPERVISOR', 'GESTOR'],
  auditoria: ['SUPERVISOR', 'GESTOR'],
  desempenho: ['SUPERVISOR', 'GESTOR'],
  colaboradores: ['GESTOR'],
  configuracoes: ['GESTOR'],
}
