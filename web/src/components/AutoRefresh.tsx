'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Atualiza a tela sozinha (soft refresh do server component) em intervalo fixo.
 * Só atualiza quando a aba está visível — evita trabalho à toa em segundo plano.
 * Mostra um selo fixo de "ao vivo": nada pisca nem se mexe sozinho (Regra 52; skill §14).
 */
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return (
    <span className="selo selo-sucesso" title="A tela se atualiza sozinha a cada poucos segundos">
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flex: 'none' }} />
      ao vivo<span className="so-leitor"> — a tela se atualiza sozinha</span>
    </span>
  )
}
