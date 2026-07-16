import type { NivelUrgencia, EstagioJornada, ObjetivoStatus, MissaoStatus, Prioridade } from './tipos'

/** Rótulo + cores do status do Objetivo. */
export function statusObjetivo(s: ObjetivoStatus): { label: string; bg: string; fg: string } {
  switch (s) {
    case 'EM_ANDAMENTO':
      return { label: 'Em andamento', bg: '#DBEAFE', fg: '#1D4ED8' }
    case 'CONCLUIDO':
      return { label: 'Concluído', bg: '#DCFCE7', fg: '#15803D' }
    case 'ABANDONADO':
      return { label: 'Abandonado', bg: '#F1F5F9', fg: '#64748B' }
    case 'FUTURO':
      return { label: 'Futuro', bg: '#F3E8FF', fg: '#7E22CE' }
    default:
      return { label: 'Aberto', bg: '#FEF9C3', fg: '#A16207' }
  }
}

/** Rótulo + cores do status da Missão. */
export function statusMissao(s: MissaoStatus): { label: string; bg: string; fg: string } {
  switch (s) {
    case 'EM_EXECUCAO':
      return { label: 'Em execução', bg: '#DBEAFE', fg: '#1D4ED8' }
    case 'AGUARDANDO_CLIENTE':
      return { label: 'Aguardando cliente', bg: '#FEF9C3', fg: '#A16207' }
    case 'AGUARDANDO_TERCEIROS':
      return { label: 'Aguardando terceiros', bg: '#FEF9C3', fg: '#A16207' }
    case 'AGUARDANDO_INSS':
      return { label: 'Aguardando INSS', bg: '#FFEDD5', fg: '#C2410C' }
    case 'SUSPENSA':
      return { label: 'Suspensa', bg: '#F1F5F9', fg: '#64748B' }
    case 'CONCLUIDA':
      return { label: 'Concluída', bg: '#DCFCE7', fg: '#15803D' }
    case 'CANCELADA':
      return { label: 'Cancelada', bg: '#F1F5F9', fg: '#64748B' }
    default:
      return { label: 'Criada', bg: '#EEF2F7', fg: '#475569' }
  }
}

/** Rótulo + cores do status da Conversa. */
export function statusConversa(s: string): { label: string; bg: string; fg: string } {
  switch (s) {
    case 'ABERTA':
      return { label: 'Aberta', bg: '#FEF9C3', fg: '#A16207' }
    case 'RESPONDIDA':
      return { label: 'Respondida', bg: '#DCFCE7', fg: '#15803D' }
    case 'PENDENTE':
      return { label: 'Pendente', bg: '#FFEDD5', fg: '#C2410C' }
    case 'FECHADA':
      return { label: 'Fechada', bg: '#F1F5F9', fg: '#64748B' }
    default:
      return { label: s, bg: '#F1F5F9', fg: '#64748B' }
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

/** Cor da prioridade. */
export function corPrioridade(p: Prioridade): string {
  switch (p) {
    case 'URGENTE':
      return '#B91C1C'
    case 'ALTA':
      return '#C2410C'
    case 'MEDIA':
      return '#A16207'
    default:
      return '#64748B'
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

/** Cores do badge por estágio (fundo, texto). */
export function coresEstagio(estagio: EstagioJornada): { bg: string; fg: string } {
  switch (estagio) {
    case 'CLIENTE':
    case 'CLIENTE_ATIVO':
      return { bg: '#DBEAFE', fg: '#1D4ED8' }
    case 'PRETENSO_CLIENTE':
      return { bg: '#F3E8FF', fg: '#7E22CE' }
    case 'EX_CLIENTE':
      return { bg: '#F1F5F9', fg: '#64748B' }
    default:
      return { bg: '#F1F5F9', fg: '#64748B' }
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

/** Cores por nível de urgência (fundo, texto). */
export function coresUrgencia(nivel: NivelUrgencia): { bg: string; fg: string; label: string } {
  switch (nivel) {
    case 'CRÍTICO':
      return { bg: '#FEE2E2', fg: '#B91C1C', label: 'Crítico' }
    case 'URGENTE':
      return { bg: '#FFEDD5', fg: '#C2410C', label: 'Urgente' }
    case 'ALTO':
      return { bg: '#FEF9C3', fg: '#A16207', label: 'Atenção' }
    default:
      return { bg: '#DCFCE7', fg: '#15803D', label: 'Normal' }
  }
}

/** Nível de urgência a partir das horas sem resposta (espelha a view SQL). */
export function nivelPorHoras(horas: number): NivelUrgencia {
  if (horas > 24) return 'CRÍTICO'
  if (horas > 8) return 'URGENTE'
  if (horas > 2) return 'ALTO'
  return 'NORMAL'
}
