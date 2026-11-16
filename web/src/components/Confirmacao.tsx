'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Janela de confirmação DESENHADA PELO SISTEMA (Documento Mestre — Regra 43:
 * os diálogos nativos do navegador — confirm/alert/prompt — são PROIBIDOS), na
 * aparência da skill Apple Design (classe .janela-confirma).
 *
 * Também cumpre:
 *  • Regra 55 item 17 — o foco começa SEMPRE no caminho seguro (Cancelar / Entendi);
 *  • Regra 43 item 7 — Esc fecha, o Tab fica preso na janela, o foco volta ao abrir;
 *  • Regra 50 — a ação destrutiva fica em vermelho (nunca é o botão principal).
 *
 * Uso:
 *   const { confirmar, avisar, modal } = useConfirmacao()
 *   if (await confirmar({ titulo: '…', mensagem: '…', confirmar: 'Excluir', perigo: true })) { … }
 *   await avisar({ titulo: '…', mensagem: '…' })
 *   return (<>{conteudo}{modal}</>)
 */

interface OpcoesConfirmar {
  titulo: string
  mensagem?: string
  confirmar?: string
  cancelar?: string
  perigo?: boolean
}
interface OpcoesAviso {
  titulo: string
  mensagem?: string
  ok?: string
}
type Pedido =
  | ({ tipo: 'confirmar' } & OpcoesConfirmar)
  | ({ tipo: 'aviso' } & OpcoesAviso)

export function useConfirmacao() {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const botaoSeguro = useRef<HTMLButtonElement | null>(null)
  const dialogo = useRef<HTMLDivElement | null>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)

  const abrir = useCallback((p: Pedido) => {
    focoAnterior.current = (document.activeElement as HTMLElement) ?? null
    setPedido(p)
    return new Promise<boolean>((res) => { resolver.current = res })
  }, [])

  const confirmar = useCallback((o: OpcoesConfirmar) => abrir({ tipo: 'confirmar', ...o }), [abrir])
  const avisar = useCallback((o: OpcoesAviso) => abrir({ tipo: 'aviso', ...o }).then(() => undefined), [abrir])

  const fechar = useCallback((valor: boolean) => {
    setPedido(null)
    resolver.current?.(valor)
    resolver.current = null
    const alvo = focoAnterior.current
    if (alvo && typeof alvo.focus === 'function') setTimeout(() => alvo.focus(), 0)
  }, [])

  useEffect(() => {
    if (!pedido) return
    botaoSeguro.current?.focus()
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); fechar(false); return }
      if (e.key === 'Tab') {
        const foco = dialogo.current?.querySelectorAll<HTMLElement>('button')
        if (!foco || foco.length === 0) return
        const primeiro = foco[0]
        const ultimo = foco[foco.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [pedido, fechar])

  const modal = pedido ? (
    <>
      <div className="veu" onMouseDown={() => fechar(false)} />
      <div
        ref={dialogo}
        className="janela janela-confirma"
        role={pedido.tipo === 'aviso' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
      >
        <div className="janela-cabeca"><div className="textos"><h2 className="janela-titulo" id="confirmacao-titulo">{pedido.titulo}</h2></div></div>
        <div className="janela-corpo">
          {pedido.mensagem && <p className="confirma-texto">{pedido.mensagem}</p>}
          <div className="confirma-botoes" style={{ marginTop: 16 }}>
            {pedido.tipo === 'confirmar' ? (
              <>
                <button ref={botaoSeguro} type="button" className="botao botao-secundario" onClick={() => fechar(false)}>{pedido.cancelar ?? 'Cancelar'}</button>
                <button type="button" className={`botao ${pedido.perigo ? 'botao-perigo' : 'botao-principal'}`} onClick={() => fechar(true)}>{pedido.confirmar ?? 'Confirmar'}</button>
              </>
            ) : (
              <button ref={botaoSeguro} type="button" className="botao botao-principal" onClick={() => fechar(false)}>{pedido.ok ?? 'Entendi'}</button>
            )}
          </div>
        </div>
      </div>
    </>
  ) : null

  return { confirmar, avisar, modal }
}
