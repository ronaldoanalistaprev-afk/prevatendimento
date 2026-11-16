'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/**
 * Lembra o período escolhido no Monitor DURANTE a sessão do navegador.
 * - Nasce em "Hoje" ao entrar no sistema (sessionStorage vazio).
 * - Guarda a escolha enquanto o usuário navega por outras telas.
 * - Ao voltar ao Monitor sem período na URL, reaplica o que ficou salvo.
 * (sessionStorage limpa ao fechar o navegador = "novo acesso ao sistema".)
 */
export default function LembrarPeriodo() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    try {
      const periodo = sp.get('periodo')
      const competencia = sp.get('competencia')
      // Há período/competência na URL → é a escolha atual: guarda.
      if (competencia) { sessionStorage.setItem('monitor_periodo', 'comp:' + competencia); return }
      if (periodo) { sessionStorage.setItem('monitor_periodo', periodo); return }
      // Sem período na URL → reaplica o salvo (a não ser que seja "hoje", que já é o padrão).
      const salvo = sessionStorage.getItem('monitor_periodo')
      if (salvo && salvo !== 'hoje') {
        const p = new URLSearchParams(sp.toString())
        if (salvo.startsWith('comp:')) { p.set('competencia', salvo.slice(5)); p.delete('periodo') }
        else p.set('periodo', salvo)
        router.replace(`${pathname}?${p.toString()}`)
      }
    } catch {
      /* sessionStorage indisponível — segue com o padrão (hoje) */
    }
  }, [sp, pathname, router])

  return null
}
