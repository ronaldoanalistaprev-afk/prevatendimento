'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'

const OPCOES = [
  { chave: 'recente', label: 'Mais recente primeiro', icone: ArrowDownWideNarrow },
  { chave: 'antiga', label: 'Mais antiga primeiro', icone: ArrowUpNarrowWide },
]

/** Escolhe a ordem da lista. Padrão: mais RECENTE primeiro. Preserva os demais filtros. */
export default function FiltroOrdem() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('ordem') === 'antiga' ? 'antiga' : 'recente'

  function muda(v: string) {
    const p = new URLSearchParams(sp.toString())
    if (v === 'antiga') p.set('ordem', 'antiga')
    else p.delete('ordem')
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="mon-rot">Ordem</span>
      <div className="abas">
        {OPCOES.map((o) => {
          const sel = atual === o.chave
          const Icone = o.icone
          return (
            <button key={o.chave} className="aba" aria-selected={sel} onClick={() => muda(o.chave)} title={o.label}>
              <Icone className="icone icone-p" aria-hidden="true" focusable="false" style={{ color: 'inherit' }} /> {o.label}
            </button>
          )
        })}
      </div>
    </span>
  )
}
