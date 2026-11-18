'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

/**
 * O que está sendo digitado sobrevive se a lista for remontada enquanto carrega (o esqueleto
 * do Monitor pode trocar a tela inteira): o texto e o cursor voltam para a caixa.
 */
const memoria: { texto: string; focado: boolean; em: number } = { texto: '', focado: false, em: 0 }

/**
 * Busca por nome do cliente ou telefone, ENQUANTO DIGITA (Documento Mestre — Regra 2):
 * espera ~300 ms depois da última tecla, sem botão nem Enter, e preserva os demais filtros.
 */
export default function BuscaMonitor() {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const daUrl = sp.get('busca') ?? ''
  const recente = memoria.focado && Date.now() - memoria.em < 15000
  const [texto, setTexto] = useState(recente ? memoria.texto : daUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const enviado = useRef(daUrl)
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Remontou no meio da digitação: devolve o cursor ao fim do texto.
  useEffect(() => {
    if (!recente || !inputRef.current) return
    const el = inputRef.current
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A busca mudou por fora (etiqueta "Tirar filtro", "Limpar filtros"): a caixa acompanha.
  useEffect(() => {
    if (daUrl !== enviado.current) {
      enviado.current = daUrl
      if (!memoria.focado) { setTexto(daUrl); memoria.texto = daUrl }
    }
  }, [daUrl])

  useEffect(() => () => { if (espera.current) clearTimeout(espera.current) }, [])

  function buscar(valor: string) {
    const limpo = valor.trim()
    if (limpo === enviado.current) return
    enviado.current = limpo
    // Lê os filtros do endereço no momento do disparo (outro filtro pode ter mudado nos 300 ms de espera).
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : sp.toString())
    if (limpo) p.set('busca', limpo)
    else p.delete('busca')
    p.delete('pagina') // volta pra página 1
    const s = p.toString()
    window.dispatchEvent(new Event('prevatendimento:navegando'))
    router.replace(`${pathname}${s ? '?' + s : ''}`, { scroll: false })
  }

  function digitar(valor: string) {
    setTexto(valor)
    memoria.texto = valor; memoria.em = Date.now()
    if (espera.current) clearTimeout(espera.current)
    espera.current = setTimeout(() => buscar(valor), 300)
  }

  function limpar() {
    if (espera.current) clearTimeout(espera.current)
    setTexto(''); memoria.texto = ''
    buscar('')
    inputRef.current?.focus()
  }

  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); if (espera.current) clearTimeout(espera.current); buscar(texto) }}
      style={{ flex: '1 1 240px', minWidth: 0, maxWidth: 460 }}
    >
      <div className="caixa-icone">
        <Search className="icone" aria-hidden="true" focusable="false" />
        <input
          ref={inputRef}
          className="entrada"
          type="search"
          value={texto}
          onChange={(e) => digitar(e.target.value)}
          onFocus={() => { memoria.focado = true; memoria.em = Date.now() }}
          onBlur={() => { memoria.focado = false }}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar por nome ou telefone"
          aria-describedby="busca-monitor-ajuda"
          enterKeyHint="search"
          style={{ paddingRight: texto ? 48 : undefined }}
        />
        <span id="busca-monitor-ajuda" className="so-leitor">A lista se atualiza enquanto você digita.</span>
        {texto && (
          <button
            type="button"
            className="botao-icone"
            onClick={limpar}
            title="Limpar a busca"
            aria-label="Limpar a busca"
            style={{ position: 'absolute', right: 3, top: '50%', translate: '0 -50%' }}
          >
            <X className="icone icone-p" aria-hidden="true" focusable="false" />
          </button>
        )}
      </div>
    </form>
  )
}

/**
 * Filtros de segunda linha do Monitor. No celular ficam recolhidos atrás de "Mais filtros (n)",
 * para a primeira conversa aparecer sem rolar uma pilha de filtros (referência .mais-filtros, foto 04).
 * No computador ficam sempre à vista.
 */
export function FiltrosRecolhiveis({ ativos, children }: { ativos: number; children: React.ReactNode }) {
  const [celular, setCelular] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const aplicar = () => setCelular(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  const visivel = !celular || aberto
  return (
    <div className="mon-barra">
      {celular && (
        <button
          type="button"
          className="botao botao-acao"
          aria-expanded={aberto}
          aria-controls="monitor-mais-filtros"
          onClick={() => setAberto((v) => !v)}
          style={{ width: '100%' }}
        >
          <SlidersHorizontal className="icone icone-p" aria-hidden="true" focusable="false" />
          {aberto ? 'Esconder filtros' : 'Mais filtros'}{ativos > 0 ? ` (${ativos})` : ''}
        </button>
      )}
      <div
        id="monitor-mais-filtros"
        hidden={!visivel}
        style={{ display: visivel ? 'flex' : 'none', alignItems: 'center', gap: '10px 12px', flexWrap: 'wrap', width: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}
