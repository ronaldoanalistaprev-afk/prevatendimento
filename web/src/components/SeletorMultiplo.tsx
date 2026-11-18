'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import { normalizarBusca } from '@/lib/utils'

export type OpcaoMultipla = { valor: string; grupo?: string }

/**
 * Seletor de VÁRIAS opções, pesquisável (Documento Mestre — Regra 57).
 * Guarda a escolha no endereço da página como parâmetros repetidos (ex.: ?dep=A&dep=B),
 * preservando os demais filtros. Vazio = sem filtro. Esc e clique fora fecham.
 */
export default function SeletorMultiplo({
  nome,
  rotulo,
  opcoes,
  rotuloVazio,
  minWidth = 180,
}: {
  nome: string
  rotulo: string
  opcoes: OpcaoMultipla[]
  rotuloVazio: string
  minWidth?: number
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const selecionados = sp.getAll(nome)
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const caixaRef = useRef<HTMLDivElement>(null)
  const buscaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!aberto) return
    const onDoc = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAberto(false); setBusca('') }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    buscaRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [aberto])

  function aplicar(novos: string[]) {
    const p = new URLSearchParams(sp.toString())
    p.delete(nome)
    for (const v of novos) p.append(nome, v)
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }
  function alterna(valor: string) {
    aplicar(selecionados.includes(valor) ? selecionados.filter((v) => v !== valor) : [...selecionados, valor])
  }

  const filtradas = opcoes.filter((o) => !busca || normalizarBusca(o.valor).includes(normalizarBusca(busca)))
  const grupos = [...new Set(filtradas.map((o) => o.grupo ?? ''))]
  const resumo =
    selecionados.length === 0 ? rotuloVazio : selecionados.length === 1 ? selecionados[0] : `${selecionados.length} selecionados`

  return (
    <div ref={caixaRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="entrada"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        style={{ minHeight: 34, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, minWidth, maxWidth: 260, textAlign: 'left', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selecionados.length ? 'var(--tinta)' : 'var(--tinta-3)' }}>
          {rotulo}: {resumo}
        </span>
        <ChevronDown className="icone" aria-hidden="true" focusable="false" />
      </button>

      {aberto && (
        <div role="listbox" aria-label={rotulo} aria-multiselectable="true" style={{ position: 'absolute', zIndex: 50, top: 'calc(100% + 4px)', left: 0, minWidth: 250, maxWidth: 320, background: 'var(--superficie)', border: '1px solid var(--linha)', borderRadius: 12, boxShadow: '0 12px 34px rgba(0,0,0,0.14)', padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
            <Search className="icone icone-p" style={{ color: 'var(--tinta-3)', flexShrink: 0 }} aria-hidden="true" focusable="false" />
            <input ref={buscaRef} className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" aria-label={`Buscar ${rotulo}`} style={{ minHeight: 32, fontSize: 13 }} />
          </div>
          <div style={{ maxHeight: 264, overflowY: 'auto', marginTop: 6 }}>
            {filtradas.length === 0 ? (
              <div className="texto-apoio" style={{ padding: '8px' }}>Nada encontrado.</div>
            ) : (
              grupos.map((g) => (
                <div key={g || '_sem_grupo'}>
                  {g && <div className="texto-apoio" style={{ padding: '6px 8px 2px', fontWeight: 700 }}>{g}</div>}
                  {filtradas.filter((o) => (o.grupo ?? '') === g).map((o) => {
                    const marcado = selecionados.includes(o.valor)
                    return (
                      <button
                        key={o.valor}
                        type="button"
                        role="option"
                        aria-selected={marcado}
                        onClick={() => alterna(o.valor)}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', minHeight: 40, padding: '6px 8px', background: marcado ? 'var(--acao-suave)' : 'transparent', border: 0, borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: 'var(--tinta)' }}
                      >
                        <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: marcado ? 'var(--acao)' : 'transparent', boxShadow: marcado ? 'none' : 'inset 0 0 0 1.5px var(--contorno)', color: '#fff' }}>
                          {marcado && <Check style={{ width: 13, height: 13 }} aria-hidden="true" focusable="false" />}
                        </span>
                        <span style={{ fontSize: 14, overflowWrap: 'anywhere' }}>{o.valor}</span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          {selecionados.length > 0 && (
            <div style={{ borderTop: '1px solid var(--linha)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="texto-apoio">{selecionados.length} marcado{selecionados.length > 1 ? 's' : ''}</span>
              <button type="button" className="botao botao-discreto" onClick={() => aplicar([])} style={{ minHeight: 32 }}>
                <X className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar {rotulo.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
