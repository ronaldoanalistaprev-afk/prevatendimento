import { createClient } from '@/lib/supabase/server'
import { normalizarFonetico } from '@/lib/utils'
import type {
  Conversa,
  ConversaPendente,
  Pessoa,
  PessoaComIdentificadores,
  Identificador,
  Mensagem,
  Evento,
  Objetivo,
  ObjetivoComMissoes,
  Missao,
  RefTipoBeneficio,
  RefTipoServico,
  RefFase,
} from './tipos'

/**
 * Helpers de leitura para as páginas do dashboard (orientado à Pessoa).
 * Resilientes: se o Supabase não estiver configurado ou a query falhar,
 * retornam vazio em vez de derrubar a página.
 */

export interface EstadoBanco {
  configurado: boolean
  erro: string | null
}

export function bancoConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function getConversasPendentes(): Promise<{
  itens: ConversaPendente[]
  estado: EstadoBanco
}> {
  if (!bancoConfigurado()) return { itens: [], estado: { configurado: false, erro: null } }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('v_conversas_pendentes').select('*').limit(200)
    if (error) return { itens: [], estado: { configurado: true, erro: error.message } }
    return { itens: (data ?? []) as ConversaPendente[], estado: { configurado: true, erro: null } }
  } catch (e) {
    return { itens: [], estado: { configurado: true, erro: (e as Error).message } }
  }
}

export async function getConversas(): Promise<{ itens: ConversaPendente[]; estado: EstadoBanco }> {
  if (!bancoConfigurado()) return { itens: [], estado: { configurado: false, erro: null } }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('v_conversas').select('*').limit(300)
    if (error) return { itens: [], estado: { configurado: true, erro: error.message } }
    return { itens: (data ?? []) as ConversaPendente[], estado: { configurado: true, erro: null } }
  } catch (e) {
    return { itens: [], estado: { configurado: true, erro: (e as Error).message } }
  }
}

export interface Metricas {
  conversasAbertas: number
  semRespostaMais2h: number
  pretensosHoje: number
  totalPessoas: number
}

export async function getMetricas(): Promise<Metricas> {
  const vazio: Metricas = { conversasAbertas: 0, semRespostaMais2h: 0, pretensosHoje: 0, totalPessoas: 0 }
  if (!bancoConfigurado()) return vazio
  try {
    const supabase = await createClient()
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [abertas, pendentes, pessoas, pretensos] = await Promise.all([
      supabase.from('conversas').select('id', { count: 'exact', head: true }).eq('status', 'ABERTA'),
      supabase
        .from('conversas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ABERTA')
        .gt('tempo_sem_resposta_horas', 2),
      supabase.from('pessoas').select('id', { count: 'exact', head: true }),
      supabase
        .from('pessoas')
        .select('id', { count: 'exact', head: true })
        .eq('estagio', 'PRETENSO_CLIENTE')
        .gte('data_primeiro_contato', hoje.toISOString()),
    ])

    return {
      conversasAbertas: abertas.count ?? 0,
      semRespostaMais2h: pendentes.count ?? 0,
      pretensosHoje: pretensos.count ?? 0,
      totalPessoas: pessoas.count ?? 0,
    }
  } catch {
    return vazio
  }
}

export async function getConversa(id: string): Promise<{
  conversa: Conversa | null
  pessoa: Pessoa | null
  identificadores: Identificador[]
  mensagens: Mensagem[]
}> {
  if (!bancoConfigurado()) return { conversa: null, pessoa: null, identificadores: [], mensagens: [] }
  try {
    const supabase = await createClient()
    const { data: conversa } = await supabase.from('conversas').select('*').eq('id', id).single()
    if (!conversa) return { conversa: null, pessoa: null, identificadores: [], mensagens: [] }

    const [{ data: pessoa }, { data: identificadores }, { data: mensagens }] = await Promise.all([
      supabase.from('pessoas').select('*').eq('id', conversa.pessoa_id).single(),
      supabase.from('identificadores').select('*').eq('pessoa_id', conversa.pessoa_id),
      supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', id)
        .order('created_at', { ascending: true }),
    ])

    return {
      conversa: conversa as Conversa,
      pessoa: (pessoa ?? null) as Pessoa | null,
      identificadores: (identificadores ?? []) as Identificador[],
      mensagens: (mensagens ?? []) as Mensagem[],
    }
  } catch {
    return { conversa: null, pessoa: null, identificadores: [], mensagens: [] }
  }
}

