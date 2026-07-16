import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado } from '@/lib/dados'

const ABERTAS = new Set(['ATIVO', 'AGUARDANDO'])

export interface LinhaRanking {
  atendente: string
  abertas: number
  esperando: number
  esperando24: number
  finalizadas: number
  cobrancasAbertas: number
  cobrancasResolvidas: number
  cobrancasVencidas: number
}

export interface PainelGestor {
  resumo: {
    conversasAbertas: number
    esperando: number
    esperando24: number
    finalizadas: number
    cobrancasAbertas: number
    cobrancasVencidas: number
    atendentes: number
  }
  ranking: LinhaRanking[]
  estado: { configurado: boolean; erro: string | null }
}

const VAZIO: PainelGestor = {
  resumo: { conversasAbertas: 0, esperando: 0, esperando24: 0, finalizadas: 0, cobrancasAbertas: 0, cobrancasVencidas: 0, atendentes: 0 },
  ranking: [],
  estado: { configurado: false, erro: null },
}

const h24atras = () => Date.now() - 24 * 3_600_000

export async function getPainelGestor(): Promise<PainelGestor> {
  if (!bancoConfigurado()) return VAZIO
  try {
    const supabase = await createClient()

    // 1) Todos os protocolos (paginado — driblar o teto de 1000 linhas).
    type P = { atendente_nome: string | null; status_multi360: string | null; ultima_mensagem_direcao: string | null; ultima_mensagem_em: string | null }
    const protos: P[] = []
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await supabase
        .from('at_protocolos')
        .select('atendente_nome, status_multi360, ultima_mensagem_direcao, ultima_mensagem_em')
        .range(from, from + 999)
      if (error) return { ...VAZIO, estado: { configurado: true, erro: error.message } }
      const linhas = (data ?? []) as P[]
      protos.push(...linhas)
      if (linhas.length < 1000) break
    }

    // 2) Cobranças (pequeno volume).
    const { data: cobData } = await supabase.from('at_cobrancas').select('colaborador_nome, status, prazo')
    const cobs = (cobData ?? []) as { colaborador_nome: string | null; status: string | null; prazo: string | null }[]

    // 3) Agrega por atendente.
    const mapa = new Map<string, LinhaRanking>()
    const nova = (nome: string): LinhaRanking => ({ atendente: nome, abertas: 0, esperando: 0, esperando24: 0, finalizadas: 0, cobrancasAbertas: 0, cobrancasResolvidas: 0, cobrancasVencidas: 0 })
    const pega = (nome: string | null) => {
      const n = (nome || '').trim() || 'sem atendente'
      if (!mapa.has(n)) mapa.set(n, nova(n))
      return mapa.get(n)!
    }

    const corte24 = h24atras()
    const resumo = { ...VAZIO.resumo }
    for (const p of protos) {
      const l = pega(p.atendente_nome)
      if (p.status_multi360 === 'FINALIZADO') {
        l.finalizadas++
        resumo.finalizadas++
      } else if (ABERTAS.has(p.status_multi360 ?? '')) {
        l.abertas++
        resumo.conversasAbertas++
        if (p.ultima_mensagem_direcao === 'cliente') {
          l.esperando++
          resumo.esperando++
          const t = p.ultima_mensagem_em ? new Date(p.ultima_mensagem_em).getTime() : Date.now()
          if (t < corte24) {
            l.esperando24++
            resumo.esperando24++
          }
        }
      }
    }

    for (const c of cobs) {
      const l = pega(c.colaborador_nome)
      if (c.status === 'ABERTA') {
        l.cobrancasAbertas++
        resumo.cobrancasAbertas++
        if (c.prazo && new Date(c.prazo).getTime() < Date.now()) {
          l.cobrancasVencidas++
          resumo.cobrancasVencidas++
        }
      } else if (c.status === 'RESOLVIDA') {
        l.cobrancasResolvidas++
      }
    }

    // Ranking: quem tem mais gente esperando há +24h primeiro; depois esperando; depois abertas.
    const ranking = [...mapa.values()]
      .filter((l) => l.abertas > 0 || l.finalizadas > 0 || l.cobrancasAbertas > 0)
      .sort((a, b) => b.esperando24 - a.esperando24 || b.esperando - a.esperando || b.abertas - a.abertas)

    resumo.atendentes = ranking.length
    return { resumo, ranking, estado: { configurado: true, erro: null } }
  } catch (e) {
    return { ...VAZIO, estado: { configurado: true, erro: (e as Error).message } }
  }
}
