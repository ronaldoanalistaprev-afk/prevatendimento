'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Carregando "Ações necessárias" (Regra 45: esqueleto no formato do conteúdo; o título real fica).
 * O leitor de tela ouve "Carregando…"; depois de 10 s aparece o aviso de demora (referência, peça 14).
 */
export default function CarregandoAcoes() {
  const [demora, setDemora] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemora(true), 10000); return () => clearTimeout(t) }, [])
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true">
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Ações necessárias</h1>
          <span className="esqueleto" aria-hidden="true" style={{ width: 460, maxWidth: '90%', height: 15, marginTop: 10 }} />
        </div>
      </div>
      <p className="so-leitor" role="status">Carregando…</p>
      <div aria-hidden="true" className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="cartao cartao-processo">
            <div className="esq-linha"><span className="esqueleto" style={{ width: 18, height: 18 }} /><span className="esqueleto" style={{ width: '60%', height: 14 }} /></div>
            <span className="esqueleto" style={{ width: 54, height: 28 }} />
            <span className="esqueleto" style={{ width: '50%', height: 12 }} />
          </div>
        ))}
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
