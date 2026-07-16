'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatarDataHora, formatarNome } from '@/lib/utils'
import type { HistoricoProtocolo, AtMensagem } from '@/lib/dados'

function ehFinalizada(status: string | null): boolean {
  return status === 'FINALIZADO'
}

export default function BlocoProtocolo({ p, atual }: { p: HistoricoProtocolo; atual: boolean }) {
  const [aberto, setAberto] = useState(false)
  const finalizada = ehFinalizada(p.status_multi360)
  const clienteFalouPorUltimo = p.ultima_mensagem_direcao === 'cliente'
  const s = finalizada
    ? { bg: '#EEF2F7', fg: '#64748B', label: 'Finalizada' }
    : { bg: '#DCFCE7', fg: '#15803D', label: 'Aberta' }

  // mensagens da MAIS RECENTE para a mais antiga
  const ordenadas = [...p.mensagens].reverse()
  const visiveis = aberto ? ordenadas : ordenadas.slice(0, 3)
  const escondidas = ordenadas.length - visiveis.length

  return (
    <div style={{ borderRadius: 16, border: atual ? '2px solid #16A34A' : '1px solid #EEF2F7', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      {/* separador do protocolo */}
      <div style={{ background: '#F8FAFC', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.fg }}>{s.label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1A3C5A' }}>Protocolo {p.numero_protocolo}</span>
        <span style={{ fontSize: 12, color: '#6B7280' }}>{p.departamento ?? '—'} · {p.atendente_nome ? formatarNome(p.atendente_nome) : 'sem atendente'}</span>
        {atual && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#16A34A' }}>• você abriu este</span>}
        <button
          onClick={() => setAberto((v) => !v)}
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', borderRadius: 999, border: '1px solid #DCE6EF', background: '#fff', color: '#1A3C5A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          {aberto ? <><ChevronUp size={15} /> Retrair</> : <><ChevronDown size={15} /> Expandir{escondidas > 0 ? ` (+${escondidas})` : ''}</>}
        </button>
      </div>

      {/* quem falou por último */}
      {!finalizada && (
        <div style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, background: clienteFalouPorUltimo ? '#FEF9C3' : '#DCFCE7', color: clienteFalouPorUltimo ? '#A16207' : '#15803D', borderBottom: '1px solid #EEF2F7' }}>
          {clienteFalouPorUltimo
            ? '⏳ O cliente falou por último — esperando resposta da equipe'
            : '✓ A equipe respondeu por último'}
        </div>
      )}

      {/* mensagens (mais recente primeiro) */}
      <div style={{ background: '#ECE5DD', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ordenadas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#7c7c7c', fontSize: 12.5, margin: '16px auto' }}>Sem mensagens capturadas.</div>
        ) : (
          <>
            {/* Aviso permanente: aqui a ordem é do mais NOVO para o mais ANTIGO (ao contrário do WhatsApp) */}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#6b6b6b', fontWeight: 600, marginBottom: 4, background: 'rgba(255,255,255,0.6)', borderRadius: 999, padding: '3px 10px', alignSelf: 'center' }}>
              ↓ da mensagem mais recente para a mais antiga
              {!aberto && escondidas > 0 ? ` · vendo as 3 últimas (+${escondidas} ao expandir)` : ''}
            </div>
            {visiveis.map((m) => <Bolha key={m.id} m={m} />)}
            {escondidas > 0 && !aberto && (
              <button
                onClick={() => setAberto(true)}
                style={{ alignSelf: 'center', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 14px', borderRadius: 999, border: 'none', background: '#1A3C5A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <ChevronDown size={15} /> Ver as {escondidas} mensagens anteriores
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Bolha({ m }: { m: AtMensagem }) {
  const daEquipe = m.remetente_tipo === 'colaborador' || m.remetente_tipo === 'bot'
  return (
    <div
      style={{
        alignSelf: daEquipe ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        background: daEquipe ? '#DCF8C6' : '#FFFFFF',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: daEquipe ? '#1A3C5A' : '#7E22CE', marginBottom: 2 }}>
        {m.remetente_nome ? formatarNome(m.remetente_nome) : daEquipe ? 'Equipe' : 'Cliente'}
      </div>
      <div style={{ fontSize: 14, color: '#111', whiteSpace: 'pre-wrap' }}>
        {m.texto ?? <span style={{ color: '#8a8a8a', fontStyle: 'italic' }}>{m.tem_anexo ? '[anexo]' : '[sem texto]'}</span>}
      </div>
      {/* data em destaque (era o ponto fraco visual) */}
      <div style={{ fontSize: 11.5, color: '#1A3C5A', fontWeight: 700, textAlign: 'right', marginTop: 3 }}>{formatarDataHora(m.enviado_em)}</div>
    </div>
  )
}