export async function getPessoa(id: string): Promise<{
  pessoa: Pessoa | null
  identificadores: Identificador[]
  eventos: Evento[]
  conversas: Conversa[]
  objetivos: ObjetivoComMissoes[]
}> {
  const vazio = { pessoa: null, identificadores: [], eventos: [], conversas: [], objetivos: [] }
  if (!bancoConfigurado()) return vazio
  try {
    const supabase = await createClient()
    const { data: pessoa } = await supabase.from('pessoas').select('*').eq('id', id).single()
    if (!pessoa) return vazio

    const [
      { data: identificadores },
      { data: eventos },
      { data: conversas },
      { data: objetivos },
      { data: missoes },
    ] = await Promise.all([
      supabase.from('identificadores').select('*').eq('pessoa_id', id).order('principal', { ascending: false }),
      supabase.from('eventos').select('*').eq('pessoa_id', id).order('ocorrido_em', { ascending: false }).limit(300),
      supabase.from('conversas').select('*').eq('pessoa_id', id).order('created_at', { ascending: false }),
      supabase
        .from('objetivos')
        .select('*, ref_tipos_beneficio(codigo,nome,regime), ref_tipos_servico(nome,regime)')
        .eq('pessoa_id', id)
        .order('created_at', { ascending: true }),
      supabase.from('missoes').select('*').eq('pessoa_id', id).order('ordem', { ascending: true }),
    ])

    const missoesPorObjetivo = new Map<string, Missao[]>()
    for (const m of (missoes ?? []) as Missao[]) {
      if (!m.objetivo_id) continue
      const arr = missoesPorObjetivo.get(m.objetivo_id) ?? []
      arr.push(m)
      missoesPorObjetivo.set(m.objetivo_id, arr)
    }
    const objetivosComMissoes: ObjetivoComMissoes[] = ((objetivos ?? []) as Record<string, unknown>[]).map((o) => ({
      ...(o as unknown as Objetivo),
      missoes: missoesPorObjetivo.get(o.id as string) ?? [],
      beneficio: (o.ref_tipos_beneficio ?? null) as ObjetivoComMissoes['beneficio'],
      servico: (o.ref_tipos_servico ?? null) as ObjetivoComMissoes['servico'],
    }))

    return {
      pessoa: pessoa as Pessoa,
      identificadores: (identificadores ?? []) as Identificador[],
      eventos: (eventos ?? []) as Evento[],
      conversas: (conversas ?? []) as Conversa[],
      objetivos: objetivosComMissoes,
    }
  } catch {
    return vazio
  }
}

export interface ProtocoloMonitor {
  id: string
  numero_protocolo: string
  departamento: string | null
  atendente_nome: string | null
  status_multi360: string | null
  ultima_mensagem_em: string | null
  ultima_mensagem_direcao: string | null
  possui_anexo: boolean | null
  cliente_nome: string | null
  cliente_telefone: string | null
  ultima_texto: string | null
}

export interface MonitorResumo {
  total: number
  esperando: number         // cliente falou por último → escritório precisa responder
  aguardandoCliente: number // equipe falou por último → aguardando o cliente
  atualizadoEm: string | null
}

