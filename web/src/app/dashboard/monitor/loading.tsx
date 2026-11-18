'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Esqueleto do Monitor Diário (Regra 45: "esqueleto no formato do conteúdo").
 * O título real fica; só os números e a lista viram esqueleto (referência 14).
 */
export default function CarregandoMonitor() {
  const [demorou, setDemorou] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemorou(true), 10000); return () => clearTimeout(t) }, [])

  return (
    <div className="conteudo" aria-busy="true">
      <p className="so-leitor" role="status">Carregando as conversas…</p>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Monitor Diário</h1>
          <p className="subtitulo">Conversas do Multi360. Quem está esperando aparece primeiro, de quem espera há mais tempo.</p>
        </div>
      </div>

      <div className="mon-resumo" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mon-num">
            <span className="esqueleto" style={{ width: 150, height: 14, maxWidth: '80%' }} />
            <span className="esqueleto" style={{ width: 70, height: 28, marginTop: 8 }} />
            <span className="esqueleto" style={{ width: 120, height: 13, marginTop: 6, maxWidth: '70%' }} />
          </div>
        ))}
      </div>

      <div className="cartao" aria-hidden="true">
        <div className="mon-barra">
          <span className="esqueleto" style={{ width: 320, height: 40, borderRadius: 10, maxWidth: '100%' }} />
        </div>
        <ul className="mon-lista">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="mon-item">
              <div>
                <span className="esqueleto" style={{ width: 220, height: 16, maxWidth: '70%' }} />
                <span className="esqueleto" style={{ width: 180, height: 13, marginTop: 8, maxWidth: '55%' }} />
                <span className="esqueleto" style={{ width: 340, height: 14, marginTop: 8, maxWidth: '90%' }} />
              </div>
              <div className="mon-dir">
                <span className="esqueleto" style={{ width: 110, height: 24, borderRadius: 999 }} />
                <span className="esqueleto" style={{ width: 70, height: 34, borderRadius: 9 }} />
              </div>
            </li>
          ))}
        </ul>
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
