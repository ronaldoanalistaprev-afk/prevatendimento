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
      onSubmit={(e) => {
        e.preventDefault()
        buscar(texto)
      }}
      style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 380 }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          style={{
            width: '100%',
            height: 38,
            padding: '0 32px 0 32px',
            borderRadius: 999,
            border: '1px solid #DCE6EF',
            outline: 'none',
            fontSize: 13.5,
            background: '#fff',
          }}
        />
        {temBusca && (
          <button
            type="button"
            onClick={() => {
              setTexto('')
              buscar('')
            }}
            title="Limpar"
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}
          >
            <X size={15} />
          </button>
        )}
      </div>
      <button
        type="submit"
        style={{ height: 38, padding: '0 16px', borderRadius: 999, border: 'none', background: '#1A3C5A', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
      >
        Buscar
      </button>
    </form>
  )
}