// Grupos de situação: por padrão o Monitor mostra só as ABERTAS (dia a dia);
// o gestor pode alternar para Finalizadas ou Todas.
// POTENCIAL = aba "Potenciais" do Multi360 (primeiro contato ainda não distribuído);
// no Multi360 é uma conversa EM ABERTO, e o leitor já a traz como tal — conta como aberta.
export const STATUS_ABERTAS = ['ATIVO', 'AGUARDANDO', 'POTENCIAL']
const MONITOR_POR_PAGINA = 50
// Departamentos do Multi360 (lista fixa — evita varrer a tabela toda só p/ o filtro).
// Reserva (usada só se a lista dinâmica vier vazia). A lista real dos filtros é
// derivada ao vivo das conversas abertas — ver getDepartamentosAbertos() e getMonitorProtocolos.
export const DEPARTAMENTOS_MULTI360 = [
  'Benefícios',
  'Gestão com o cliente',
  'Financeiro',
  'Restituição',
]

/** Departamentos que existem HOJE nas conversas abertas (lista dinâmica p/ filtros). */
export async function getDepartamentosAbertos(): Promise<string[]> {
  if (!bancoConfigurado()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('at_protocolos')
      .select('departamento')
      .in('status_multi360', STATUS_ABERTAS)
      .not('departamento', 'is', null)
      .limit(3000)
    const lista = [...new Set(((data ?? []) as { departamento: string }[]).map((r) => r.departamento).filter(Boolean))]
    return lista.length ? lista.sort((a, b) => a.localeCompare(b, 'pt-BR')) : DEPARTAMENTOS_MULTI360
  } catch {
    return DEPARTAMENTOS_MULTI360
  }
}

/** Contagem de conversas abertas (ativas) e finalizadas (inativas), para os badges do menu.
 *  Respeita o papel: o colaborador conta só as dele (RLS). */
export async function contarConversas(): Promise<{ abertas: number; finalizadas: number }> {
  if (!bancoConfigurado()) return { abertas: 0, finalizadas: 0 }
  try {
    const supabase = await createClient()
    const [ab, fin] = await Promise.all([
      supabase.from('at_protocolos').select('id', { count: 'exact', head: true }).in('status_multi360', STATUS_ABERTAS),
      supabase.from('at_protocolos').select('id', { count: 'exact', head: true }).eq('status_multi360', 'FINALIZADO'),
    ])
    return { abertas: ab.count ?? 0, finalizadas: fin.count ?? 0 }
  } catch {
    return { abertas: 0, finalizadas: 0 }
  }
}

