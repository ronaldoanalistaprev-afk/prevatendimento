'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/** Bloco com cabeçalho clicável que expande/retrai o conteúdo. */
export default function Expansivel({
  titulo,
  subtitulo,
  corBorda = '#EEF2F7',
  corTitulo = '#1A3C5A',
  inicialAberto = true,
  children,
}: {
  titulo: string
  subtitulo?: string
  corBorda?: string
  corTitulo?: string
  inicialAberto?: boolean
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(inicialAberto)
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden', borderTop: `4px solid ${corBorda}` }}>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', border: 'none', background: aberto ? '#fff' : '#F8FAFC', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: corTitulo }}>{titulo}</div>
          {subtitulo && <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>{subtitulo}</div>}
        </div>
        {aberto ? <ChevronUp size={20} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={20} style={{ color: '#9CA3AF' }} />}
      </button>
      {aberto && <div style={{ borderTop: '1px solid #F1F5F9' }}>{children}</div>}
    </div>
  )
}
