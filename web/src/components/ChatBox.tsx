'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import type { Mensagem } from '@/lib/tipos'
import { formatarDataHora, formatarNome } from '@/lib/utils'

/**
 * Tique de status (✓ enviado, ✓✓ entregue, ✓✓ petróleo = lido). A diferença nunca é só a cor:
 * cada tique tem o nome escrito para o leitor de tela e na dica (auditoria W2; Regra 46).
 */
function Tique({ status }: { status: string | null }) {
  const info =
    status === 'read' ? { Icone: CheckCheck, cor: 'var(--acao)', texto: 'Lida' }
    : status === 'delivered' ? { Icone: CheckCheck, cor: 'var(--tinta-3)', texto: 'Entregue' }
    : status === 'sent' ? { Icone: Check, cor: 'var(--tinta-3)', texto: 'Enviada' }
    : status === 'failed' ? { Icone: AlertCircle, cor: 'var(--perigo)', texto: 'Não enviada' }
    : { Icone: Clock, cor: 'var(--tinta-3)', texto: 'Enviando' }
  const { Icone } = info
  return (
    <span title={info.texto} style={{ display: 'inline-flex', alignItems: 'center', color: info.cor }}>
      <Icone size={14} aria-hidden="true" focusable="false" />
      <span className="so-leitor">{info.texto}</span>
    </span>
  )
}

export default function ChatBox({
  conversaId,
  mensagensIniciais,
}: {
  conversaId: string
  mensagensIniciais: Mensagem[]
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(mensagensIniciais)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Respeita "reduzir movimento" do aparelho (auditoria W1; skill §14).
    const reduzir = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    fimRef.current?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'nearest' })
  }, [mensagens])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo) { setErro('Escreva a resposta antes de enviar.'); return }
    setEnviando(true)
    setErro(null)

    try {
      const res = await fetch('/api/mensagens/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversa_id: conversaId, conteudo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'A mensagem não foi enviada. Tente de novo.')

      if (data?.mensagem) setMensagens((prev) => [...prev, data.mensagem as Mensagem])
      setTexto('')
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 12, minHeight: 0 }}>
      {/* Histórico */}
      <div
        role="log"
        aria-label="Mensagens da conversa"
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--recuo-2)',
          borderRadius: 'var(--raio-g)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {mensagens.length === 0 && (
          <div className="vazio-curto" style={{ margin: 'auto' }}>
            Sem mensagens ainda. Escreva a primeira resposta abaixo.
          </div>
        )}
        {mensagens.map((m) => {
          const meu = m.quem === 'COLABORADOR'
          return (
            <div
              key={m.id}
              style={{
                alignSelf: meu ? 'flex-end' : 'flex-start',
                maxWidth: 'min(75%, 560px)',
                background: meu ? 'var(--acao-suave)' : 'var(--superficie)',
                borderRadius: 'var(--raio)',
                padding: '8px 12px',
                boxShadow: 'var(--sombra-cartao)',
              }}
            >
              <span className="so-leitor">{meu ? 'Escritório' : 'Cliente'}: </span>
              {meu && m.enviado_por_nome && (
                <div style={{ fontSize: 'var(--t-pequeno)', fontWeight: 650, color: 'var(--acao-forte)', marginBottom: 2 }}>
                  {formatarNome(m.enviado_por_nome)}
                </div>
              )}
              <div style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.conteudo}</div>
              <div style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-3)', textAlign: 'right', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                {formatarDataHora(m.created_at)}
                {meu && <Tique status={m.external_status} />}
              </div>
            </div>
          )
        })}
        <div ref={fimRef} />
      </div>

      {erro && (
        <div className="erro-campo" role="alert" id="chat-erro" style={{ marginTop: 6 }}>
          <AlertCircle className="icone" aria-hidden="true" focusable="false" />{erro}
        </div>
      )}

      {/* Envio */}
      <form onSubmit={enviar} style={{ display: 'flex', gap: 8, marginTop: 10, paddingBottom: 12 }}>
        <label className="so-leitor" htmlFor="chat-resposta">Escreva uma resposta</label>
        <input
          id="chat-resposta"
          className="entrada"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); if (erro) setErro(null) }}
          placeholder="Escreva uma resposta…"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? 'chat-erro' : undefined}
          autoComplete="off"
          enterKeyHint="send"
          style={{ flex: 1, minHeight: 46, borderRadius: 999 }}
        />
        <button
          type="submit"
          disabled={enviando}
          className="botao botao-principal"
          aria-label={enviando ? 'Enviando a resposta' : 'Enviar resposta'}
          title="Enviar resposta"
          style={{ width: 46, minHeight: 46, padding: 0, borderRadius: '50%', flexShrink: 0 }}
        >
          {enviando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Send className="icone icone-p" aria-hidden="true" focusable="false" />}
        </button>
      </form>
    </div>
  )
}
