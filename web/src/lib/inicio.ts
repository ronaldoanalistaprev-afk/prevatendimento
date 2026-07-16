import { createClient } from '@/lib/supabase/server'
import { bancoConfigurado, STATUS_ABERTAS, type AuditoriaItem } from '@/lib/dados'

/**
 * Dados da página inicial (o painel do gestor).
 * Regra: número na tela = pergunta que ele pode responder agindo.
 * As contas pesadas (tempo de resposta sobre 176 mil mensagens) NÃO são feitas
 * aqui — vêm prontas de at_metricas_mensais, que o leitor recalcula.
 */

export interface MesMetrica {
  competencia: string
  /** % das esperas do cliente respondidas em até 24h (só as que já tiveram 24h de chance). */
  pct_resposta_24h: number | null
  /** Tempo mais comum de resposta, em minutos. */
  mediana_min: number | null
  rodadas: number
  rodadas_sem_resposta: number
}

export interface UsoDoSistema {
  /** Logins cadastrados além do administrador. */
  pessoasComAcesso: number
  temSupervisorOuGestor: boolean
  cobrancasCriadas: number
  cobrancasResolvidas: number
}

export interface DadosInicio {
  semResposta24h: number
  /** Sem resposta há +24h e até 60 dias — a fila acionável. */
  paraResolverAgora: number
  /** Sem resposta há mais de 60 dias. */
  filaAntiga: number
  /** Cliente na fila que ninguém pegou ainda. */
  aguardando1oAtendimento: number
  conversasAbertas: number
  /** Os que esperam há mais tempo (amostra da Auditoria). */
  maisAntigos: AuditoriaItem[]
  meses: MesMetrica[]
  uso: UsoDoSistema
  erro: string | null
}

const VAZIO: DadosInicio = {
  semResposta24h: 0, paraResolverAgora: 0, filaAntiga: 0, aguardando1oAtendimento: 0,
  conversasAbertas: 0, maisAntigos: [], meses: [],
  uso: { pessoasComAcesso: 0, temSupervisorOuGestor: false, cobrancasCriadas: 0, cobrancasResolvidas: 0 },
  erro: null,
}

export async function getDadosInicio(): Promise<DadosInicio> {
  if (!bancoConfigurado()) return VAZIO
  try {
    const supabase = await createClient()
    const agora = Date.now()
    const ha24h = new Date(agora - 24 * 3_600_000).toISOString()
    const ha60d = new Date(agora - 60 * 24 * 3_600_000).toISOString()

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const contar = (q: any) => q.select('id', { count: 'exact', head: true })
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const [abertasRes, sem24Res, antigaRes, pendRes, listaRes, mesesRes, usuariosRes, cobrAbertasRes, cobrResolvRes] =
      await Promise.all([
        contar(supabase.from('at_protocolos')).in('status_multi360', STATUS_ABERTAS),
        contar(supabase.from('at_protocolos'))
          .in('status_multi360', STATUS_ABERTAS)
          .eq('ultima_mensagem_direcao', 'cliente')
          .lt('ultima_mensagem_em', ha24h),
        contar(supabase.from('at_protocolos'))
          .in('status_multi360', STATUS_ABERTAS)
          .eq('ultima_mensagem_direcao', 'cliente')
          .lt('ultima_mensagem_em', ha60d),
        contar(supabase.from('at_protocolos')).eq('status_multi360', 'AGUARDANDO'),
        supabase
          .from('v_at_auditoria')
          .select('*')
          .in('status_multi360', STATUS_ABERTAS)
          .gte('parado_horas', 24)
          .lte('parado_dias', 60)
          .order('parado_horas', { ascending: false })
          .limit(5),
        // 13 = os 12 meses fechados do gráfico + o mês corrente (que ainda está correndo)
        supabase
          .from('at_metricas_mensais')
          .select('competencia, pct_resposta_24h, mediana_min, rodadas, rodadas_sem_resposta')
          .order('competencia', { ascending: false })
          .limit(13),
        supabase.from('usuarios').select('role').eq('ativo', true),
        contar(supabase.from('at_cobrancas')),
        contar(supabase.from('at_cobrancas')).eq('status', 'RESOLVIDA'),
      ])

    const semResposta24h = sem24Res.count ?? 0
    const filaAntiga = antigaRes.count ?? 0
    const papeis = ((usuariosRes.data ?? []) as { role?: string }[]).map((u) => u.role ?? '')

    return {
      conversasAbertas: abertasRes.count ?? 0,
      semResposta24h,
      paraResolverAgora: Math.max(0, semResposta24h - filaAntiga),
      filaAntiga,
      aguardando1oAtendimento: pendRes.count ?? 0,
      maisAntigos: (listaRes.data ?? []) as AuditoriaItem[],
      // do mais antigo para o mais novo (o gráfico lê da esquerda p/ direita)
      meses: (((mesesRes.data ?? []) as MesMetrica[]) ?? []).slice().reverse(),
      uso: {
        pessoasComAcesso: papeis.filter((r) => r !== 'ADMIN').length,
        temSupervisorOuGestor: papeis.some((r) => r === 'SUPERVISOR' || r === 'GESTOR'),
        cobrancasCriadas: cobrAbertasRes.count ?? 0,
        cobrancasResolvidas: cobrResolvRes.count ?? 0,
      },
      erro: listaRes.error?.message ?? mesesRes.error?.message ?? null,
    }
  } catch (e) {
    return { ...VAZIO, erro: (e as Error).message }
  }
}
