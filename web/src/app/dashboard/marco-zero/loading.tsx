'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Carregando o Marco Zero (Regra 45: esqueleto no formato do conteúdo; o título real fica).
 * Seis números, o quadro de preparar lote e a tabela de lotes. O leitor de tela ouve
 * "Carregando…"; depois de 10 s aparece o aviso de demora (referência, peça 14).
 */
export default function CarregandoMarcoZero() {
  const [demora, setDemora] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemora(true), 10000); return () => clearTimeout(t) }, [])
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true">
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Marco Zero</h1>
          <span className="esqueleto" aria-hidden="true" style={{ width: 480, maxWidth: '90%', height: 15, marginTop: 10 }} />
        </div>
      </div>
      <p className="so-leitor" role="status">Carregando…</p>
      <div aria-hidden="true">
        <div className="grade-numeros" style={{ marginBottom: 14 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="cartao cartao-processo" style={{ marginBottom: 0 }}>
              <span className="esqueleto" style={{ width: '70%', height: 13 }} />
              <span className="esqueleto" style={{ width: 54, height: 28 }} />
            </div>
          ))}
        </div>
        <div className="cartao cartao-processo" style={{ marginBottom: 18 }}>
          <span className="esqueleto" style={{ width: 200, height: 17 }} />
          <span className="esqueleto" style={{ width: '80%', height: 14 }} />
          <div className="esq-linha"><span className="esqueleto" style={{ width: 120, height: 38, borderRadius: 10 }} /><span className="esqueleto" style={{ width: 140, height: 38, borderRadius: 10 }} /></div>
        </div>
        <div className="cartao">
          <div className="cartao-cabeca"><span className="esqueleto" style={{ width: 70, height: 17 }} /></div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="esq-linha" style={{ padding: '12px 16px', borderTop: '1px solid var(--linha)', justifyContent: 'space-between' }}>
              <span className="esqueleto" style={{ width: '14%', height: 15 }} />
              <span className="esqueleto" style={{ width: '16%', height: 15 }} />
              <span className="esqueleto" style={{ width: '10%', height: 15 }} />
              <span className="esqueleto" style={{ width: '10%', height: 15 }} />
              <span className="esqueleto" style={{ width: '10%', height: 15 }} />
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
