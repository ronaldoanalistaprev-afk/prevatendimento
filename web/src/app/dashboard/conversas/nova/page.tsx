'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'
import { useConfirmacao } from '@/components/Confirmacao'

/** Máscara (DD) 9XXXX-XXXX a partir dos dígitos (sem o +55). */
function mascara(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Erro do telefone, dito junto do campo enquanto a pessoa digita (Regras 10, 18 e 19). */
function erroTelefone(digitos: string): string | null {
  if (!digitos) return 'Informe o WhatsApp com DDD.'
  if (digitos.length < 11) return `Faltam ${11 - digitos.length} ${11 - digitos.length === 1 ? 'dígito' : 'dígitos'}: informe DDD + celular (11 dígitos). Ex.: (75) 99999-9999.`
  if (digitos[2] !== '9') return 'Celular começa com 9 depois do DDD. Ex.: (75) 99999-9999.'
  return null
}

export default function NovaConversaPage() {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tocado, setTocado] = useState({ telefone: false, conteudo: false })

  const digitos = telefone.replace(/\D/g, '')
  const errTel = erroTelefone(digitos)
  const errMsg = conteudo.trim() ? null : 'Escreva a primeira mensagem.'
  const mostrarTel = tocado.telefone || digitos.length >= 11 ? errTel : null
  const mostrarMsg = tocado.conteudo ? errMsg : null
  const temAlgo = Boolean(digitos || nome.trim() || conteudo.trim())
  async function sair(e: React.MouseEvent) {
    if (!temAlgo) return
    e.preventDefault()
    if (await confirmar({ titulo: 'Sair sem iniciar a conversa?', mensagem: 'O que você digitou nesta tela será perdido.', confirmar: 'Sair sem salvar', cancelar: 'Continuar aqui' })) router.push('/dashboard/conversas')
  }
  const falta = [errTel ? 'o WhatsApp completo' : null, errMsg ? 'a primeira mensagem' : null].filter(Boolean) as string[]

  async function iniciar(e: React.FormEvent) {
    e.preventDefault()
    setTocado({ telefone: true, conteudo: true })
    if (errTel) { document.getElementById('nova-telefone')?.focus(); return }
    if (errMsg) { document.getElementById('nova-mensagem')?.focus(); return }
    setEnviando(true); setErro(null)
    try {
      const res = await fetch('/api/conversas/iniciar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: `55${digitos}`, nome, conteudo }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível iniciar a conversa. Tente de novo.')
      router.push(`/dashboard/conversas/${data.conversa_id}`)
    } catch (err) {
      setErro((err as Error).message); setEnviando(false)
    }
  }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 560 }}>
      {modal}
      <Link href="/dashboard/conversas" className="voltar" onClick={sair}><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Laboratório WhatsApp</Link>

      <h1 className="titulo" style={{ marginTop: 14 }}>Nova conversa</h1>
      <p className="subtitulo" style={{ marginBottom: 24 }}>Inicie um atendimento enviando a primeira mensagem por WhatsApp. Se a pessoa já existir, a conversa é reaproveitada.</p>

      <form onSubmit={iniciar} onKeyDown={tecladoFormulario} noValidate className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <label className="rotulo" htmlFor="nova-telefone">WhatsApp (DDD + número) <span className="obrig" aria-hidden="true">*</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="trancado" style={{ width: 'auto', fontWeight: 700, whiteSpace: 'nowrap' }} title="Brasil" aria-hidden="true">+55</div>
            <input
              id="nova-telefone"
              className="entrada"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(75) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(mascara(e.target.value))}
              onBlur={() => setTocado((t) => ({ ...t, telefone: true }))}
              aria-required="true"
              aria-invalid={Boolean(mostrarTel)}
              aria-describedby={mostrarTel ? 'nova-telefone-erro' : 'nova-telefone-ajuda'}
            />
          </div>
          {mostrarTel
            ? <span className="erro-campo" id="nova-telefone-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrarTel}</span>
            : <span className="ajuda" id="nova-telefone-ajuda">Informe só o DDD e o número: o +55 já está incluído. O sistema confere no WhatsApp se o número existe antes de enviar.</span>}
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor="nova-nome">Nome <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></label>
          <input id="nova-nome" className="entrada" placeholder="Nome da pessoa" autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor="nova-mensagem">Primeira mensagem <span className="obrig" aria-hidden="true">*</span></label>
          <textarea
            id="nova-mensagem"
            className="entrada"
            style={{ minHeight: 110 }}
            placeholder="Escreva a mensagem que será enviada…"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            onBlur={() => setTocado((t) => ({ ...t, conteudo: true }))}
            aria-required="true"
            aria-invalid={Boolean(mostrarMsg)}
            aria-describedby={mostrarMsg ? 'nova-mensagem-erro' : undefined}
          />
          {mostrarMsg && <span className="erro-campo" id="nova-mensagem-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrarMsg}</span>}
        </div>

        {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}

        <div style={{ display: 'grid', gap: 6 }}>
          <button type="submit" disabled={enviando} className="botao botao-principal" style={{ minHeight: 48 }} aria-describedby={falta.length ? 'nova-falta' : undefined}>
            {enviando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Send className="icone icone-p" aria-hidden="true" focusable="false" />} {enviando ? 'Enviando…' : 'Enviar e abrir conversa'}
          </button>
          {/* O botão diz o que falta, em vez de ficar desligado sem explicação (auditoria W3; Regra 50). */}
          {falta.length > 0 && !enviando && <p id="nova-falta" className="ajuda">Para enviar, falta preencher {falta.join(' e ')}.</p>}
        </div>
      </form>
    </main>
  )
}
