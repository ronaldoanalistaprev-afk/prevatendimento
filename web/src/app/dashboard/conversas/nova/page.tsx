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
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const digitos = telefone.replace(/\D/g, '')
  const telefoneValido = digitos.length === 11 && digitos[2] === '9'

  async function iniciar(e: React.FormEvent) {
    e.preventDefault()
    if (!telefoneValido) { setErro('Telefone inválido. Informe DDD + celular (11 dígitos), começando com 9. Ex.: (75) 99999-9999.'); return }
    setEnviando(true); setErro(null)
    try {
      const res = await fetch('/api/conversas/iniciar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: `55${digitos}`, nome, conteudo }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao iniciar conversa')
      router.push(`/dashboard/conversas/${data.conversa_id}`)
    } catch (err) {
      setErro((err as Error).message); setEnviando(false)
    }
  }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 560 }}>
      <Link href="/dashboard/conversas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Conversas</Link>

      <h1 className="titulo" style={{ marginTop: 14 }}>Nova conversa</h1>
      <p className="subtitulo" style={{ marginBottom: 24 }}>Inicie um atendimento enviando a primeira mensagem por WhatsApp. Se a pessoa já existir, a conversa é reaproveitada.</p>

      <form onSubmit={iniciar} className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <span className="rotulo">WhatsApp (DDD + número)</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="trancado" style={{ width: 'auto', fontWeight: 700, whiteSpace: 'nowrap' }} title="Brasil">+55</div>
            <input className="entrada" aria-invalid={Boolean(telefone && !telefoneValido)} inputMode="numeric" placeholder="(75) 99999-9999" value={telefone} onChange={(e) => setTelefone(mascara(e.target.value))} required />
          </div>
          <span className="ajuda">Informe só o DDD e o número — o +55 já está incluído. O sistema confere no WhatsApp se o número existe antes de enviar.</span>
        </div>

        <label className="campo">
          <span className="rotulo">Nome <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span>
          <input className="entrada" placeholder="Nome da pessoa" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label className="campo">
          <span className="rotulo">Primeira mensagem</span>
          <textarea className="entrada" style={{ minHeight: 110, resize: 'vertical' }} placeholder="Escreva a mensagem que será enviada…" value={conteudo} onChange={(e) => setConteudo(e.target.value)} required />
        </label>

        {erro && <div className="aviso aviso-perigo">{erro}</div>}

        <button type="submit" disabled={enviando || !telefoneValido || !conteudo.trim()} className="botao botao-principal" style={{ minHeight: 48 }}>
          {enviando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Send className="icone icone-p" aria-hidden="true" focusable="false" />} {enviando ? 'Enviando…' : 'Enviar e abrir conversa'}
        </button>
      </form>
    </main>
  )
}
