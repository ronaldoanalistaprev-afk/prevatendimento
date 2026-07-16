// ─── Tipos do domínio (CRI — orientado à Pessoa) ────────────────────────

/**
 * Papel do login. Os 4 de fábrica estão listados para o editor sugerir, mas o
 * Administrador pode criar outros na tela Configurações → Papéis — por isso
 * qualquer texto é aceito.
 */
export type UsuarioRole = 'ADMIN' | 'GESTOR' | 'SUPERVISOR' | 'COLABORADOR' | (string & {})

/** Estágio da Jornada da Pessoa. NUNCA usar "Lead" — usar "Pretenso Cliente". */
export type EstagioJornada =
  | 'DESCONHECIDO'
  | 'PRETENSO_CLIENTE'
  | 'CLIENTE'
  | 'CLIENTE_ATIVO'
  | 'EX_CLIENTE'

export type TipoIdentificador =
  | 'WHATSAPP' | 'TELEFONE' | 'EMAIL' | 'CPF' | 'CNPJ'
  | 'NIT' | 'PIS' | 'PASEP' | 'NB'
  | 'INSTAGRAM' | 'FACEBOOK' | 'TELEGRAM' | 'OUTRO'

export type Canal = 'whatsapp' | 'instagram'
export type QuemRespondeu = 'CLIENTE' | 'COLABORADOR'
export type ConversaStatus = 'ABERTA' | 'RESPONDIDA' | 'FECHADA' | 'PENDENTE'
export type MensagemTipo = 'texto' | 'imagem' | 'arquivo' | 'video' | 'audio'
export type NivelUrgencia = 'CRÍTICO' | 'URGENTE' | 'ALTO' | 'NORMAL'

export interface Empresa {
  id: string
  slug: string
  nome: string
  ativo: boolean
}

export interface Usuario {
  id: string
  empresa_id: string | null
  email: string
  nome: string
  telefone: string | null
  role: UsuarioRole
  at_colaborador_id: string | null
  ativo: boolean
  created_at: string
}

export interface Pessoa {
  id: string
  empresa_id: string
  nome: string
  estagio: EstagioJornada
  provisorio: boolean
  responsavel_id: string | null
  responsavel_nome: string | null
  flag_sem_resposta: boolean
  flag_urgente: boolean
  flag_arquivado: boolean
  data_primeiro_contato: string | null
  data_ultima_msg: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Identificador {
  id: string
  empresa_id: string
  pessoa_id: string
  tipo: TipoIdentificador
  valor: string
  rotulo: string | null
  principal: boolean
  verificado: boolean
  confianca: number
  origem: string | null
  created_at: string
}

export interface Conversa {
  id: string
  empresa_id: string | null
  pessoa_id: string
  canal: Canal
  instancia: string | null
  ultima_resposta_quem: QuemRespondeu | null
  ultimo_respondido_por: string | null
  ultimo_respondido_por_nome: string | null
  data_inicio: string | null
  data_ultima_msg_cliente: string | null
  data_ultima_resposta_colaborador: string | null
  tempo_sem_resposta_horas: number
  status: ConversaStatus
  assunto: string | null
  notas_internas: string | null
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  quem: QuemRespondeu
  enviado_por: string | null
  enviado_por_nome: string | null
  conteudo: string
  tipo: MensagemTipo
  arquivo_url: string | null
  arquivo_nome: string | null
  external_message_id: string | null
  external_status: string | null
  created_at: string
  timestamp_recebido: string | null
}

/** Linha da view v_conversas_pendentes */
export interface ConversaPendente {
  id: string
  pessoa_id: string
  pessoa_nome: string
  estagio: EstagioJornada
  canal: Canal
  instancia: string | null
  ultima_resposta_quem: QuemRespondeu | null
  tempo_sem_resposta_horas: number
  status: ConversaStatus
  ultimo_respondido_por: string | null
  ultimo_respondido_por_nome: string | null
  data_ultima_msg_cliente: string | null
  data_ultima_resposta_colaborador: string | null
  created_at: string
  nivel_urgencia: NivelUrgencia
}

/** Pessoa com o resumo dos principais identificadores (para listas). */
export interface PessoaComIdentificadores extends Pessoa {
  whatsapp_principal: string | null
  telefone: string | null
  cpf: string | null
}

// ─── Motor de Eventos / Linha do Tempo Única ────────────────────────────
export type TipoEvento =
  | 'mensagem_recebida'
  | 'mensagem_enviada'
  | 'nota_interna'
  | 'ligacao'
  | 'documento'
  | 'mudanca_estagio'
  | 'contato_criado'
  | 'life_event'

export type AtorTipo = 'CLIENTE' | 'COLABORADOR' | 'SISTEMA'

export interface Evento {
  id: string
  empresa_id: string
  pessoa_id: string
  tipo: TipoEvento
  canal: string | null
  titulo: string | null
  conteudo: string | null
  ator_tipo: AtorTipo | null
  ator_id: string | null
  ator_nome: string | null
  conversa_id: string | null
  mensagem_id: string | null
  metadata: Record<string, unknown> | null
  ocorrido_em: string
  created_at: string
}

// ─── Objetivos & Missões (Fase 3) ───────────────────────────────────────
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
export type ObjetivoStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ABANDONADO' | 'FUTURO'
export type MissaoStatus =
  | 'CRIADA' | 'EM_EXECUCAO' | 'AGUARDANDO_CLIENTE' | 'AGUARDANDO_TERCEIROS'
  | 'AGUARDANDO_INSS' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'

// ─── Referência previdenciária global (canônica) ────────────────────────
export type Regime = 'RGPS' | 'RPPS' | 'RGPS_RPPS'

export interface RefTipoBeneficio {
  id: string
  regime: Regime
  codigo: string | null   // código INSS (só RGPS)
  nome: string
  exige_modalidade: boolean
  ativo: boolean
  ordem: number
}

export interface RefTipoServico {
  id: string
  regime: Regime
  nome: string
  ativo: boolean
  ordem: number
}

export interface RefFase {
  id: string
  ordem: number
  nome: string
  orgao: string
}

export interface Missao {
  id: string
  empresa_id: string
  pessoa_id: string
  objetivo_id: string | null
  titulo: string
  status: MissaoStatus
  momento: string | null
  dono_id: string | null
  dono_nome: string | null
  prioridade: Prioridade
  risco: number
  ordem: number
  created_at: string
  updated_at: string
}

export interface Objetivo {
  id: string
  empresa_id: string
  pessoa_id: string
  titulo: string
  objeto_categoria: 'BENEFICIO' | 'SERVICO' | null
  regime: Regime | null
  tipo_beneficio_id: string | null
  tipo_servico_id: string | null
  status: ObjetivoStatus
  prioridade: Prioridade
  descricao: string | null
  previsao_conclusao: string | null
  created_at: string
  updated_at: string
}

export interface ObjetivoComMissoes extends Objetivo {
  missoes: Missao[]
  beneficio?: { codigo: string | null; nome: string; regime: Regime } | null
  servico?: { nome: string; regime: Regime } | null
}
