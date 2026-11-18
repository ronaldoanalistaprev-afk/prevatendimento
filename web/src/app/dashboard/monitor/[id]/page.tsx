import Link from 'next/link'
import { ArrowLeft, Clock, SearchX } from 'lucide-react'
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

/** Endereço de volta para o Monitor com os mesmos filtros (Regra 42 item 2). Só aceita parâmetros, nunca outro caminho. */
function hrefVoltar(volta: string | undefined): string {
  if (!volta) return '/dashboard/monitor'
  try {
    const p = new URLSearchParams(volta)
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  } catch {
    return '/dashboard/monitor'
  }
}

export default async function MonitorConversaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ volta?: string }> }) {
  const { id } = await params
  const { volta } = await searchParams
  const voltar = hrefVoltar(volta)
  const [hist, papel, modelos] = await Promise.all([getHistoricoCliente(id), getPapelAtual(), getModelosCobranca()])
  const podeCobrar = papel.cobrar

  if (!hist) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 860 }}>
        <Link href={voltar} className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Monitor</Link>
        <div className="cartao" style={{ marginTop: 14 }}>
          <div className="vazio">
            <div className="vazio-icone"><SearchX className="icone" aria-hidden="true" focusable="false" /></div>
            <h1 className="vazio-titulo">Conversa não encontrada</h1>
            <p className="vazio-texto">
              O endereço pode estar incompleto, ou a conversa não está mais no espelho do Multi360. Volte ao Monitor e abra a conversa pela lista.
            </p>
            <Link href={voltar} className="botao botao-secundario">Voltar ao Monitor</Link>
          </div>
        </div>
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
  const nomeCliente = hist.cliente_nome ? formatarNome(hist.cliente_nome) : 'Cliente sem nome no Multi360'

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href={voltar} className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Monitor</Link>
        <SeloAtualizacao />
      </div>

      <section className="cartao" aria-labelledby="conversa-titulo" style={{ padding: '16px 20px', marginTop: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="avatar g" aria-hidden="true">{iniciais(hist.cliente_nome)}</span>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <h1 className="titulo" id="conversa-titulo" style={{ fontSize: 24 }}>{nomeCliente}</h1>
            <p className="texto-apoio" style={{ marginTop: 2 }}>
              {formatarTelefone(hist.cliente_telefone)} · {hist.protocolos.length} atendimento{hist.protocolos.length > 1 ? 's' : ''} ({abertos} aberto{abertos !== 1 ? 's' : ''}, {finalizados} finalizado{finalizados !== 1 ? 's' : ''}) · {hist.totalMensagens} mensage{hist.totalMensagens === 1 ? 'm' : 'ns'}
            </p>
          </div>
          {esperaAtual && (
            <span className="selo selo-atencao" style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              <Clock className="icone icone-p" aria-hidden="true" focusable="false" /> Esperando há {esperaAtual}
            </span>
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
