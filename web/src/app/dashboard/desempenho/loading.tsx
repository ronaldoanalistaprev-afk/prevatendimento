'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Carregando o Desempenho (Regra 45: esqueleto no formato do conteúdo; o título real fica).
 * Seis cartões de número e a tabela por atendente. O leitor de tela ouve "Carregando…";
 * depois de 10 s aparece o aviso de demora (referência, peça 14).
 */
export default function CarregandoDesempenho() {
  const [demora, setDemora] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemora(true), 10000); return () => clearTimeout(t) }, [])
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true">
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Desempenho da equipe</h1>
          <span className="esqueleto" aria-hidden="true" style={{ width: 440, maxWidth: '90%', height: 15, marginTop: 10 }} />
        </div>
      </div>
      <p className="so-leitor" role="status">Carregando…</p>
      <div aria-hidden="true">
        <div className="ini-acoes" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="cartao cartao-processo" style={{ marginBottom: 0 }}>
              <span className="esqueleto" style={{ width: '70%', height: 13 }} />
              <span className="esqueleto" style={{ width: 60, height: 30 }} />
              <span className="esqueleto" style={{ width: '55%', height: 12 }} />
            </div>
          ))}
        </div>
        <div className="cartao">
          <div className="cartao-cabeca"><span className="esqueleto" style={{ width: 130, height: 17 }} /></div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="esq-linha" style={{ padding: '12px 16px', borderTop: '1px solid var(--linha)', justifyContent: 'space-between' }}>
              <span className="esqueleto" style={{ width: '28%', height: 15 }} />
              <span className="esqueleto" style={{ width: '10%', height: 15 }} />
              <span className="esqueleto" style={{ width: '22%', height: 10, borderRadius: 999 }} />
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
