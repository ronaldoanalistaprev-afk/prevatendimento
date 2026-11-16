'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/** Bloco com cabeçalho clicável que expande/retrai o conteúdo. */
export default function Expansivel({
  titulo,
  subtitulo,
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
    <section className="cartao" style={{ overflow: 'hidden' }}>
      <button onClick={() => setAberto((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', border: 'none', background: aberto ? 'var(--superficie)' : 'var(--recuo)', cursor: 'pointer', textAlign: 'left' }} aria-expanded={aberto}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cartao-titulo">{titulo}</div>
          {subtitulo && <div className="texto-apoio">{subtitulo}</div>}
        </div>
        {aberto ? <ChevronUp className="icone" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" /> : <ChevronDown className="icone" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />}
      </button>
      {aberto && <div style={{ borderTop: '1px solid var(--linha)' }}>{children}</div>}
    </section>
  )
}
