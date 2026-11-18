import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { getHistoricoCliente } from '@/lib/dados'
import { getModelosCobranca } from '@/lib/modelos'
import { getPapelAtual } from '@/lib/papel'
import { formatarTelefone, formatarNome, formatarDuracao } from '@/lib/utils'
import BotaoCobrar from '@/components/BotaoCobrar'
import BlocoProtocolo from '@/components/BlocoProtocolo'
import SeloAtualizacao from '@/components/SeloAtualizacao'

export const dynamic = 'force-dynamic'

function ehFinalizada(status: string | null): boolean {
  return status === 'FINALIZADO'
}

function iniciais(nome: string | null): string {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase() || '?'
}

export default async function MonitorConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [hist, papel, modelos] = await Promise.all([getHistoricoCliente(id), getPapelAtual(), getModelosCobranca()])
  const podeCobrar = papel.cobrar

  if (!hist) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 860 }}>
        <Link href="/dashboard/monitor" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Monitor</Link>
        <div className="cartao" style={{ marginTop: 14 }}><div className="vazio"><p className="vazio-texto">Conversa não encontrada.</p></div></div>
      </main>
    )
  }

  const atual = hist.protocolos.find((p) => p.id === hist.atualProtocoloId) ?? hist.protocolos[0]
  const abertos = hist.protocolos.filter((p) => !ehFinalizada(p.status_multi360)).length
  const finalizados = hist.protocolos.length - abertos
  // Tempo de espera (igual ao selo "Aguardando · X" do Monitor): só quando a
  // conversa atual está aberta e o cliente falou por último (a bola está com o escritório).
  const atualEsperando = atual && !ehFinalizada(atual.status_multi360) && atual.ultima_mensagem_direcao === 'cliente'
  const esperaAtual = atualEsperando ? formatarDuracao(atual.ultima_mensagem_em) : null

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/dashboard/monitor" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Monitor</Link>
        <SeloAtualizacao />
      </div>

      <section className="cartao" style={{ padding: '16px 20px', marginTop: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--acao-suave)', color: 'var(--acao)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{iniciais(hist.cliente_nome)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 16, overflowWrap: 'anywhere' }}>{hist.cliente_nome ? formatarNome(hist.cliente_nome) : 'Cliente'}</div>
            <div className="texto-apoio">
              {formatarTelefone(hist.cliente_telefone)} · {hist.protocolos.length} atendimento{hist.protocolos.length > 1 ? 's' : ''} ({abertos} aberto{abertos !== 1 ? 's' : ''}, {finalizados} finalizado{finalizados !== 1 ? 's' : ''}) · {hist.totalMensagens} mensagens
            </div>
          </div>
          {esperaAtual && (
            <div className="selo selo-atencao" style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              <Clock className="icone icone-p" aria-hidden="true" focusable="false" /> Esperando há {esperaAtual}
            </div>
          )}
        </div>
      </section>

      {podeCobrar && atual && !ehFinalizada(atual.status_multi360) && (
        <div style={{ marginBottom: 14 }}>
          <BotaoCobrar protocoloId={atual.id} atendente={atual.atendente_nome} modelos={modelos.map((m) => ({ id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias }))} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {hist.protocolos.map((p) => {
          const esperando = !ehFinalizada(p.status_multi360) && p.ultima_mensagem_direcao === 'cliente'
          return (<BlocoProtocolo key={p.id} p={p} atual={p.id === hist.atualProtocoloId} espera={esperando ? formatarDuracao(p.ultima_mensagem_em) : undefined} />)
        })}
      </div>

      <p className="texto-apoio" style={{ marginTop: 14, textAlign: 'center' }}>Histórico completo do cliente (todos os atendimentos). Somente leitura — a captura vem do Multi360. O responsável e os participantes acima vêm do Multi360; o gestor pode acompanhar qualquer conversa sem ser participante.</p>
    </main>
  )
}
