import { getUltimaAtualizacao } from '@/lib/atualizacao'
import { formatarDataHoraSegundos, formatarDuracao } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

/**
 * Selo "Atualizado com o Multi360: <data> · há <tempo>".
 * Sem `em`, busca sozinho a última sincronização; com `em`, usa o valor que a página já carregou.
 */
export default async function SeloAtualizacao({ em }: { em?: string | null }) {
  const iso = em === undefined ? await getUltimaAtualizacao() : em
  if (!iso) return null
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
