import { getUltimaAtualizacao, ATRASO_MAXIMO_MIN } from '@/lib/atualizacao'
import { formatarDataHoraSegundos, formatarDuracao } from '@/lib/utils'
import { RefreshCw, AlertTriangle } from 'lucide-react'

/**
 * Selo "Atualizado com o Multi360: <data> · há <tempo>".
 * Sem `em`, busca sozinho a última sincronização; com `em`, usa o valor que a página já carregou.
 * Regra "automatizar, avisar ou impedir": se o leitor está sem trazer nada há mais de 45 minutos,
 * o selo vira aviso — os números da tela podem estar velhos e alguém precisa religar a sincronização.
 */
export default async function SeloAtualizacao({ em }: { em?: string | null }) {
  const iso = em === undefined ? await getUltimaAtualizacao() : em
  if (!iso) return null
  const atrasoMin = (Date.now() - new Date(iso).getTime()) / 60000
  if (atrasoMin > ATRASO_MAXIMO_MIN) {
    return (
      <span
        role="status"
        className="selo selo-atencao"
        title="O leitor do Multi360 não trouxe conversas novas. Normalmente é o acesso (token) do Multi360 que venceu."
        style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        <AlertTriangle className="icone icone-p" aria-hidden="true" focusable="false" />
        Atualização automática parada há {formatarDuracao(iso)} (última: {formatarDataHoraSegundos(iso)}). Os números podem estar desatualizados — avise o administrador.
      </span>
    )
  }
  return (
    <span
      title="Hora em que o leitor trouxe as conversas do Multi360 pela última vez"
      style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      <RefreshCw className="icone icone-p" aria-hidden="true" focusable="false" />
      Atualizado com o Multi360: <b style={{ color: 'var(--tinta-2)' }}>{formatarDataHoraSegundos(iso)}</b> · há {formatarDuracao(iso)}
    </span>
  )
}
