'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Janela de confirmação DESENHADA PELO SISTEMA (Documento Mestre — Regra 43:
 * os diálogos nativos do navegador — confirm/alert/prompt — são PROIBIDOS).
 *
 * Também cumpre:
 *  • Regra 55 item 17 — o foco começa SEMPRE no caminho seguro (Cancelar / Entendi),
 *    para um Enter dado por reflexo nunca apagar nem confirmar nada grave;
 *  • Regra 43 item 7 — Esc fecha, o Tab fica preso dentro da janela e, ao fechar,
 *    o foco volta para onde estava;
 *  • Regra 50 — a ação destrutiva fica em vermelho (nunca é o botão principal) e
 *    diz o nome do que será afetado (quem chama passa isso na mensagem).
 *
 * Uso:
 *   const { confirmar, avisar, modal } = useConfirmacao()
 *   ...
 *   if (await confirmar({ titulo: 'Excluir acesso', mensagem: '...', confirmar: 'Excluir acesso', perigo: true })) { ... }
 *   await avisar({ titulo: '...', mensagem: '...' })
 *   ...
 *   return (<>{conteudo}{modal}</>)
 */

interface OpcoesConfirmar {
  titulo: string
  mensagem?: string
  /** Rótulo do botão de ação (o que faz). Ex.: "Excluir acesso". Diz o verbo (Regra 49). */
  confirmar?: string
  /** Rótulo do botão seguro. Padrão "Cancelar". */
  cancelar?: string
  /** Ação destrutiva/irreversível → botão vermelho (Regra 50). */
  perigo?: boolean
}

interface OpcoesAviso {
  titulo: string
  mensagem?: string
  /** Rótulo do único botão. Padrão "Entendi". */
  ok?: string
}

type Pedido =
  | ({ tipo: 'confirmar' } & OpcoesConfirmar)
  | ({ tipo: 'aviso' } & OpcoesAviso)

const botaoBase: React.CSSProperties = {
  height: 40,
  padding: '0 16px',
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: 'pointer',
  border: '1px solid #DCE6EF',
  background: '#fff',
  color: '#475569',
}
const botaoPrimario: React.CSSProperties = { ...botaoBase, background: '#1A3C5A', color: '#fff', border: 'none' }
const botaoPerigo: React.CSSProperties = { ...botaoBase, background: '#B91C1C', color: '#fff', border: 'none' }

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
      if (e.key === 'Escape') {
        e.preventDefault()
        fechar(false)
        return
      }
      if (e.key === 'Tab') {
        const foco = dialogo.current?.querySelectorAll<HTMLElement>('button')
        if (!foco || foco.length === 0) return
        const primeiro = foco[0]
        const ultimo = foco[foco.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [pedido, fechar])

  const modal = pedido ? (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(false) }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogo}
        role={pedido.tipo === 'aviso' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxWidth: 420, width: '100%', padding: 22 }}
      >
        <div id="confirmacao-titulo" style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A' }}>{pedido.titulo}</div>
        {pedido.mensagem && <div style={{ fontSize: 13.5, color: '#4B5563', marginTop: 8, lineHeight: 1.55 }}>{pedido.mensagem}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
          {pedido.tipo === 'confirmar' ? (
            <>
              <button ref={botaoSeguro} onClick={() => fechar(false)} style={botaoBase}>
                {pedido.cancelar ?? 'Cancelar'}
              </button>
              <button onClick={() => fechar(true)} style={pedido.perigo ? botaoPerigo : botaoPrimario}>
                {pedido.confirmar ?? 'Confirmar'}
              </button>
            </>
          ) : (
            <button ref={botaoSeguro} onClick={() => fechar(false)} style={botaoPrimario}>
              {pedido.ok ?? 'Entendi'}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null

  return { confirmar, avisar, modal }
}
