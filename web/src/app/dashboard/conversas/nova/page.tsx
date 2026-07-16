'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'

/** Máscara (DD) 9XXXX-XXXX a partir dos dígitos (sem o +55). */
function mascara(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function NovaConversaPage() {
  const router = useRouter()
  const [telefone, setTelefone] = useState('') // mascarado
  const [nome, setNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const digitos = telefone.replace(/\D/g, '')
  const telefoneValido = digitos.length === 11 && digitos[2] === '9'

  async function iniciar(e: React.FormEvent) {
    e.preventDefault()
    if (!telefoneValido) {
      setErro('Telefone inválido. Informe DDD + celular (11 dígitos), começando com 9. Ex.: (75) 99999-9999.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch('/api/conversas/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: `55${digitos}`, nome, conteudo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao iniciar conversa')
      router.push(`/dashboard/conversas/${data.conversa_id}`)
    } catch (err) {
      setErro((err as Error).message)
      setEnviando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 46,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid #DCE6EF',
    outline: 'none',
    fontSize: 14,
    background: '#fff',
    width: '100%',
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 560, margin: '0 auto' }}>
      <Link href="/dashboard/conversas" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Conversas
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', marginTop: 14 }}>Nova conversa</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 }}>
        Inicie um atendimento enviando a primeira mensagem por WhatsApp. Se a pessoa já existir, a
        conversa é reaproveitada.
      </p>

      <form
        onSubmit={iniciar}
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #EEF2F7',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A3C5A' }}>WhatsApp (DDD + número)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                height: 46,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid #DCE6EF',
                background: '#F8FAFC',
                color: '#1A3C5A',
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
              title="Brasil"
            >
              🇧🇷 +55
            </div>
            <input
              style={{
                ...inputStyle,
                borderColor: telefone && !telefoneValido ? '#FCA5A5' : '#DCE6EF',
              }}
              inputMode="numeric"
              placeholder="(75) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(mascara(e.target.value))}
              required
            />
          </div>
          <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>
            Informe só o DDD e o número — o +55 já está incluído. O sistema confere no WhatsApp se o
            número existe antes de enviar.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A3C5A' }}>Nome (opcional)</label>
          <input
            style={inputStyle}
            placeholder="Nome da pessoa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A3C5A' }}>Primeira mensagem</label>
          <textarea
            style={{ ...inputStyle, height: 110, padding: '12px 16px', resize: 'vertical' }}
            placeholder="Escreva a mensagem que será enviada..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            required
          />
        </div>

        {erro && (
          <div
            style={{
              fontSize: 13,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#FEF2F2',
              color: '#B91C1C',
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || !telefoneValido || !conteudo.trim()}
          style={{
            height: 48,
            borderRadius: 12,
            border: 'none',
            background: enviando || !telefoneValido || !conteudo.trim() ? '#9CA3AF' : 'linear-gradient(135deg, #1A3C5A, #16A34A)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14.5,
            cursor: enviando || !telefoneValido || !conteudo.trim() ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {enviando ? 'Enviando...' : 'Enviar e abrir conversa'}
        </button>
      </form>
    </div>
  )
}
