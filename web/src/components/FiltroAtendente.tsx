'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

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
      }}
    >
      <option value="">Todos os atendentes</option>
      {comConversa.length > 0 && (
        <optgroup label="Com conversa aberta">
          {comConversa.map((a) => (
            <option key={a} value={a} style={{ color: '#111' }}>
              {a}
            </option>
          ))}
        </optgroup>
      )}
      {semConversa.length > 0 && (
        <optgroup label="Sem conversa aberta">
          {semConversa.map((a) => (
            <option key={a} value={a} style={{ color: '#111' }}>
              {a}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  )
}
