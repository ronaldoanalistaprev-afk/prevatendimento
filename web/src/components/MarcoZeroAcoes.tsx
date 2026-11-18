'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, Copy, Check, Trash2, Loader2, AlertCircle, Info } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'
import { formatarNome } from '@/lib/utils'
import { tecladoFormulario } from '@/lib/formulario'

const pessoas = (n: number) => (n === 1 ? '1 pessoa' : `${n.toLocaleString('pt-BR')} pessoas`)

function validarQtd(q: number): string | null {
  if (!Number.isFinite(q) || !Number.isInteger(q)) return 'Informe um número inteiro.'
  if (q < 1) return 'O lote precisa ter pelo menos 1 conversa.'
  if (q > 500) return 'O lote pode ter no máximo 500 conversas.'
  return null
}

/** Preparar um novo lote: registra os N mais antigos que esperam. */
export function PrepararLote({ padrao = 40 }: { padrao?: number }) {
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const id = useId()
  const [qtd, setQtd] = useState(String(padrao))
  const [erroQtd, setErroQtd] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'neutro' | 'perigo'; texto: string } | null>(null)

  async function preparar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const n = Number(qtd)
    const erroN = validarQtd(n)
    setErroQtd(erroN)
    if (erroN) return
    setCarregando(true); setMsg(null)
    try {
      const r = await fetch('/api/marco-zero', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'preparar', quantidade: n }) })
      const j = await r.json().catch(() => ({})) as { lote?: number; inseridos?: number; erro?: string }
      if (!r.ok) {
        setMsg({ tipo: 'perigo', texto: r.status === 403 ? 'O seu papel não permite preparar lotes. Fale com o administrador.' : 'Não foi possível preparar o lote. Tente de novo em alguns instantes.' })
      } else if (!j.inseridos) {
        setMsg({ tipo: 'neutro', texto: 'Não há mais conversas em espera para incluir num lote.' })
      } else {
        const lote = j.lote
        router.refresh()
        avisar({
          texto: `Lote ${lote} preparado com ${pessoas(j.inseridos)}. Copie a lista abaixo para o disparo.`,
          // O lote acabou de ser criado e ninguém respondeu ainda: desfazer apaga o lote inteiro.
          desfazer: lote ? async () => {
            const d = await fetch(`/api/marco-zero?lote=${lote}`, { method: 'DELETE' }).catch(() => null)
            router.refresh()
            if (!d?.ok) setTimeout(() => avisar({ texto: `Não foi possível desfazer. Use “Desfazer” na linha do lote ${lote}.`, erro: true }), 300)
          } : undefined,
        })
      }
    } catch {
      setMsg({ tipo: 'perigo', texto: 'Sem conexão com o servidor. Confira a internet e tente de novo.' })
    } finally { setCarregando(false) }
  }

  const idQtd = `${id}-qtd`
  return (
    <form onSubmit={preparar} onKeyDown={tecladoFormulario} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div className="campo">
          <label className="rotulo" htmlFor={idQtd}>Quantas conversas neste lote?</label>
          <input
            id={idQtd}
            className="entrada"
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={qtd}
            aria-invalid={erroQtd ? true : undefined}
            aria-describedby={erroQtd ? `${idQtd}-erro` : `${idQtd}-ajuda`}
            onChange={(e) => { setQtd(e.target.value); if (erroQtd) setErroQtd(validarQtd(Number(e.target.value))) }}
            onBlur={(e) => setErroQtd(validarQtd(Number(e.target.value)))}
            style={{ width: 120 }}
          />
        </div>
        <button type="submit" disabled={carregando} className="botao botao-principal">
          {carregando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Rocket className="icone icone-p" aria-hidden="true" focusable="false" />}
          {carregando ? 'Preparando…' : 'Preparar lote'}
        </button>
      </div>
      {erroQtd
        ? <div className="erro-campo" id={`${idQtd}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroQtd}</div>
        : <div className="ajuda" id={`${idQtd}-ajuda`}>De 1 a 500 conversas.</div>}
      {msg && (
        <div className={`aviso ${msg.tipo === 'perigo' ? 'aviso-perigo' : 'aviso-neutro'}`} role={msg.tipo === 'perigo' ? 'alert' : 'status'}>
          {msg.tipo === 'perigo' ? <AlertCircle className="icone" aria-hidden="true" focusable="false" /> : <Info className="icone" aria-hidden="true" focusable="false" />}
          <span>{msg.texto}</span>
        </div>
      )}
    </form>
  )
}

/** Copia a lista de telefones+nomes do lote (para colar no disparo). */
export function CopiarLista({ linhas, quantos }: { linhas: string; quantos: number }) {
  const [estado, setEstado] = useState<'pronto' | 'copiado' | 'falhou'>('pronto')
  async function copiar() {
    try {
      await navigator.clipboard.writeText(linhas)
      setEstado('copiado'); setTimeout(() => setEstado('pronto'), 2500)
    } catch {
      setEstado('falhou')
    }
  }
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button type="button" onClick={copiar} className={`botao ${estado === 'copiado' ? 'botao-acao' : 'botao-secundario'}`}>
        {estado === 'copiado' ? <Check className="icone icone-p" aria-hidden="true" focusable="false" /> : <Copy className="icone icone-p" aria-hidden="true" focusable="false" />}
        {estado === 'copiado' ? 'Lista copiada' : `Copiar lista (${quantos.toLocaleString('pt-BR')})`}
      </button>
      <span role="status" className={estado === 'falhou' ? 'erro-campo' : 'so-leitor'}>
        {estado === 'copiado' ? `Lista com ${pessoas(quantos)} copiada.` : estado === 'falhou' ? 'O navegador não deixou copiar. Selecione e copie a lista à mão.' : ''}
      </span>
    </span>
  )
}

/** Remove UMA pessoa do lote (tira um contato indevido, sem desfazer o lote). */
export function RemoverPessoa({ id, nome }: { id: string; nome?: string | null }) {
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const { confirmar, modal } = useConfirmacao()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const quem = nome ? formatarNome(nome) : 'Esta pessoa'
  async function remover() {
    if (!(await confirmar({ titulo: 'Remover do lote?', mensagem: `${quem} sai deste lote e não vai receber a mensagem agora. Volta a ficar disponível para um lote futuro.`, confirmar: 'Remover do lote', cancelar: 'Manter no lote', perigo: true }))) return
    setCarregando(true); setErro(null)
    try {
      const r = await fetch(`/api/marco-zero?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!r.ok) { setErro('Não foi possível remover. Tente de novo.'); return }
      router.refresh()
      avisar({ texto: `${quem} saiu do lote.` })
    } catch {
      setErro('Sem conexão com o servidor. Tente de novo.')
    } finally { setCarregando(false) }
  }
  return (
    <>
      {modal}
      <button type="button" onClick={remover} disabled={carregando} className="botao botao-perigo" title="Remover esta pessoa do lote">
        {carregando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" />}
        {carregando ? 'Removendo…' : 'Remover'}<span className="so-leitor"> {quem} do lote</span>
      </button>
      {erro && <span className="erro-campo" role="alert" style={{ flexBasis: '100%' }}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erro}</span>}
    </>
  )
}

