import type { NivelUrgencia, EstagioJornada, ObjetivoStatus, MissaoStatus, Prioridade } from './tipos'

// ── Cores de selo (T9 da auditoria de 18/11/2026) ───────────────────────────
// Só as cores da Apple Design: cada situação devolve a classe `.selo-*` da folha
// (apple-design.css) e, para quem ainda pinta à mão, os tokens equivalentes.
// A cor nunca vai sozinha: o selo sempre traz o texto (Regra 46).
export type ToneSelo = 'sucesso' | 'atencao' | 'perigo' | 'neutro' | 'acao'
const TOKENS_SELO: Record<ToneSelo, { bg: string; fg: string }> = {
  sucesso: { bg: 'var(--sucesso-suave)', fg: 'var(--sucesso)' },
  atencao: { bg: 'var(--atencao-suave)', fg: 'var(--atencao)' },
  perigo: { bg: 'var(--perigo-suave)', fg: 'var(--perigo)' },
  neutro: { bg: 'var(--recuo-2)', fg: 'var(--tinta-2)' },
  acao: { bg: 'var(--acao-suave)', fg: 'var(--acao-forte)' },
}
function selo(tom: ToneSelo): { classe: string; bg: string; fg: string } {
  return { classe: `selo-${tom}`, ...TOKENS_SELO[tom] }
}

/** Rótulo + selo do status do Objetivo. */
export function statusObjetivo(s: ObjetivoStatus): { label: string; classe: string; bg: string; fg: string } {
  switch (s) {
    case 'EM_ANDAMENTO':
      return { label: 'Em Andamento', ...selo('acao') }
    case 'CONCLUIDO':
      return { label: 'Concluído', ...selo('sucesso') }
    case 'ABANDONADO':
      return { label: 'Abandonado', ...selo('neutro') }
    case 'FUTURO':
      return { label: 'Futuro', ...selo('neutro') }
    default:
      return { label: 'Aberto', ...selo('atencao') }
  }
}

/** Rótulo + selo do status da Missão. */
export function statusMissao(s: MissaoStatus): { label: string; classe: string; bg: string; fg: string } {
  switch (s) {
    case 'EM_EXECUCAO':
      return { label: 'Em Execução', ...selo('acao') }
    case 'AGUARDANDO_CLIENTE':
      return { label: 'Aguardando Cliente', ...selo('atencao') }
    case 'AGUARDANDO_TERCEIROS':
      return { label: 'Aguardando Terceiros', ...selo('atencao') }
    case 'AGUARDANDO_INSS':
      return { label: 'Aguardando INSS', ...selo('atencao') }
    case 'SUSPENSA':
      return { label: 'Suspensa', ...selo('neutro') }
    case 'CONCLUIDA':
      return { label: 'Concluída', ...selo('sucesso') }
    case 'CANCELADA':
      return { label: 'Cancelada', ...selo('neutro') }
    default:
      return { label: 'Criada', ...selo('neutro') }
  }
}

/** Rótulo + selo do status da Conversa. */
export function statusConversa(s: string): { label: string; classe: string; bg: string; fg: string } {
  switch (s) {
    case 'ABERTA':
      return { label: 'Aberta', ...selo('atencao') }
    case 'RESPONDIDA':
      return { label: 'Respondida', ...selo('sucesso') }
    case 'PENDENTE':
      return { label: 'Pendente', ...selo('perigo') }
    case 'FECHADA':
      return { label: 'Fechada', ...selo('neutro') }
    default:
      return { label: s, ...selo('neutro') }
  }
}

/** Heurística: o valor parece um telefone BR (e não um id opaco/LID)? */
export function pareceTelefone(valor: string | null | undefined): boolean {
  const d = apenasDigitos(valor)
  if (!d) return false
  if (d.startsWith('55')) return d.length === 12 || d.length === 13
  return d.length === 10 || d.length === 11
}

/** Exibe telefone quando é um número; senão sinaliza id de privacidade (LID). */
export function rotuloWhatsapp(valor: string | null | undefined): string {
  if (!valor) return '—'
  return pareceTelefone(valor) ? formatarTelefone(valor) : 'sem telefone (id privado)'
}

/** Cor da prioridade (token da Apple Design). */
export function corPrioridade(p: Prioridade): string {
  return selo(tomPrioridade(p)).fg
}

/** Classe `.selo-*` da prioridade (o selo sempre traz o nome da prioridade junto). */
export function seloPrioridade(p: Prioridade): string {
  return selo(tomPrioridade(p)).classe
}

