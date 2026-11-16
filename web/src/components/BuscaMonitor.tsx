'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

/** Busca por nome do cliente ou telefone, preservando os demais filtros. */
export default function BuscaMonitor() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const [texto, setTexto] = useState(sp.get('busca') ?? '')

  function buscar(valor: string) {
    const p = new URLSearchParams(sp.toString())
    if (valor.trim()) p.set('busca', valor.trim())
    else p.delete('busca')
    p.delete('pagina') // volta pra página 1
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  const temBusca = (sp.get('busca') ?? '') !== ''

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); buscar(texto) }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', minWidth: 0, maxWidth: 420 }}
    >
      <div className="caixa-icone" style={{ flex: 1, minWidth: 0 }}>
        <Search className="icone" aria-hidden="true" focusable="false" />
        <input
          className="entrada"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar por nome ou telefone"
          style={{ paddingRight: temBusca ? 40 : undefined }}
        />
        {temBusca && (
          <button
            type="button"
            onClick={() => { setTexto(''); buscar('') }}
            title="Limpar a busca"
            aria-label="Limpar a busca"
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--tinta-3)', display: 'flex' }}
          >
            <X className="icone icone-p" aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
      <button type="submit" className="botao botao-secundario">Buscar</button>
    </form>
  )
}
