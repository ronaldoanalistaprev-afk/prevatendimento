'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Carregando a Auditoria (Regra 45: esqueleto no formato do conteúdo; o título real fica).
 * Filtros, dois cartões de número e a lista de clientes. O leitor de tela ouve "Carregando…";
 * depois de 10 s aparece o aviso de demora (referência, peça 14).
 */
export default function CarregandoAuditoria() {
  const [demora, setDemora] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemora(true), 10000); return () => clearTimeout(t) }, [])
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true">
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Auditoria</h1>
          <span className="esqueleto" aria-hidden="true" style={{ width: 420, maxWidth: '90%', height: 15, marginTop: 10 }} />
        </div>
      </div>
      <p className="so-leitor" role="status">Carregando…</p>
      <div aria-hidden="true">
        <div className="cartao" style={{ marginBottom: 14 }}>
          <div className="mon-barra">
            <span className="esqueleto" style={{ width: 150, height: 13 }} />
            {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="esqueleto" style={{ width: 56, height: 32, borderRadius: 999 }} />)}
          </div>
          <div className="mon-barra">
            <span className="esqueleto" style={{ width: 150, height: 34, borderRadius: 10 }} />
            <span className="esqueleto" style={{ width: 170, height: 34, borderRadius: 10 }} />
          </div>
        </div>
        <div className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
          {[0, 1].map((i) => (
            <div key={i} className="cartao cartao-processo">
              <span className="esqueleto" style={{ width: '55%', height: 14 }} />
              <span className="esqueleto" style={{ width: 70, height: 28 }} />
              <span className="esqueleto" style={{ width: '70%', height: 12 }} />
            </div>
          ))}
        </div>
        <div className="cartao">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mon-item">
              <div style={{ display: 'grid', gap: 8 }}>
                <span className="esqueleto" style={{ width: 220, maxWidth: '70%', height: 16 }} />
                <span className="esqueleto" style={{ width: 180, maxWidth: '55%', height: 13 }} />
                <span className="esqueleto" style={{ width: 320, maxWidth: '85%', height: 14 }} />
              </div>
              <div className="esq-linha"><span className="esqueleto" style={{ width: 110, height: 24, borderRadius: 999 }} /><span className="esqueleto" style={{ width: 70, height: 34, borderRadius: 9 }} /></div>
            </div>
          ))}
        </div>
      </div>
      {demora && (
        <div className="aviso aviso-neutro aviso-demora" role="status">
          <Clock className="icone" aria-hidden="true" focusable="false" />
          <span>Está demorando mais que o normal. Confira a internet; a página aparece assim que terminar de carregar.</span>
        </div>
      )}
    </main>
  )
}