function tomPrioridade(p: Prioridade): ToneSelo {
  switch (p) {
    case 'URGENTE':
      return 'perigo'
    case 'ALTA':
    case 'MEDIA':
      return 'atencao'
    default:
      return 'neutro'
  }
}

/** Rótulo humano do estágio da Jornada (vocabulário "Pretenso Cliente"). */
export function rotuloEstagio(estagio: EstagioJornada): string {
  switch (estagio) {
    case 'PRETENSO_CLIENTE':
      return 'Pretenso Cliente'
    case 'CLIENTE':
      return 'Cliente'
    case 'CLIENTE_ATIVO':
      return 'Cliente Ativo'
    case 'EX_CLIENTE':
      return 'Ex-cliente'
    default:
      return 'Desconhecido'
  }
}

/** Selo do estágio (classe `.selo-*` e os tokens equivalentes). */
export function coresEstagio(estagio: EstagioJornada): { classe: string; bg: string; fg: string } {
  switch (estagio) {
    case 'CLIENTE':
    case 'CLIENTE_ATIVO':
      return selo('acao')
    case 'PRETENSO_CLIENTE':
      return selo('atencao')
    default:
      return selo('neutro')
  }
}

/** Remove tudo que não é dígito (para CPF / telefone). */
export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

// ── Padronização de nomes (Doc. Mestre SIAP — Regra 24) ─────────────────────
const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'a', 'ao', 'aos', 'à', 'às', 'o', 'os', 'um', 'uma'])

/** Nome próprio com capitalização padrão: "Maria de Jesus da Silva" (preposições em minúsculo). */
/** Deixa maiúscula a primeira LETRA (não o primeiro caractere): "(sandra)" → "(Sandra)". */
function maiusculaNaPrimeiraLetra(palavra: string): string {
  return palavra.replace(/\p{L}/u, (c) => c.toUpperCase())
}

export function formatarNome(nome: string | null | undefined): string {
  if (!nome) return '—'
  const s = nome.trim()
  if (!s) return '—'
  // Se o nome JÁ vem com minúsculas, ele foi digitado com cuidado: siglas curtas
  // em maiúsculo ("RH Prefeitura...") são de propósito e devem ser preservadas.
  // Num nome todo em caixa alta não há como distinguir sigla de grito — aí a
  // Regra 24 vale para tudo.
  const nomeCuidadoso = /\p{Ll}/u.test(s)
  const ehSigla = (p: string) => nomeCuidadoso && p.length <= 4 && /^\p{Lu}+$/u.test(p)

  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) => {
      if (ehSigla(palavra)) return palavra
      const min = palavra.toLowerCase()
      if (i > 0 && PREPOSICOES.has(min)) return min
      return maiusculaNaPrimeiraLetra(min)
    })
    .join(' ')
}

