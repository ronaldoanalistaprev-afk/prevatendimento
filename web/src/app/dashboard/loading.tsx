'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Esqueleto de carregamento do painel (Documento Mestre — Regra 45: CARREGANDO).
 * Vale para as telas que não têm um esqueleto próprio (o Monitor, a conversa e a Minha conta têm).
 * Por isso NÃO finge a forma de nenhuma tela: só o título e um cartão com linhas de texto.
 * Anuncia "Carregando…" ao leitor de tela e, se passar de 10 s, explica e oferece recarregar
 * (DECISOES, peça 14; comportamento.js — data-demora).
 */
export default function CarregandoDashboard() {
  const demorou = useDemora()
  return (
    <div className="conteudo" aria-busy="true">
      <p className="so-leitor" role="status">Carregando…</p>
      <div className="cabeca" aria-hidden="true">
        <div className="cabeca-texto">
          <span className="esqueleto" style={{ width: 240, height: 30, maxWidth: '70%' }} />
          <span className="esqueleto" style={{ width: 420, height: 15, maxWidth: '90%', marginTop: 10 }} />
        </div>
      </div>

      <div className="cartao cartao-processo" aria-hidden="true">
        {[78, 92, 64, 85, 52].map((w, i) => (
          <div key={i} className="esq-linha">
            <span className="esqueleto" style={{ width: `${w}%`, height: 14 }} />
          </div>
        ))}
      </div>

      {demorou && <AvisoDemora />}
    </div>
  )
}

function useDemora() {
  const [demorou, setDemorou] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDemorou(true), 10000)
    return () => clearTimeout(t)
  }, [])
  return demorou
}

function AvisoDemora() {
  return (
    <div className="aviso aviso-neutro aviso-demora" role="status">
      <Clock className="icone" aria-hidden="true" focusable="false" />
      <div>
        Está demorando mais que o normal. A internet ou o servidor podem estar lentos.{' '}
        <button type="button" className="botao botao-secundario" style={{ marginTop: 8 }} onClick={() => window.location.reload()}>
          Recarregar a página
        </button>
      </div>
    </div>
  )
}
