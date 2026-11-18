'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Check, Users } from 'lucide-react'
import { formatarDataHora, formatarNome } from '@/lib/utils'
import type { HistoricoProtocolo, AtMensagem } from '@/lib/dados'

function ehFinalizada(status: string | null): boolean {
  return status === 'FINALIZADO'
}

export default function BlocoProtocolo({ p, atual, espera }: { p: HistoricoProtocolo; atual: boolean; espera?: string }) {
  const [aberto, setAberto] = useState(false)
  const finalizada = ehFinalizada(p.status_multi360)
  const clienteFalouPorUltimo = p.ultima_mensagem_direcao === 'cliente'

  // Participantes da conversa (espelhados do Multi360): o responsável (principal)
  // e os demais colaboradores adicionados para acompanhar. O gestor pode entrar
  // numa conversa sem ser participante — por isso ele não aparece nesta lista.
  const participantes = p.participantes ?? []
  const responsavel = participantes.find((x) => x.principal) ?? null
  const acompanhantes = participantes.filter((x) => !x.principal)

  const ordenadas = [...p.mensagens].reverse()
  const visiveis = aberto ? ordenadas : ordenadas.slice(0, 3)
  const escondidas = ordenadas.length - visiveis.length

  return (
    <section className="cartao" style={{ overflow: 'hidden', boxShadow: atual ? '0 0 0 1.5px var(--acao), var(--sombra-cartao)' : 'var(--sombra-cartao)' }}>
      {/* separador do protocolo */}
      <div style={{ background: 'var(--recuo)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--linha)' }}>
        <span className={`selo ${finalizada ? 'selo-neutro' : 'selo-sucesso'}`}>{finalizada ? 'Finalizada' : 'Aberta'}</span>
        <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--tinta)' }}>Protocolo {p.numero_protocolo}</span>
        <span className="texto-apoio">{p.departamento ?? '—'} · {p.atendente_nome ? formatarNome(p.atendente_nome) : 'sem atendente'}</span>
        {atual && <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--acao)' }}>• você abriu este</span>}
        <button onClick={() => setAberto((v) => !v)} className="botao botao-secundario" style={{ marginLeft: 'auto', minHeight: 30, padding: '0 12px', fontSize: 13 }}>
          {aberto ? <><ChevronUp className="icone icone-p" aria-hidden="true" focusable="false" /> Retrair</> : <><ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" /> Expandir{escondidas > 0 ? ` (+${escondidas})` : ''}</>}
        </button>
      </div>

      {/* participantes da conversa (sempre que capturados) */}
      {participantes.length > 0 && (
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--linha)' }}>
          <Users className="icone icone-p" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
          <span className="texto-apoio">{acompanhantes.length > 0 ? 'Participantes:' : 'Responsável:'}</span>
          {responsavel && <span className="selo selo-acao">{formatarNome(responsavel.nome)} · responsável</span>}
          {acompanhantes.map((a) => (<span key={a.nome} className="selo selo-neutro">{formatarNome(a.nome)}</span>))}
          {!responsavel && acompanhantes.length === 0 && <span className="texto-apoio">—</span>}
        </div>
      )}

      {/* quem falou por último */}
      {!finalizada && (
        <div style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: clienteFalouPorUltimo ? 'var(--atencao-suave)' : 'var(--sucesso-suave)', color: clienteFalouPorUltimo ? 'var(--atencao)' : 'var(--sucesso)', borderBottom: '1px solid var(--linha)' }}>
          {clienteFalouPorUltimo
            ? <><Clock className="icone icone-p" aria-hidden="true" focusable="false" /> O cliente falou por último — esperando resposta da equipe{espera ? ` há ${espera}` : ''}</>
            : <><Check className="icone icone-p" aria-hidden="true" focusable="false" /> A equipe respondeu por último</>}
        </div>
      )}

      {/* mensagens (mais recente primeiro) — fundo estilo WhatsApp, de propósito */}
      <div style={{ background: '#ECE5DD', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ordenadas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5F6368', fontSize: 13, margin: '16px auto' }}>Sem mensagens capturadas.</div>
        ) : (
          <>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#4A4E53', fontWeight: 600, marginBottom: 4, background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: '3px 10px', alignSelf: 'center' }}>
              da mensagem mais recente para a mais antiga{!aberto && escondidas > 0 ? ` · vendo as 3 últimas (+${escondidas} ao expandir)` : ''}
            </div>
            {visiveis.map((m) => <Bolha key={m.id} m={m} />)}
            {escondidas > 0 && !aberto && (
              <button onClick={() => setAberto(true)} className="botao botao-principal" style={{ alignSelf: 'center', marginTop: 4, minHeight: 30 }}>
                <ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" /> Ver as {escondidas} mensagens anteriores
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function Bolha({ m }: { m: AtMensagem }) {
  const daEquipe = m.remetente_tipo === 'colaborador' || m.remetente_tipo === 'bot'
  return (
    <div style={{ alignSelf: daEquipe ? 'flex-end' : 'flex-start', maxWidth: '78%', background: daEquipe ? '#DCF8C6' : '#FFFFFF', borderRadius: 10, padding: '8px 12px', boxShadow: '0 1px 1px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: daEquipe ? '#0B4D5A' : '#7E22CE', marginBottom: 2 }}>
        {m.remetente_nome ? formatarNome(m.remetente_nome) : daEquipe ? 'Equipe' : 'Cliente'}
      </div>
      <div style={{ fontSize: 14, color: '#191B1D', whiteSpace: 'pre-wrap' }}>
        {m.texto ?? <span style={{ color: '#5F6368', fontStyle: 'italic' }}>{m.tem_anexo ? '[anexo]' : '[sem texto]'}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: '#4A4E53', fontWeight: 700, textAlign: 'right', marginTop: 3 }}>{formatarDataHora(m.enviado_em)}</div>
    </div>
  )
}