export async function getMonitorProtocolos(dep?: string | string[], periodo?: string, atendente?: string | string[], situacao?: string, busca?: string, competencia?: string, pagina = 1, so?: string, ordem?: string): Promise<{
  itens: ProtocoloMonitor[]
  resumo: MonitorResumo
  departamentos: string[]
  atendentes: string[]
  atendentesComConversa: string[]
  atendentesSemConversa: string[]
  pagina: number
  totalPaginas: number
  estado: EstadoBanco
}> {
  const vazio = { itens: [], resumo: { total: 0, esperando: 0, aguardandoCliente: 0, atualizadoEm: null }, departamentos: [], atendentes: [], atendentesComConversa: [], atendentesSemConversa: [], pagina: 1, totalPaginas: 1, estado: { configurado: false, erro: null } }
  if (!bancoConfigurado()) return vazio
  try {
    const supabase = await createClient()
    const sit = situacao || 'abertas'

    // Corte por competência (mês/ano) tem prioridade; senão, período relativo.
    let corteISO: string | null = null
    let corteFimISO: string | null = null
    if (competencia && /^\d{4}-\d{2}$/.test(competencia)) {
      const [y, m] = competencia.split('-').map(Number)
      const proxAno = m === 12 ? y + 1 : y
      const proxMes = m === 12 ? 1 : m + 1
      corteISO = new Date(`${competencia}-01T00:00:00-03:00`).toISOString()
      corteFimISO = new Date(`${proxAno}-${String(proxMes).padStart(2, '0')}-01T00:00:00-03:00`).toISOString()
    } else if (periodo && periodo !== 'tudo') {
      const dias = periodo === 'hoje' ? 1 : Number(periodo) || 30
      const corte = new Date()
      if (periodo === 'hoje') corte.setHours(0, 0, 0, 0)
      else corte.setDate(corte.getDate() - dias)
      corteISO = corte.toISOString()
    }

    // Termo de busca (nome ou telefone) — limpo p/ não quebrar o filtro .or()
    // Busca tolerante (Doc. Mestre SIAP — Regras 4-7): nome por forma fonética; telefone por dígitos.
    const termoFon = normalizarFonetico(busca || '').replace(/[,%()]/g, '')
    const termoDigitos = (busca || '').replace(/\D/g, '')

    // Setor e atendente aceitam VÁRIOS valores (Regra 57): uma opção = igualdade; várias = IN.
    const deps = (Array.isArray(dep) ? dep : dep ? [dep] : []).filter(Boolean)
    const atendentes_ = (Array.isArray(atendente) ? atendente : atendente ? [atendente] : []).filter(Boolean)

    // Filtros comuns (setor / atendente / período / busca) — reusados em contagens e listagem.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const comuns = (q: any): any => {
      let x = q
      if (deps.length === 1) x = x.eq('departamento', deps[0])
      else if (deps.length > 1) x = x.in('departamento', deps)
      if (atendentes_.length === 1) x = x.eq('atendente_nome', atendentes_[0])
      else if (atendentes_.length > 1) x = x.in('atendente_nome', atendentes_)
      if (corteISO) x = x.gte('ultima_mensagem_em', corteISO)
      if (corteFimISO) x = x.lt('ultima_mensagem_em', corteFimISO)
      if (termoFon || termoDigitos) {
        const conds: string[] = []
        if (termoFon) conds.push(`cliente_nome_normalizado.ilike.%${termoFon}%`)
        if (termoDigitos) conds.push(`cliente_telefone.ilike.%${termoDigitos}%`)
        x = x.or(conds.join(','))
      }
      return x
    }
    const comSituacao = (q: any): any => {
      let x = comuns(q)
      if (sit === 'abertas') x = x.in('status_multi360', STATUS_ABERTAS)
      else if (sit === 'finalizadas') x = x.eq('status_multi360', 'FINALIZADO')
      // Atalhos dos cartões, por QUEM FALOU POR ÚLTIMO:
      //  - "esperando"      = cliente falou por último → escritório precisa responder
      //  - "aguardacliente" = equipe falou por último  → aguardando o cliente
      // ("pendentes" = legado: status AGUARDANDO do Multi360, ainda usado por um link do Início)
      if (so === 'esperando') x = x.in('status_multi360', STATUS_ABERTAS).eq('ultima_mensagem_direcao', 'cliente')
      else if (so === 'aguardacliente') x = x.in('status_multi360', STATUS_ABERTAS).neq('ultima_mensagem_direcao', 'cliente')
      else if (so === 'pendentes') x = x.eq('status_multi360', 'AGUARDANDO')
      return x
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // 1) Total do que está listado (para contagem + paginação)
    const totalRes = await comSituacao(supabase.from('v_at_monitor').select('id', { count: 'exact', head: true }))
    const total = totalRes.count ?? 0
    const totalPaginas = Math.max(1, Math.ceil(total / MONITOR_POR_PAGINA))
    const pag = Math.min(Math.max(1, pagina), totalPaginas)
    const from = (pag - 1) * MONITOR_POR_PAGINA

    // 2) Página de resultados (ordenada no banco)
    // Ordem da lista: padrão "recente" (mais recente primeiro); "antiga" inverte.
    const asc = ordem === 'antiga'
    let rows = comSituacao(supabase.from('v_at_monitor').select('*'))
    if (sit === 'finalizadas' || sit === 'todas') {
      rows = rows.order('ultima_mensagem_em', { ascending: asc, nullsFirst: false })
    } else {
      // abertas: quem espera (cliente falou por último) primeiro; dentro disso, pela ordem escolhida
      rows = rows.order('ultima_mensagem_direcao', { ascending: true, nullsFirst: false }).order('ultima_mensagem_em', { ascending: asc, nullsFirst: false })
    }
    rows = rows.range(from, from + MONITOR_POR_PAGINA - 1)

    // 3) Resumo do backlog ABERTO (sempre sobre conversas abertas, independente da aba)
    const espQ = comuns(supabase.from('v_at_monitor').select('id', { count: 'exact', head: true })).in('status_multi360', STATUS_ABERTAS).eq('ultima_mensagem_direcao', 'cliente')
    // "Aguardando o cliente" = aberta em que a EQUIPE falou por último (não o cliente)
    const aguardaClienteQ = comuns(supabase.from('v_at_monitor').select('id', { count: 'exact', head: true })).in('status_multi360', STATUS_ABERTAS).neq('ultima_mensagem_direcao', 'cliente')

    // atendentes que TÊM conversa aberta agora (p/ separar no filtro)
    const comConvQ = supabase.from('at_protocolos').select('atendente_nome').in('status_multi360', STATUS_ABERTAS).not('atendente_nome', 'is', null).limit(2000)
    // departamentos que EXISTEM nas conversas abertas agora — lista dinâmica (reflete a
    // reorganização de setores no Multi360 sozinha, sem lista fixa que envelhece).
    const depQ = supabase.from('at_protocolos').select('departamento').in('status_multi360', STATUS_ABERTAS).not('departamento', 'is', null).limit(3000)

    const [rowsRes, espRes, aguardaClienteRes, logRes, colabRes, comConvRes, depRes] = await Promise.all([
      rows,
      espQ,
      aguardaClienteQ,
      supabase.from('at_extracao_log').select('executado_em').eq('camada', 'A').order('executado_em', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('at_colaboradores').select('nome').order('nome'),
      comConvQ,
      depQ,
    ])
    if (rowsRes.error) return { ...vazio, estado: { configurado: true, erro: rowsRes.error.message } }

    const departamentos = [...new Set(((depRes.data ?? []) as { departamento: string }[]).map((r) => r.departamento).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    const itens = (rowsRes.data ?? []) as ProtocoloMonitor[]
    const atendentes = ((colabRes.data ?? []) as { nome: string }[]).map((c) => c.nome).filter(Boolean)
    const setComConversa = new Set(((comConvRes.data ?? []) as { atendente_nome: string }[]).map((r) => r.atendente_nome).filter(Boolean))
    const atendentesComConversa = atendentes.filter((n) => setComConversa.has(n))
    const atendentesSemConversa = atendentes.filter((n) => !setComConversa.has(n))
    const resumo: MonitorResumo = {
      total,
      esperando: espRes.count ?? 0,
      aguardandoCliente: aguardaClienteRes.count ?? 0,
      atualizadoEm: (logRes.data as { executado_em?: string } | null)?.executado_em ?? null,
    }
    return { itens, resumo, departamentos, atendentes, atendentesComConversa, atendentesSemConversa, pagina: pag, totalPaginas, estado: { configurado: true, erro: null } }
  } catch (e) {
    return { ...vazio, estado: { configurado: true, erro: (e as Error).message } }
  }
}

export interface AuditoriaItem {
  id: string
  numero_protocolo: string
  departamento: string | null
  atendente_nome: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_respondeu_em: string | null
  parado_horas: number
  parado_dias: number
  ultima_texto: string | null
}

export interface PlacarItem {
  colaborador: string
  total_conversas: number
  esperando_mais_24h: number
  esperando_recente: number
  taxa: number | null
}

/** Marcos de tempo sem resposta que a Auditoria acompanha (em horas). */
export const MARCOS_AUDITORIA = [2, 4, 8, 24, 48, 72]

export async function getAuditoria(marcoHoras = 24, dep?: string | string[], atendente?: string | string[], ordem?: string): Promise<{
  recentes: AuditoriaItem[]
  /** Parados há mais de 60 dias (a "fila antiga") — lista, não só a contagem. */
  antigos: AuditoriaItem[]
  backlogCount: number
  totalCount: number
  faixas: { horas: number; total: number }[]
  estado: EstadoBanco
}> {
  const vazio = { recentes: [], antigos: [], backlogCount: 0, totalCount: 0, faixas: [], estado: { configurado: false, erro: null } }
  if (!bancoConfigurado()) return vazio
  try {
    const supabase = await createClient()
    // Setor e atendente aceitam VÁRIOS valores (Regra 57): uma opção = igualdade; várias = IN.
    const deps = (Array.isArray(dep) ? dep : dep ? [dep] : []).filter(Boolean)
    const atendentes_ = (Array.isArray(atendente) ? atendente : atendente ? [atendente] : []).filter(Boolean)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    // só conversas ABERTAS (finalizadas não são "sem resposta") + filtros de setor/atendente
    const base = (q: any): any => {
      let x = q.in('status_multi360', STATUS_ABERTAS)
      if (deps.length === 1) x = x.eq('departamento', deps[0])
      else if (deps.length > 1) x = x.in('departamento', deps)
      if (atendentes_.length === 1) x = x.eq('atendente_nome', atendentes_[0])
      else if (atendentes_.length > 1) x = x.in('atendente_nome', atendentes_)
      return x
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const [listaRes, ...faixasRes] = await Promise.all([
      base(supabase.from('v_at_auditoria').select('*'))
        .gte('parado_horas', marcoHoras)
        .order('cliente_respondeu_em', { ascending: false })
        .limit(500),
      ...MARCOS_AUDITORIA.map((h) =>
        base(supabase.from('v_at_auditoria').select('id', { count: 'exact', head: true })).gte('parado_horas', h)
      ),
    ])
    if (listaRes.error) return { ...vazio, estado: { configurado: true, erro: listaRes.error.message } }

    const todos = (listaRes.data ?? []) as AuditoriaItem[]
    // Ordem: padrão "recente" = silêncio mais recente primeiro; "antiga" = quem espera HÁ MAIS TEMPO primeiro.
    const cmp = (a: AuditoriaItem, b: AuditoriaItem) =>
      ordem === 'antiga' ? b.parado_horas - a.parado_horas : a.parado_horas - b.parado_horas
    const recentes = todos.filter((x) => x.parado_dias <= 60).sort(cmp)
    const antigos = todos.filter((x) => x.parado_dias > 60).sort(cmp)
    const faixas = MARCOS_AUDITORIA.map((h, i) => ({ horas: h, total: faixasRes[i]?.count ?? 0 }))
    return { recentes, antigos, backlogCount: antigos.length, totalCount: todos.length, faixas, estado: { configurado: true, erro: null } }
  } catch (e) {
    return { ...vazio, estado: { configurado: true, erro: (e as Error).message } }
  }
}

export async function getPlacar(): Promise<PlacarItem[]> {
  if (!bancoConfigurado()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('v_at_placar').select('*')
    return (data ?? []) as PlacarItem[]
  } catch {
    return []
  }
}

export interface AtMensagem {
  id: string
  remetente_tipo: string | null
  remetente_nome: string | null
  texto: string | null
  tem_anexo: boolean | null
  enviado_em: string | null
}

export interface TicketDoCliente {
  id: string
  numero_protocolo: string
  departamento: string | null
  atendente_nome: string | null
  status_multi360: string | null
  ultima_mensagem_em: string | null
}

export async function getProtocoloConversa(id: string): Promise<{
  protocolo: ProtocoloMonitor | null
  mensagens: AtMensagem[]
  outrosTickets: TicketDoCliente[]
}> {
  if (!bancoConfigurado()) return { protocolo: null, mensagens: [], outrosTickets: [] }
  try {
    const supabase = await createClient()
    const { data: protocolo } = await supabase.from('v_at_monitor').select('*').eq('id', id).maybeSingle()
    if (!protocolo) return { protocolo: null, mensagens: [], outrosTickets: [] }

    // descobre o cliente deste protocolo p/ listar TODOS os tickets dele
    const { data: proto } = await supabase.from('at_protocolos').select('cliente_id').eq('id', id).maybeSingle()
    const clienteId = (proto as { cliente_id?: string } | null)?.cliente_id ?? null

    const [{ data: mensagens }, ticketsRes] = await Promise.all([
      supabase
        .from('at_mensagens')
        .select('id, remetente_tipo, remetente_nome, texto, tem_anexo, enviado_em')
        .eq('protocolo_id', id)
        .order('enviado_em', { ascending: true })
        .order('ordem', { ascending: true })
        .limit(500),
      clienteId
        ? supabase
            .from('at_protocolos')
            .select('id, numero_protocolo, departamento, atendente_nome, status_multi360, ultima_mensagem_em')
            .eq('cliente_id', clienteId)
            .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
            .limit(100)
        : Promise.resolve({ data: [] }),
    ])

    const outrosTickets = ((ticketsRes.data ?? []) as TicketDoCliente[]).filter((t) => t.id !== id)
    return { protocolo: protocolo as ProtocoloMonitor, mensagens: (mensagens ?? []) as AtMensagem[], outrosTickets }
  } catch {
    return { protocolo: null, mensagens: [], outrosTickets: [] }
  }
}

/** Participante de uma conversa no Multi360 (espelhado). O principal é o dono
 * da conversa; os demais foram adicionados para acompanhar. Capturado pelo leitor. */
export interface AtParticipante {
  nome: string
  principal: boolean
}

export interface HistoricoProtocolo {
  id: string
  numero_protocolo: string
  status_multi360: string | null
  departamento: string | null
  atendente_nome: string | null
  criado_em_multi360: string | null
  ultima_mensagem_em: string | null
  ultima_mensagem_direcao: string | null
  participantes: AtParticipante[] | null
  mensagens: AtMensagem[]
}

export interface HistoricoCliente {
  cliente_id: string
  cliente_nome: string | null
  cliente_telefone: string | null
  atualProtocoloId: string
  protocolos: HistoricoProtocolo[]
  totalMensagens: number
  estado: EstadoBanco
}

/**
 * Histórico COMPLETO do cliente dono de um protocolo: todos os protocolos
 * (abertos e finalizados) com todas as mensagens, em ordem cronológica.
 */
export async function getHistoricoCliente(protocoloId: string): Promise<HistoricoCliente | null> {
  if (!bancoConfigurado()) return null
  try {
    const supabase = await createClient()

    // O histórico é montado por funções SECURITY DEFINER no banco (at_historico_*).
    // Elas conferem o acesso (vê tudo, ou responsável por ao menos 1 protocolo do
    // cliente) e então devolvem o histórico COMPLETO do cliente, sem o RLS por
    // responsável recortar os atendimentos feitos por outros atendentes. Assim a
    // promessa "histórico completo do cliente" vale também para o colaborador —
    // que continua só conseguindo abrir clientes que já atende.
    const [{ data: clientes }, { data: protos }] = await Promise.all([
      supabase.rpc('at_historico_cliente_info', { p_protocolo_id: protocoloId }),
      supabase.rpc('at_historico_protocolos', { p_protocolo_id: protocoloId }),
    ])

    const cliente = ((clientes ?? []) as { id: string; nome?: string; telefone?: string }[])[0]
    if (!cliente) return null

    const lista = (protos ?? []) as HistoricoProtocolo[]

    // Mensagens: a RPC devolve TODAS ordenadas (antiga→recente), mas o Supabase corta
    // em 1.000 linhas por chamada. Clientes com histórico longo (>1.000 msgs) perdiam
    // as RECENTES — a tela mostrava conversa de anos atrás. Buscamos em páginas de 1.000
    // até trazer tudo (teto de segurança de 40 páginas = 40 mil mensagens).
    const PAGINA_MSG = 1000
    const mensagens: (AtMensagem & { protocolo_id: string })[] = []
    for (let p = 0; p < 40; p++) {
      const { data: bloco, error: erroMsg } = await supabase
        .rpc('at_historico_mensagens', { p_protocolo_id: protocoloId })
        // ordena na chamada externa também — sem isso o Postgres não garante a mesma
        // ordem entre páginas e a virada de página poderia duplicar/pular mensagens.
        .order('enviado_em', { ascending: true })
        .order('ordem', { ascending: true })
        .order('id', { ascending: true }) // desempate único (ordem reinicia por protocolo)
        .range(p * PAGINA_MSG, p * PAGINA_MSG + PAGINA_MSG - 1)
      if (erroMsg || !bloco || bloco.length === 0) break
      mensagens.push(...(bloco as (AtMensagem & { protocolo_id: string })[]))
      if (bloco.length < PAGINA_MSG) break
    }

    const porProtocolo = new Map<string, AtMensagem[]>()
    for (const m of mensagens) {
      if (!porProtocolo.has(m.protocolo_id)) porProtocolo.set(m.protocolo_id, [])
      porProtocolo.get(m.protocolo_id)!.push(m)
    }
    for (const p of lista) p.mensagens = porProtocolo.get(p.id) ?? []

    return {
      cliente_id: cliente.id,
      cliente_nome: cliente.nome ?? null,
      cliente_telefone: cliente.telefone ?? null,
      atualProtocoloId: protocoloId,
      protocolos: lista,
      totalMensagens: mensagens.length,
      estado: { configurado: true, erro: null },
    }
  } catch {
    return null
  }
}

export async function getCatalogoPrevidenciario(): Promise<{
  beneficios: RefTipoBeneficio[]
  servicos: RefTipoServico[]
  fases: RefFase[]
}> {
  if (!bancoConfigurado()) return { beneficios: [], servicos: [], fases: [] }
  try {
    const supabase = await createClient()
    const [{ data: beneficios }, { data: servicos }, { data: fases }] = await Promise.all([
      supabase.from('ref_tipos_beneficio').select('*').order('ordem', { ascending: true }),
      supabase.from('ref_tipos_servico').select('*').order('ordem', { ascending: true }),
      supabase.from('ref_fases').select('*').order('ordem', { ascending: true }),
    ])
    return {
      beneficios: (beneficios ?? []) as RefTipoBeneficio[],
      servicos: (servicos ?? []) as RefTipoServico[],
      fases: (fases ?? []) as RefFase[],
    }
  } catch {
    return { beneficios: [], servicos: [], fases: [] }
  }
}

export async function getPessoas(): Promise<PessoaComIdentificadores[]> {
  if (!bancoConfigurado()) return []
  try {
    const supabase = await createClient()
    const { data: pessoas } = await supabase
      .from('pessoas')
      .select('*')
      .order('data_ultima_msg', { ascending: false, nullsFirst: false })
      .limit(200)
    if (!pessoas?.length) return []

    const ids = pessoas.map((p) => p.id)
    const { data: idents } = await supabase
      .from('identificadores')
      .select('*')
      .in('pessoa_id', ids)

    const porPessoa = new Map<string, Identificador[]>()
    for (const i of (idents ?? []) as Identificador[]) {
      const arr = porPessoa.get(i.pessoa_id) ?? []
      arr.push(i)
      porPessoa.set(i.pessoa_id, arr)
    }

    return (pessoas as Pessoa[]).map((p) => {
      const lista = porPessoa.get(p.id) ?? []
      const wpp = lista.find((i) => i.tipo === 'WHATSAPP' && i.principal) ?? lista.find((i) => i.tipo === 'WHATSAPP')
      const tel = lista.find((i) => i.tipo === 'TELEFONE' && i.principal) ?? lista.find((i) => i.tipo === 'TELEFONE')
      const cpf = lista.find((i) => i.tipo === 'CPF')
      return {
        ...p,
        whatsapp_principal: wpp?.valor ?? null,
        telefone: tel?.valor ?? null,
        cpf: cpf?.valor ?? null,
      }
    })
  } catch {
    return []
  }
}
