'use client'

import { useEffect, useState } from 'react'

/**
 * Esqueleto de carregamento no FORMATO de cada tela (Documento Mestre — Regra 45; auditoria L1/L2).
 * - O título real fica; só os dados viram esqueleto (referência 14 do pacote do PrevSystem).
 * - O leitor de tela ouve "Carregando…" (role="status" + .so-leitor).
 * - Depois de 10 s aparece o aviso de demora (comportamento.js, data-demora).
 * Usado pelos loading.tsx de Colaboradores, Configurações, Catálogo, Laboratório WhatsApp, Pessoas e Gestão.
 */
export type FormaEsqueleto = 'lista' | 'tabela' | 'cartoes' | 'formulario' | 'detalhe' | 'conversa'

export default function Esqueleto({
  titulo,
  subtitulo = true,
  voltar,
  forma,
  linhas = 5,
  largura,
}: {
  /** Título real da tela; `null` quando o título é o nome do registro (vira esqueleto). */
  titulo: string | null
  subtitulo?: boolean
  /** Texto do link de voltar, quando a tela tem um. */
  voltar?: string
  forma: FormaEsqueleto
  linhas?: number
  largura?: number
}) {
  const [demora, setDemora] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDemora(true), 10_000)
    return () => clearTimeout(t)
  }, [])

  const n = Array.from({ length: linhas }, (_, i) => i)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} aria-busy="true" style={largura ? { maxWidth: largura } : undefined}>
      <p role="status" className="so-leitor">Carregando…</p>

      {voltar && <span className="voltar" aria-hidden="true">{voltar}</span>}

      <div className="cabeca" aria-hidden={titulo ? undefined : true}>
        <div className="cabeca-texto">
          {titulo ? <h1 className="titulo">{titulo}</h1> : <span className="esqueleto" style={{ width: 260, height: 30, maxWidth: '70%' }} />}
          {subtitulo && <span className="esqueleto" style={{ width: 420, height: 15, maxWidth: '90%', marginTop: 10 }} />}
        </div>
      </div>

      <div aria-hidden="true">
        {forma === 'cartoes' && (
          <div className="grade-numeros">
            {n.map((i) => (
              <div key={i} className="cartao cartao-processo">
                <span className="esqueleto" style={{ width: '60%', height: 16 }} />
                <span className="esqueleto" style={{ width: '90%', height: 13 }} />
                <span className="esqueleto" style={{ width: '40%', height: 13 }} />
              </div>
            ))}
          </div>
        )}

        {(forma === 'lista' || forma === 'tabela') && (
          <div className="cartao">
            {forma === 'tabela' && (
              <div className="esq-linha" style={{ padding: '12px 16px', borderBottom: '1px solid var(--linha)' }}>
                <span className="esqueleto" style={{ width: '25%', height: 13 }} />
                <span className="esqueleto" style={{ width: '20%', height: 13 }} />
                <span className="esqueleto" style={{ width: '15%', height: 13 }} />
              </div>
            )}
            {n.map((i) => (
              <div key={i} className="esq-linha" style={{ padding: '14px 16px', borderTop: i === 0 ? 0 : '1px solid var(--linha)' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8 }}>
                  <span className="esqueleto" style={{ width: 220, height: 16, maxWidth: '70%' }} />
                  <span className="esqueleto" style={{ width: 320, height: 13, maxWidth: '85%' }} />
                </div>
                <span className="esqueleto" style={{ width: 80, height: 24, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        )}

        {forma === 'formulario' && (
          <div className="cartao cartao-processo">
            {n.map((i) => (
              <div key={i} style={{ display: 'grid', gap: 6 }}>
                <span className="esqueleto" style={{ width: 140, height: 13 }} />
                <span className="esqueleto" style={{ width: '100%', height: 40, borderRadius: 10 }} />
              </div>
            ))}
          </div>
        )}

        {forma === 'detalhe' && (
          <div className="processo-grade">
            <div className="coluna">
              {[0, 1].map((i) => (
                <div key={i} className="cartao cartao-processo">
                  <span className="esqueleto" style={{ width: 180, height: 17 }} />
                  {n.slice(0, 3).map((j) => <span key={j} className="esqueleto" style={{ width: `${90 - j * 15}%`, height: 14 }} />)}
                </div>
              ))}
            </div>
            <div className="coluna">
              <div className="cartao cartao-processo">
                <span className="esqueleto" style={{ width: 120, height: 15 }} />
                {n.slice(0, 3).map((j) => <span key={j} className="esqueleto" style={{ width: `${80 - j * 10}%`, height: 14 }} />)}
              </div>
            </div>
          </div>
        )}

        {forma === 'conversa' && (
          <div className="cartao cartao-processo">
            {n.map((i) => (
              <span key={i} className="esqueleto" style={{ width: `${45 + ((i * 17) % 30)}%`, height: 44, borderRadius: 12, justifySelf: i % 2 ? 'end' : 'start' }} />
            ))}
          </div>
        )}
      </div>

      {demora && (
        <div className="aviso aviso-neutro aviso-demora" role="status">
          Está demorando mais que o normal. A conexão pode estar lenta; a tela aparece assim que os dados chegarem.
        </div>
      )}
    </main>
  )
}
