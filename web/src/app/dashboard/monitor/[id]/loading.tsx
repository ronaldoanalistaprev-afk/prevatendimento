'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

/** Esqueleto da conversa aberta (Regra 45): cabeça do cliente e um atendimento com mensagens. */
export default function CarregandoConversa() {
  const [demorou, setDemorou] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemorou(true), 10000); return () => clearTimeout(t) }, [])

  return (
    <div className="conteudo" aria-busy="true" style={{ maxWidth: 860 }}>
      <p className="so-leitor" role="status">Carregando a conversa…</p>
      <Link href="/dashboard/monitor" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Monitor</Link>

      <div className="cartao" aria-hidden="true" style={{ padding: '16px 20px', marginTop: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="esqueleto avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="esqueleto" style={{ width: 240, height: 24, maxWidth: '80%' }} />
          <span className="esqueleto" style={{ width: 320, height: 14, marginTop: 8, maxWidth: '95%' }} />
        </div>
      </div>

      <div className="cartao" aria-hidden="true" style={{ overflow: 'hidden' }}>
        <div className="esq-linha" style={{ padding: '10px 16px', background: 'var(--recuo)' }}>
          <span className="esqueleto" style={{ width: 70, height: 24, borderRadius: 999 }} />
          <span className="esqueleto" style={{ width: 160, height: 14 }} />
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 10, background: 'var(--recuo-2)' }}>
          {[60, 45, 70].map((w, i) => (
            <span key={i} className="esqueleto" style={{ width: `${w}%`, height: 54, borderRadius: 10, justifySelf: i % 2 ? 'end' : 'start' }} />
          ))}
        </div>
      </div>

      {demorou && (
        <div className="aviso aviso-neutro aviso-demora" role="status">
          <Clock className="icone" aria-hidden="true" focusable="false" />
          <div>
            Está demorando mais que o normal. A internet ou o servidor podem estar lentos.{' '}
            <button type="button" className="botao botao-secundario" style={{ marginTop: 8 }} onClick={() => window.location.reload()}>Recarregar a página</button>
          </div>
        </div>
      )}
    </div>
  )
}
