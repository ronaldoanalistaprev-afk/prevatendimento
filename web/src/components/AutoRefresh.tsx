'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Atualiza a tela sozinha (soft refresh do server component) em intervalo fixo.
 * Só atualiza quando a aba está visível — evita trabalho à toa em segundo plano.
 * Renderiza um selinho discreto de "ao vivo".
 */
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [pulsando, setPulsando] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
        setPulsando(true)
        setTimeout(() => setPulsando(false), 600)
      }
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return (
    <span
      title="A tela atualiza sozinha a cada poucos segundos"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11.5,
        fontWeight: 600,
        color: '#15803D',
        background: '#DCFCE7',
        borderRadius: 999,
        padding: '3px 10px',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#16A34A',
          boxShadow: pulsando ? '0 0 0 4px rgba(22,163,74,0.25)' : 'none',
          transition: 'box-shadow 0.3s',
        }}
      />
      ao vivo
    </span>
  )
}
