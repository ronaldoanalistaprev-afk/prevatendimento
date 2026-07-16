'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'

const OPCOES = [
  { chave: 'antiga', label: 'Mais antiga primeiro', icone: ArrowUpNarrowWide },
  { chave: 'recente', label: 'Mais recente primeiro', icone: ArrowDownWideNarrow },
]

/** Escolhe a ordem da lista. Padrão: mais antiga primeiro. Preserva os demais filtros. */
export default function FiltroOrdem() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('ordem') === 'recente' ? 'recente' : 'antiga'

  function muda(v: string) {
    const p = new URLSearchParams(sp.toString())
    if (v === 'recente') p.set('ordem', 'recente')
    else p.delete('ordem')
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>Ordem</span>
      <span style={{ display: 'inline-flex', border: '1px solid #DCE6EF', borderRadius: 999, overflow: 'hidden' }}>
        {OPCOES.map((o) => {
          const sel = atual === o.chave
          const Icone = o.icone
          return (
            <button
              key={o.chave}
              onClick={() => muda(o.chave)}
              title={o.label}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, padding: '6px 12px', border: 'none',
                background: sel ? '#1A3C5A' : '#fff', color: sel ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
            >
              <Icone size={14} /> {o.label}
            </button>
          )
        })}
      </span>
    </span>
  )
}
