'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Carregando as Cobranças (Regra 45: esqueleto no formato do conteúdo; o título real fica —
 * aqui o nome do menu, porque o título muda conforme o papel). Filtro de situação e a lista de
 * cobranças. O leitor de tela ouve "Carregando…"; depois de 10 s aparece o aviso de demora.
 */
export default function CarregandoCobrancas() {
  const [demora, setDemora] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDemora(true), 10000); return () => clearTimeout(t) }, [])
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true">
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Cobranças</h1>
          <span className="esqueleto" aria-hidden="true" style={{ width: 440, maxWidth: '90%', height: 15, marginTop: 10 }} />
        </div>
      </div>
      <p className="so-leitor" role="status">Carregando…</p>
      <div aria-hidden="true">
        <span className="esqueleto" style={{ width: 160, height: 38, borderRadius: 10, marginBottom: 18 }} />
        <div className="cartao">
          <div className="mon-barra">
            <span className="esqueleto" style={{ width: 60, height: 13 }} />
            {[0, 1, 2, 3].map((i) => <span key={i} className="esqueleto" style={{ width: 86, height: 32, borderRadius: 999 }} />)}
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mon-item">
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="esq-linha"><span className="esqueleto" style={{ width: 200, maxWidth: '55%', height: 16 }} /><span className="esqueleto" style={{ width: 80, height: 22, borderRadius: 999 }} /></div>
                <span className="esqueleto" style={{ width: 360, maxWidth: '90%', height: 14 }} />
                <span className="esqueleto" style={{ width: 300, maxWidth: '75%', height: 13 }} />
              </div>
              <div className="esq-linha"><span className="esqueleto" style={{ width: 96, height: 38, borderRadius: 10 }} /><span className="esqueleto" style={{ width: 80, height: 38, borderRadius: 10 }} /></div>
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
