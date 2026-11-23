'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'

const COMANDO = `copy(JSON.parse(localStorage['ngStorage-token']))`

/**
 * Formulário de administrador para colar um token novo do Multi360 e validar na hora.
 * Nunca mostra o token atual. Fala a língua do Ronaldo (não é técnico).
 */
export default function IntegracaoMulti360() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'atencao' | 'perigo'; texto: string } | null>(null)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (token.trim().length < 20 || salvando) return
    setSalvando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/integracao/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const j = await res.json()
      if (!res.ok) {
        setMsg({ tipo: 'perigo', texto: j?.erro ?? 'Não foi possível salvar o token.' })
      } else if (j.tokenValido === true) {
        setToken('')
        setMsg({ tipo: 'sucesso', texto: 'Token aceito. A sincronização na nuvem já está lendo o Multi360 — os números se atualizam nos próximos minutos, sozinhos.' })
        router.refresh()
      } else if (j.tokenValido === false) {
        setMsg({ tipo: 'perigo', texto: 'O Multi360 recusou este token (venceu ou é de outra conta). Pegue um token novo pelo passo a passo abaixo e cole de novo.' })
        router.refresh()
      } else {
        setToken('')
        setMsg({ tipo: 'atencao', texto: 'Token salvo, mas não deu para conferir agora. Veja o estado acima daqui a pouco; se continuar "vencido", cole de novo.' })
        router.refresh()
      }
    } catch {
      setMsg({ tipo: 'perigo', texto: 'Falha de conexão ao salvar o token. Tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  async function sincronizarAgora() {
    if (sincronizando) return
    setSincronizando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/integracao/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'sincronizar' }),
      })
      const j = await res.json()
      if (res.ok && j.iniciado) {
        setMsg({ tipo: 'sucesso', texto: 'Sincronização iniciada. Ela roda em segundo plano e pode levar alguns minutos; o "última atualização" acima vai avançar quando terminar.' })
        router.refresh()
      } else {
        setMsg({ tipo: 'perigo', texto: j?.erro ?? 'Não foi possível iniciar a sincronização agora.' })
      }
    } catch {
      setMsg({ tipo: 'perigo', texto: 'Falha de conexão ao iniciar a sincronização.' })
    } finally {
      setSincronizando(false)
    }
  }

  async function copiarComando() {
    try {
      await navigator.clipboard.writeText(COMANDO)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sem área de transferência: a pessoa copia na mão */ }
  }

  return (
    <div>
      {msg && (
        <div className={`aviso aviso-${msg.tipo}`} role={msg.tipo === 'perigo' ? 'alert' : 'status'} style={{ marginBottom: 16 }}>
          {msg.tipo === 'sucesso'
            ? <CheckCircle2 className="icone" aria-hidden="true" focusable="false" />
            : <AlertCircle className="icone" aria-hidden="true" focusable="false" />}
          <div>{msg.texto}</div>
        </div>
      )}

      <form onSubmit={salvar} onKeyDown={tecladoFormulario}>
        <div className="campo">
          <label className="rotulo" htmlFor="token-multi360">
            Cole aqui o token novo <span className="obrig" aria-hidden="true">*</span>
          </label>
          <textarea
            id="token-multi360"
            className="entrada"
            rows={4}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="O token é um texto bem longo que começa com Bearer ou com eyJ…"
            spellCheck={false}
            autoComplete="off"
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, resize: 'vertical' }}
          />
          <p className="texto-apoio" style={{ marginTop: 6 }}>
            Por segurança, o sistema nunca mostra o token guardado — só troca por um novo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button type="submit" className="botao botao-principal" disabled={salvando || token.trim().length < 20}>
            {salvando ? 'Salvando e conferindo…' : 'Salvar e conferir o token'}
          </button>
          <button type="button" className="botao botao-secundario" onClick={sincronizarAgora} disabled={sincronizando}>
            <RefreshCw className="icone icone-p" aria-hidden="true" focusable="false" />
            {sincronizando ? 'Iniciando…' : 'Sincronizar agora'}
          </button>
        </div>
      </form>

      <section className="cartao" style={{ marginTop: 20 }}>
        <div className="cartao-corpo">
          <h2 className="sub-titulo" style={{ marginBottom: 8 }}>Como pegar o token novo (passo a passo)</h2>
          <ol className="texto-apoio" style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Abra o Multi360 no navegador e entre na sua conta (faça o login normal).</li>
            <li>Aperte a tecla <b>F12</b> para abrir o painel do desenvolvedor e clique na aba <b>Console</b>.</li>
            <li>Cole o comando abaixo e aperte Enter — ele copia o token para a área de transferência:</li>
          </ol>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
            <code style={{ background: 'var(--fundo-2, #f3f3f3)', padding: '8px 10px', borderRadius: 8, fontSize: 13, overflowWrap: 'anywhere', flex: '1 1 260px' }}>{COMANDO}</code>
            <button type="button" className="botao botao-secundario" onClick={copiarComando}>
              {copiado ? <Check className="icone icone-p" aria-hidden="true" focusable="false" /> : <Copy className="icone icone-p" aria-hidden="true" focusable="false" />}
              {copiado ? 'Copiado' : 'Copiar comando'}
            </button>
          </div>
          <ol className="texto-apoio" start={4} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Volte aqui, cole no campo acima (Ctrl+V) e clique em <b>Salvar e conferir o token</b>.</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
