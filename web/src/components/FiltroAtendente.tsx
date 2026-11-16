'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

/** Seletor de atendente que preserva os demais filtros da URL.
 *  Separa quem tem conversa aberta de quem não tem. */
export default function FiltroAtendente({
  comConversa = [],
  semConversa = [],
}: {
  comConversa?: string[]
  semConversa?: string[]
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('atendente') ?? ''

  function muda(v: string) {
    const p = new URLSearchParams(sp.toString())
    if (v) p.set('atendente', v)
    else p.delete('atendente')
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <div className="caixa-select" style={{ minWidth: 180 }}>
      <select className="entrada" value={atual} onChange={(e) => muda(e.target.value)} aria-label="Filtrar por atendente" style={{ minHeight: 34, fontSize: 14 }}>
        <option value="">Todos os atendentes</option>
        {comConversa.length > 0 && (
          <optgroup label="Com conversa aberta">
            {comConversa.map((a) => (<option key={a} value={a}>{a}</option>))}
          </optgroup>
        )}
        {semConversa.length > 0 && (
          <optgroup label="Sem conversa aberta">
            {semConversa.map((a) => (<option key={a} value={a}>{a}</option>))}
          </optgroup>
        )}
      </select>
      <ChevronDown className="icone" aria-hidden="true" focusable="false" />
    </div>
  )
}
