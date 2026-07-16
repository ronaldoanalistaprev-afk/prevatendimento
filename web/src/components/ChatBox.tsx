'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import type { Mensagem } from '@/lib/tipos'
import { formatarDataHora } from '@/lib/utils'

/** Tique de status (✓ enviado, ✓✓ entregue, ✓✓ azul lido). */
function Tique({ status }: { status: string | null }) {
  const cinza = '#8a8a8a'
  const azul = '#34B7F1'
  if (status === 'read') return <CheckCheck size={14} style={{ color: azul }} />
  if (status === 'delivered') return <CheckCheck size={14} style={{ color: cinza }} />
  if (status === 'sent') return <Check size={14} style={{ color: cinza }} />
  if (status === 'failed') return <AlertCircle size={13} style={{ color: '#DC2626' }} />
  return <Clock size={12} style={{ color: cinza }} />
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
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const conteudo = texto.trim()
    if (!conteudo) return
    setEnviando(true)
    setErro(null)

    try {
      const res = await fetch('/api/mensagens/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversa_id: conversaId, conteudo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao enviar')

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
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#ECE5DD',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {mensagens.length === 0 && (
          <div style={{ textAlign: 'center', color: '#7c7c7c', fontSize: 13, margin: 'auto' }}>
            Sem mensagens ainda.
          </div>
        )}
        {mensagens.map((m) => {
          const meu = m.quem === 'COLABORADOR'
          return (
            <div
              key={m.id}
              style={{
                alignSelf: meu ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: meu ? '#DCF8C6' : '#FFFFFF',
                borderRadius: 10,
                padding: '8px 12px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
              }}
            >
              {meu && m.enviado_por_nome && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1A3C5A', marginBottom: 2 }}>
                  {m.enviado_por_nome}
                </div>
              )}
              <div style={{ fontSize: 14, color: '#111', whiteSpace: 'pre-wrap' }}>{m.conteudo}</div>
              <div style={{ fontSize: 10.5, color: '#8a8a8a', textAlign: 'right', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                {formatarDataHora(m.created_at)}
                {meu && <Tique status={m.external_status} />}
              </div>
            </div>
          )
        })}
        <div ref={fimRef} />
      </div>

      {erro && (
        <div style={{ color: '#DC2626', fontSize: 12.5, marginTop: 6 }}>{erro}</div>
      )}

      {/* Envio */}
      <form onSubmit={enviar} style={{ display: 'flex', gap: 8, marginTop: 10, paddingBottom: 12 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma resposta..."
          style={{
            flex: 1,
            height: 46,
            padding: '0 16px',
            borderRadius: 999,
            border: '1px solid #DCE6EF',
            outline: 'none',
            fontSize: 14,
            background: '#fff',
          }}
        />
        <button
          type="submit"
          disabled={enviando}
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: 'none',
            background: '#16A34A',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: enviando ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}