/** Desfaz um lote inteiro (corrigir antes do disparo). */
export function DesfazerLote({ lote }: { lote: number }) {
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const { confirmar, modal } = useConfirmacao()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  async function desfazer() {
    if (!(await confirmar({ titulo: `Desfazer o lote ${lote}?`, mensagem: 'As pessoas deste lote voltam a ficar disponíveis para um novo lote. Use isto só antes do disparo; não tem volta.', confirmar: 'Desfazer o lote', cancelar: 'Manter o lote', perigo: true }))) return
    setCarregando(true); setErro(null)
    try {
      const r = await fetch(`/api/marco-zero?lote=${lote}`, { method: 'DELETE' })
      if (!r.ok) { setErro('Não foi possível desfazer o lote. Tente de novo.'); return }
      router.refresh()
      avisar({ texto: `Lote ${lote} desfeito. As pessoas voltaram a ficar disponíveis.` })
    } catch {
      setErro('Sem conexão com o servidor. Tente de novo.')
    } finally { setCarregando(false) }
  }
  return (
    <>
      {modal}
      <button type="button" onClick={desfazer} disabled={carregando} className="botao botao-perigo" title={`Desfazer o lote ${lote}`}>
        {carregando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" />}
        {carregando ? 'Desfazendo…' : 'Desfazer'}<span className="so-leitor"> o lote {lote}</span>
      </button>
      {erro && <span className="erro-campo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erro}</span>}
    </>
  )
}
