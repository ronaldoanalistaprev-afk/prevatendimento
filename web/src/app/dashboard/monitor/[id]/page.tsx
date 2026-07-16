import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getHistoricoCliente } from '@/lib/dados'
import { getModelosCobranca } from '@/lib/modelos'
import { getPapelAtual } from '@/lib/papel'
import { formatarTelefone, formatarNome } from '@/lib/utils'
import BotaoCobrar from '@/components/BotaoCobrar'
import BlocoProtocolo from '@/components/BlocoProtocolo'
import SeloAtualizacao from '@/components/SeloAtualizacao'

export const dynamic = 'force-dynamic'

// No nosso sistema só existem 2 situações: Aberta (qualquer status em andamento no
// Multi360) ou Finalizada.
function ehFinalizada(status: string | null): boolean {
  return status === 'FINALIZADO'
}

export default async function MonitorConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [hist, papel, modelos] = await Promise.all([getHistoricoCliente(id), getPapelAtual(), getModelosCobranca()])
  const podeCobrar = papel.cobrar

  if (!hist) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>
        <Link href="/dashboard/monitor" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Monitor
        </Link>
        <div style={{ marginTop: 20, padding: 40, textAlign: 'center', color: '#9CA3AF', background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7' }}>
          Conversa não encontrada.
        </div>
      </div>
    )
  }

  const atual = hist.protocolos.find((p) => p.id === hist.atualProtocoloId) ?? hist.protocolos[0]
  const abertos = hist.protocolos.filter((p) => !ehFinalizada(p.status_multi360)).length
  const finalizados = hist.protocolos.length - abertos

  return (
    <div style={{ padding: '20px 24px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dashboard/monitor" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Monitor
        </Link>
        <SeloAtualizacao />
      </div>

      {/* Cabeçalho do cliente */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '16px 20px', marginTop: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 19 }}>
            {hist.cliente_nome?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 16 }}>{hist.cliente_nome ? formatarNome(hist.cliente_nome) : 'Cliente'}</div>
            <div style={{ fontSize: 12.5, color: '#6B7280' }}>
              {formatarTelefone(hist.cliente_telefone)} · {hist.protocolos.length} atendimento{hist.protocolos.length > 1 ? 's' : ''}
              {' '}({abertos} aberto{abertos !== 1 ? 's' : ''}, {finalizados} finalizado{finalizados !== 1 ? 's' : ''}) · {hist.totalMensagens} mensagens
            </div>
          </div>
        </div>
      </div>

      {/* Cobrar o atendente do atendimento atual (supervisor/gestor) */}
      {podeCobrar && atual && !ehFinalizada(atual.status_multi360) && (
        <div style={{ marginBottom: 14 }}>
          <BotaoCobrar
            protocoloId={atual.id}
            atendente={atual.atendente_nome}
            modelos={modelos.map((m) => ({ id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias }))}
          />
        </div>
      )}

      {/* Histórico completo: protocolos do mais recente ao mais antigo; cada um retraído (3 últimas). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {hist.protocolos.map((p) => (
          <BlocoProtocolo key={p.id} p={p} atual={p.id === hist.atualProtocoloId} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14, textAlign: 'center' }}>
        Histórico completo do cliente (todos os atendimentos). Somente leitura — a captura vem do Multi360.
      </p>
    </div>
  )
}
