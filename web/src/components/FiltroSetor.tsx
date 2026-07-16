'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/** Seletor de setor/departamento — substitui a fileira de 11 chips. */
export default function FiltroSetor({ departamentos = [], cores = {} }: { departamentos?: string[]; cores?: Record<string, string> }) {
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

  // Ativo = azul-marinho (padrão dos filtros). A cor do setor fica só num ponto,
  // para não confundir com alerta (ex.: Judicial é vermelho na paleta).
  const corSetor = atual ? cores[atual] ?? '#94A3B8' : ''

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {atual && <span style={{ width: 9, height: 9, borderRadius: '50%', background: corSetor, flexShrink: 0 }} />}
      <select
        value={atual}
        onChange={(e) => muda(e.target.value)}
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: 999,
          border: '1px solid #DCE6EF',
          background: atual ? '#1A3C5A' : '#fff',
          color: atual ? '#fff' : '#475569',
          cursor: 'pointer',
          outline: 'none',
          maxWidth: 240,
        }}
      >
        <option value="">Todos os setores</option>
        {departamentos.map((d) => (
          <option key={d} value={d} style={{ color: '#111' }}>
            {d}
          </option>
        ))}
      </select>
    </span>
  )
}
