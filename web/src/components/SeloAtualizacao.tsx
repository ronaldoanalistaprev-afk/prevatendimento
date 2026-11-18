import { getUltimaAtualizacao, ATRASO_MAXIMO_MIN } from '@/lib/atualizacao'
import { getPapelAtual } from '@/lib/papel'
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
    const papel = await getPapelAtual()
    const oQueFazer =
      papel.role === 'ADMIN'
        ? 'Renove o acesso (token) do Multi360 e religue o leitor.'
        : 'Avise o administrador: normalmente é o acesso (token) do Multi360 que venceu.'
    // Sem role="status": o Monitor se atualiza sozinho e o leitor de tela repetiria a frase a cada minuto.
    return (
      <span
        className="selo selo-atencao"
        style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}
      >
        <AlertTriangle className="icone icone-p" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" focusable="false" />
        <span>
          <b>Atualização automática parada há {formatarDuracao(iso)}</b> (última: {formatarDataHoraSegundos(iso)}). Os números
          desta tela podem estar desatualizados. {oQueFazer}
        </span>
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
