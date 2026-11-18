'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'

// Rótulos curtos, para caber em 320 px sem rolagem lateral (Regra 47); o nome completo fica na dica.
const OPCOES = [
  { chave: 'recente', label: 'Recentes', dica: 'Mais recente primeiro', icone: ArrowDownWideNarrow },
  { chave: 'antiga', label: 'Antigas', dica: 'Mais antiga primeiro', icone: ArrowUpNarrowWide },
]

/** Escolhe a ordem da lista. Padrão: mais RECENTE primeiro. Preserva os demais filtros. */
export default function FiltroOrdem() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('ordem') === 'antiga' ? 'antiga' : 'recente'

  function muda(v: string) {
    if (v === atual) return
    const p = new URLSearchParams(sp.toString())
    if (v === 'antiga') p.set('ordem', 'antiga')
    else p.delete('ordem')
    p.delete('pagina')
    const s = p.toString()
    window.dispatchEvent(new Event('prevatendimento:navegando'))
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <div role="group" aria-labelledby="filtro-ordem-rotulo" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
      <span className="mon-rot" id="filtro-ordem-rotulo">Ordem</span>
      <div className="chips">
        {OPCOES.map((o) => {
          const Icone = o.icone
          return (
            <button key={o.chave} type="button" className="chip" aria-pressed={atual === o.chave} onClick={() => muda(o.chave)} title={o.dica}>
              <Icone className="icone icone-p" aria-hidden="true" focusable="false" />
              {o.label}<span className="so-leitor"> ({o.dica.toLowerCase()})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
