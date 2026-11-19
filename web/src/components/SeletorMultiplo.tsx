'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import { normalizarBusca, formatarNome } from '@/lib/utils'

export type OpcaoMultipla = { valor: string; grupo?: string }

/**
 * Seletor de VÁRIAS opções, pesquisável (Documento Mestre — Regra 57).
 * Guarda a escolha no endereço da página como parâmetros repetidos (ex.: ?dep=A&dep=B),
 * preservando os demais filtros. Vazio = sem filtro.
 *
 * - As marcações valem na hora na caixa, mas a lista só recarrega UMA vez: ao clicar em
 *   "Mostrar resultado", ao clicar fora ou ao tocar no véu (skill §1; antes, cada marcação recarregava).
 * - Esc fecha SEM aplicar o que mudou, e o cursor volta ao botão (Regra 43 item 7; Regra 55).
 * - No celular abre como folha que sobe do pé (.janela), com letra de 16 px (o iPhone não dá zoom).
 * - Nome de pessoa (atendente) aparece com a capitalização certa e nunca é cortado (Regras 23 e 24).
 */
export default function SeletorMultiplo({
  nome,
  rotulo,
  opcoes,
  rotuloVazio,
  minWidth = 180,
  nomeDePessoa,
}: {
  nome: string
  rotulo: string
  opcoes: OpcaoMultipla[]
  rotuloVazio: string
  minWidth?: number
  /** Mostra os valores como nome de pessoa (Regra 24). Padrão: liga sozinho quando nome = "atendente". */
  nomeDePessoa?: boolean
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()
  const daUrl = sp.getAll(nome)
  const pessoa = nomeDePessoa ?? nome === 'atendente'
  const exibir = (v: string) => (pessoa ? formatarNome(v) : v)

  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [marcados, setMarcados] = useState<string[]>(daUrl)
  const [celular, setCelular] = useState(false)
  const [alinharDireita, setAlinharDireita] = useState(false)
  const caixaRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const buscaRef = useRef<HTMLInputElement>(null)
  const marcadosRef = useRef(marcados)
  marcadosRef.current = marcados
  const id = useId()
  const idTitulo = `${id}-titulo`

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const f = () => setCelular(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  // No computador, a caixa abre para o lado que cabe na tela (nunca sai pela direita).
  useLayoutEffect(() => {
    if (!aberto || celular || !caixaRef.current) return
    const r = caixaRef.current.getBoundingClientRect()
    setAlinharDireita(r.left + 320 > window.innerWidth - 8)
  }, [aberto, celular])

  const igual = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v))

  function aplicar(novos: string[]) {
    if (igual(novos, sp.getAll(nome))) return
    const p = new URLSearchParams(sp.toString())
    p.delete(nome)
    for (const v of novos) p.append(nome, v)
    p.delete('pagina')
    const s = p.toString()
    window.dispatchEvent(new Event('prevatendimento:navegando'))
    router.push(`${pathname}${s ? '?' + s : ''}`)
  }

  function abrir() {
    setMarcados(sp.getAll(nome))
    setBusca('')
    setAberto(true)
  }
  function fechar(aplicarMudancas: boolean) {
    setAberto(false)
    setBusca('')
    if (aplicarMudancas) aplicar(marcadosRef.current)
    requestAnimationFrame(() => botaoRef.current?.focus())
  }

  useEffect(() => {
    if (!aberto) return
    const onDoc = (e: MouseEvent) => {
      if (celular) return // no celular, quem fecha é o véu ou os botões da folha
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) {
        setAberto(false); setBusca(''); aplicar(marcadosRef.current)
      }
    }
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); fechar(false); return }
      if (e.key === 'Tab' && celular && painelRef.current) {
        const f = [...painelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')]
        if (!f.length) return
        const primeiro = f[0], ultimo = f[f.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onTecla)
    buscaRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onTecla)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, celular])

  function alterna(valor: string) {
    setMarcados((m) => (m.includes(valor) ? m.filter((v) => v !== valor) : [...m, valor]))
  }

  const filtradas = opcoes.filter((o) => !busca || normalizarBusca(exibir(o.valor)).includes(normalizarBusca(busca)))
  const grupos = [...new Set(filtradas.map((o) => o.grupo ?? ''))]
  const resumo =
    daUrl.length === 0 ? rotuloVazio : daUrl.length === 1 ? exibir(daUrl[0]) : `${daUrl.length} marcados`
  const mudou = !igual(marcados, daUrl)

  const lista = (
    <>
      <div className="caixa-icone">
        <Search className="icone" aria-hidden="true" focusable="false" />
        <input ref={buscaRef} className="entrada" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Buscar ${rotulo.toLowerCase()}`} aria-label={`Buscar ${rotulo.toLowerCase()}`} />
      </div>
      <div style={{ maxHeight: celular ? 'none' : 280, overflowY: 'auto', marginTop: 6 }}>
        {filtradas.length === 0 ? (
          <p className="vazio-linha" style={{ padding: 8 }}>Nada encontrado para “{busca}”.</p>
        ) : (
          grupos.map((g) => (
            <div key={g || '_sem_grupo'} role="group" aria-label={g || undefined}>
              {g && <div className="mon-rot" style={{ padding: '8px 8px 2px' }}>{g}</div>}
              {filtradas.filter((o) => (o.grupo ?? '') === g).map((o) => {
                const marcado = marcados.includes(o.valor)
                return (
                  <button
                    key={o.valor}
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    onClick={() => alterna(o.valor)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 'max(40px, var(--alvo))', padding: '6px 8px', background: marcado ? 'var(--acao-suave)' : 'transparent', border: 0, borderRadius: 'var(--raio-p)', cursor: 'pointer', textAlign: 'left', color: 'var(--tinta)', fontSize: 'var(--t-meta)' }}
                  >
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: marcado ? 'var(--acao)' : 'transparent', boxShadow: marcado ? 'none' : 'inset 0 0 0 1.5px var(--contorno)', color: 'var(--superficie)' }}>
                      {marcado && <Check style={{ width: 13, height: 13 }} aria-hidden="true" focusable="false" />}
                    </span>
                    <span style={{ overflowWrap: 'anywhere' }}>{exibir(o.valor)}</span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </>
  )

  const pe = (
    <>
      <span className="texto-apoio" aria-live="polite">
        {marcados.length === 0 ? `Nenhum marcado: ${rotuloVazio}` : marcados.length === 1 ? '1 marcado' : `${marcados.length} marcados`}
      </span>
      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
        {marcados.length > 0 && (
          <button type="button" className="botao botao-discreto" onClick={() => setMarcados([])}>
            <X className="icone icone-p" aria-hidden="true" focusable="false" /> Desmarcar todos
          </button>
        )}
        <button type="button" className="botao botao-principal" onClick={() => fechar(true)}>
          {mudou ? 'Mostrar resultado' : 'Fechar'}
        </button>
      </span>
    </>
  )

  return (
    <div ref={caixaRef} style={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
      <button
        ref={botaoRef}
        type="button"
        className="entrada"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar(true) : abrir())}
        style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: Math.min(minWidth, 260), maxWidth: '100%', textAlign: 'left', cursor: 'pointer', height: 'auto' }}
      >
        {/* Nome longo quebra a linha; nunca é cortado com reticências (Regra 23). */}
        <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', color: daUrl.length ? 'var(--tinta)' : 'var(--tinta-2)' }}>
          {rotulo}: {resumo}
        </span>
        <ChevronDown className="icone" aria-hidden="true" focusable="false" style={{ color: 'var(--tinta-2)' }} />
      </button>

      {aberto && !celular && (
        <div
          ref={painelRef}
          role="dialog"
          aria-label={`Escolher ${rotulo.toLowerCase()}`}
          className="surge-pop"
          style={{
            position: 'absolute', zIndex: 50, top: 'calc(100% + 6px)',
            ...(alinharDireita ? { right: 0 } : { left: 0 }),
            width: 320, maxWidth: 'calc(100vw - 32px)',
            background: 'var(--superficie)', borderRadius: 'var(--raio-g)', boxShadow: 'var(--sombra-flutua)', padding: 10,
            transformOrigin: alinharDireita ? 'top right' : 'top left',
          }}
        >
          {lista}
          <div style={{ borderTop: '1px solid var(--linha)', marginTop: 8, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {pe}
          </div>
        </div>
      )}

      {aberto && celular && (
        <>
          <div className="veu" onClick={() => fechar(true)} />
          <div ref={painelRef} className="janela" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
            <div className="janela-cabeca">
              <div className="textos">
                <h2 className="janela-titulo" id={idTitulo}>{rotulo}</h2>
                <p className="janela-sub">Marque um ou mais. Sem nenhum marcado, mostra {rotuloVazio}.</p>
              </div>
              <button type="button" className="botao-icone" aria-label={`Fechar sem mudar ${rotulo.toLowerCase()}`} title="Fechar sem mudar" onClick={() => fechar(false)}>
                <X className="icone" aria-hidden="true" focusable="false" />
              </button>
            </div>
            <div className="janela-corpo">{lista}</div>
            <div className="janela-pe" style={{ flexWrap: 'wrap' }}>{pe}</div>
          </div>
        </>
      )}
    </div>
  )
}
