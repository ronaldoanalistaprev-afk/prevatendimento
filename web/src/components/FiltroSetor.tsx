'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

/** Seletor de setor/departamento — substitui a fileira de 11 chips. */
export default function FiltroSetor({ departamentos = [] }: { departamentos?: string[]; cores?: Record<string, string> }) {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('dep') ?? ''

  function muda(v: string) {
    const p = new URLSearchParams(sp.toString())
    if (v) p.set('dep', v)
    else p.delete('dep')
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <div className="caixa-select" style={{ minWidth: 170 }}>
      <select className="entrada" value={atual} onChange={(e) => muda(e.target.value)} aria-label="Filtrar por setor" style={{ minHeight: 34, fontSize: 14 }}>
        <option value="">Todos os setores</option>
        {departamentos.map((d) => (<option key={d} value={d}>{d}</option>))}
      </select>
      <ChevronDown className="icone" aria-hidden="true" focusable="false" />
    </div>
  )
}
