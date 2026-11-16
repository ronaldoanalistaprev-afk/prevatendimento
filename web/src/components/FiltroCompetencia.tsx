'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

/** Seletor de competência (mês/ano) no padrão SIAP: MM/AAAA (ex.: 07/2026). Últimos 18 meses. */
export default function FiltroCompetencia() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const atual = sp.get('competencia') ?? ''

  // gera os últimos 18 meses (YYYY-MM)
  const hoje = new Date()
  const opcoes: { valor: string; rotulo: string }[] = []
  for (let i = 0; i < 18; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const valor = `${d.getFullYear()}-${mm}`
    opcoes.push({ valor, rotulo: `${mm}/${d.getFullYear()}` }) // padrão SIAP: MM/AAAA
  }

  function muda(v: string) {
    const p = new URLSearchParams(sp.toString())
    if (v) {
      p.set('competencia', v)
      p.delete('periodo') // competência substitui o período relativo
    } else {
      p.delete('competencia')
    }
    p.delete('pagina')
    const s = p.toString()
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  return (
    <div className="caixa-select" style={{ minWidth: 130 }}>
      <select className="entrada" value={atual} onChange={(e) => muda(e.target.value)} aria-label="Filtrar por mês (competência)" style={{ minHeight: 34, fontSize: 14 }}>
        <option value="">Qualquer mês</option>
        {opcoes.map((o) => (<option key={o.valor} value={o.valor}>{o.rotulo}</option>))}
      </select>
      <ChevronDown className="icone" aria-hidden="true" focusable="false" />
    </div>
  )
}