// ── Busca tolerante (Doc. Mestre SIAP — Regras 4, 5, 7) ─────────────────────
/** Remove acentos, minúsculas, tira pontuação/espaços — para comparar buscas. */
export function normalizarBusca(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// ── Tolerância fonética (Doc. Mestre SIAP — Regra 6) ────────────────────────
/**
 * Canoniza a escrita para tolerar erros comuns: S↔SS↔Z↔Ç, C↔CH↔X, G↔J, I↔Y, U↔W.
 * Ex.: "Luíza" e "Luisa" viram a mesma forma; "Conceição" e "Conceicao" também.
 */
export function normalizarFonetico(texto: string | null | undefined): string {
  let t = (texto ?? '').toLowerCase().replace(/ç/g, 's').normalize('NFD').replace(/[̀-ͯ]/g, '')
  t = t.replace(/[^a-z0-9\s]/g, ' ')
  t = t.replace(/ph/g, 'f')
  t = t.replace(/ch/g, 'x')      // CH ↔ X
  t = t.replace(/ss/g, 's')      // S ↔ SS
  t = t.replace(/ce/g, 'se').replace(/ci/g, 'si') // C brando ↔ S
  t = t.replace(/ge/g, 'je').replace(/gi/g, 'ji') // G ↔ J
  t = t.replace(/z/g, 's')       // S ↔ Z
  t = t.replace(/y/g, 'i')       // I ↔ Y
  t = t.replace(/w/g, 'u')       // U ↔ W
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

/** Formata CPF: 12345678900 → 123.456.789-00 */
export function formatarCpf(cpf: string | null | undefined): string {
  const d = apenasDigitos(cpf)
  if (d.length !== 11) return cpf ?? '—'
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Formata telefone BR: 5575988410521 → +55 (75) 98841-0521 */
export function formatarTelefone(tel: string | null | undefined): string {
  let d = apenasDigitos(tel)
  if (!d) return '—'
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return tel ?? '—'
}

/** "há X" a partir de horas. */
export function tempoDecorrido(horas: number | null | undefined): string {
  if (horas == null) return '—'
  if (horas < 1) return 'menos de 1h'
  if (horas < 24) return `${Math.floor(horas)}h`
  const dias = Math.floor(horas / 24)
  const resto = Math.floor(horas % 24)
  return resto > 0 ? `${dias}d ${resto}h` : `${dias}d`
}

/**
 * Duração escalonada desde uma data (até agora, ou até `ate` se informado):
 * < 1h  → minutos; < 1 dia → horas e minutos; < 1 mês → dias, horas e minutos;
 * < 1 ano → meses, dias, horas e minutos; 1 ano+ → anos, meses, dias, horas e minutos.
 */
export function formatarDuracao(desde: string | null | undefined, ate?: string | null): string {
  if (!desde) return '—'
  const d = new Date(desde)
  if (isNaN(d.getTime())) return '—'
  const n = ate ? new Date(ate) : new Date()
  if (isNaN(n.getTime())) return '—'
  if (d.getTime() >= n.getTime()) return 'agora'

  let anos = n.getFullYear() - d.getFullYear()
  let meses = n.getMonth() - d.getMonth()
  let dias = n.getDate() - d.getDate()
  let horas = n.getHours() - d.getHours()
  let minutos = n.getMinutes() - d.getMinutes()
  if (minutos < 0) { minutos += 60; horas -= 1 }
  if (horas < 0) { horas += 24; dias -= 1 }
  if (dias < 0) { dias += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); meses -= 1 }
  if (meses < 0) { meses += 12; anos -= 1 }

  const mes = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`
  const ano = (a: number) => `${a} ${a === 1 ? 'ano' : 'anos'}`
  if (anos > 0) return `${ano(anos)} ${mes(meses)} ${dias}d ${horas}h ${minutos}min`
  if (meses > 0) return `${mes(meses)} ${dias}d ${horas}h ${minutos}min`
  if (dias > 0) return `${dias}d ${horas}h ${minutos}min`
  if (horas > 0) return `${horas}h ${minutos}min`
  return `${minutos} min`
}

/** Fuso horário oficial do sistema (Brasília). */
const FUSO_BR = 'America/Sao_Paulo'
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function diaDaSemana(d: Date): string {
  // dia da semana no fuso de Brasília, com inicial maiúscula (Seg, Ter, ...)
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: FUSO_BR, weekday: 'short' }).format(d)
  const map: Record<string, string> = { Sun: 'Dom', Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb' }
  return map[wd] ?? DIAS_SEMANA[d.getDay()]
}

/** Data + hora no padrão dd/mm/aaaa com dia da semana e fuso de Brasília. Ex.: "sáb 10/01/2026 14:30". */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const data = d.toLocaleDateString('pt-BR', { timeZone: FUSO_BR, day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO_BR, hour: '2-digit', minute: '2-digit' })
  return `${diaDaSemana(d)} ${data} ${hora}`
}

/** Só a data, dd/mm/aaaa com dia da semana. Ex.: "Sáb 10/01/2026". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const data = d.toLocaleDateString('pt-BR', { timeZone: FUSO_BR, day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${diaDaSemana(d)} ${data}`
}

/** Data + hora COM segundos (para "última atualização"). Ex.: "Ter 14/01/2026 15:28:13". */
export function formatarDataHoraSegundos(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const data = d.toLocaleDateString('pt-BR', { timeZone: FUSO_BR, day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO_BR, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `${diaDaSemana(d)} ${data} ${hora}`
}

/** Selo por nível de urgência (classe `.selo-*`, tokens e rótulo). */
export function coresUrgencia(nivel: NivelUrgencia): { classe: string; bg: string; fg: string; label: string } {
  switch (nivel) {
    case 'CRÍTICO':
      return { ...selo('perigo'), label: 'Crítico' }
    case 'URGENTE':
      return { ...selo('perigo'), label: 'Urgente' }
    case 'ALTO':
      return { ...selo('atencao'), label: 'Atenção' }
    default:
      return { ...selo('sucesso'), label: 'Normal' }
  }
}

/** Nível de urgência a partir das horas sem resposta (espelha a view SQL). */
export function nivelPorHoras(horas: number): NivelUrgencia {
  if (horas > 24) return 'CRÍTICO'
  if (horas > 8) return 'URGENTE'
  if (horas > 2) return 'ALTO'
  return 'NORMAL'
}
