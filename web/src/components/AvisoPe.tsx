'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

/**
 * Aviso do pé da tela (Documento Mestre — Regras 43 item 2 e 50; referência .aviso-pe e comportamento.js:290).
 * Diz que a ação deu certo, some sozinho em 8 s (pausa com o mouse, o dedo ou o foco), tem "Fechar" e,
 * quando a ação tem volta, "Desfazer".
 *
 * Uso num componente cliente:
 *   const { avisar } = useAvisoPe()
 *   avisar({ texto: 'Cobrança criada.', desfazer: async () => { … } })
 *   avisar({ texto: 'Não foi possível desfazer. Tente de novo.', erro: true })
 */
interface Aviso { id: number; texto: string; erro?: boolean; desfazer?: () => Promise<void> | void }
interface Ctx { avisar: (a: { texto: string; erro?: boolean; desfazer?: () => Promise<void> | void }) => void }

const AvisoCtx = createContext<Ctx>({ avisar: () => {} })
export const useAvisoPe = () => useContext(AvisoCtx)

export function AvisoPeProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [saindo, setSaindo] = useState(false)
  const [desfazendo, setDesfazendo] = useState(false)
  const pausado = useRef(false)
  const restante = useRef(8000)
  const inicio = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fechar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setSaindo(true)
    setTimeout(() => { setAviso(null); setSaindo(false) }, 220)
  }, [])

  const armar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    inicio.current = Date.now()
    timer.current = setTimeout(fechar, restante.current)
  }, [fechar])

  const avisar = useCallback<Ctx['avisar']>((a) => {
    restante.current = 8000
    setSaindo(false)
    setDesfazendo(false)
    setAviso({ id: Date.now(), ...a })
  }, [])

  useEffect(() => {
    if (!aviso) return
    armar()
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [aviso, armar])

  const pausar = () => {
    if (pausado.current || !timer.current) return
    pausado.current = true
    clearTimeout(timer.current)
    restante.current = Math.max(1500, restante.current - (Date.now() - inicio.current))
  }
  const retomar = () => {
    if (!pausado.current) return
    pausado.current = false
    armar()
  }

  async function onDesfazer() {
    if (!aviso?.desfazer) return
    setDesfazendo(true)
    try {
      await aviso.desfazer()
      fechar()
    } catch {
      avisar({ texto: 'Não foi possível desfazer. Tente de novo ou faça a mudança na própria tela.', erro: true })
    }
  }

  return (
    <AvisoCtx.Provider value={{ avisar }}>
      {children}
      <div role={aviso?.erro ? 'alert' : 'status'} aria-live={aviso?.erro ? 'assertive' : 'polite'} className="so-leitor">{aviso && !saindo ? aviso.texto : ''}</div>
      {aviso && (
        <div
          key={aviso.id}
          className={`aviso-pe${saindo ? ' saindo' : ''}`}
          onMouseEnter={pausar}
          onMouseLeave={retomar}
          onFocus={pausar}
          onBlur={retomar}
          onTouchStart={pausar}
        >
          {aviso.erro
            ? <AlertCircle className="icone icone-erro" aria-hidden="true" focusable="false" />
            : <CheckCircle2 className="icone icone-ok" aria-hidden="true" focusable="false" />}
          <span className="aviso-pe-texto">{aviso.texto}</span>
          {aviso.desfazer && (
            <button type="button" className="botao botao-discreto" onClick={onDesfazer} disabled={desfazendo}>
              {desfazendo ? 'Desfazendo…' : 'Desfazer'}
            </button>
          )}
          <button type="button" className="botao-icone" aria-label="Fechar o aviso" onClick={fechar}>
            <X className="icone" aria-hidden="true" focusable="false" />
          </button>
        </div>
      )}
    </AvisoCtx.Provider>
  )
}
