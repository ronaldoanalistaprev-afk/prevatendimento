'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, Copy, Check, Trash2, Loader2 } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
import { formatarNome } from '@/lib/utils'

/** Preparar um novo lote: registra os N mais antigos que esperam. */
export function PrepararLote({ padrao = 40 }: { padrao?: number }) {
  const router = useRouter()
  const [qtd, setQtd] = useState(padrao)
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function preparar() {
    setCarregando(true); setMsg(null)
    try {
      const r = await fetch('/api/marco-zero', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'preparar', quantidade: qtd }) })
      const j = await r.json()
      if (!r.ok) setMsg(j.erro ?? 'Não foi possível preparar o lote.')
      else if (j.inseridos === 0) setMsg('Não há mais conversas em espera para incluir num lote.')
      else { setMsg(`Lote ${j.lote} preparado com ${j.inseridos} pessoa(s). Copie a lista abaixo para o disparo.`); router.refresh() }
    } catch { setMsg('Falha de conexão.') } finally { setCarregando(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label className="rotulo" htmlFor="mz-qtd">Quantas conversas neste lote?</label>
        <input id="mz-qtd" className="entrada" type="number" inputMode="numeric" min={1} max={500} value={qtd} onChange={(e) => setQtd(Number(e.target.value))} style={{ width: 90, minHeight: 36 }} />
        <button onClick={preparar} disabled={carregando} className="botao botao-principal">
          {carregando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Rocket className="icone icone-p" aria-hidden="true" focusable="false" />} Preparar lote
        </button>
      </div>
      {msg && <div style={{ fontSize: 13.5, color: msg.startsWith('Lote') ? 'var(--sucesso)' : 'var(--atencao)', fontWeight: 600 }}>{msg}</div>}
    </div>
  )
}

/** Copia a lista de telefones+nomes do lote (para colar no disparo). */
export function CopiarLista({ linhas, quantos }: { linhas: string; quantos: number }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try { await navigator.clipboard.writeText(linhas); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch { /* clipboard indisponível */ }
  }
  return (
    <button onClick={copiar} className={`botao ${copiado ? 'botao-acao' : 'botao-secundario'}`}>
      {copiado ? <Check className="icone icone-p" aria-hidden="true" focusable="false" /> : <Copy className="icone icone-p" aria-hidden="true" focusable="false" />} {copiado ? 'Copiado!' : `Copiar lista (${quantos})`}
    </button>
  )
}

/** Remove UMA pessoa do lote (tira um contato indevido, sem desfazer o lote). */
export function RemoverPessoa({ id, nome }: { id: string; nome?: string | null }) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const [carregando, setCarregando] = useState(false)
  async function remover() {
    const quem = nome ? formatarNome(nome) : 'Esta pessoa'
    if (!(await confirmar({ titulo: 'Remover do lote', mensagem: `${quem} sai deste lote e não vai receber a mensagem agora. Volta a ficar disponível para um lote futuro.`, confirmar: 'Remover do lote', perigo: true }))) return
    setCarregando(true)
    try { const r = await fetch(`/api/marco-zero?id=${id}`, { method: 'DELETE' }); if (r.ok) router.refresh() } finally { setCarregando(false) }
  }
  return (
    <>
      {modal}
      <button onClick={remover} disabled={carregando} className="botao botao-perigo" title="Remover esta pessoa do lote" style={{ minHeight: 30, fontSize: 12.5 }}>
        <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /> Remover
      </button>
    </>
  )
}

/** Desfaz um lote inteiro (corrigir antes do disparo). */
export function DesfazerLote({ lote }: { lote: number }) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const [carregando, setCarregando] = useState(false)
  async function desfazer() {
    if (!(await confirmar({ titulo: `Desfazer o lote ${lote}`, mensagem: `As pessoas deste lote voltam a ficar disponíveis para um novo lote. Use isto só antes do disparo.`, confirmar: 'Desfazer o lote', perigo: true }))) return
    setCarregando(true)
    try { const r = await fetch(`/api/marco-zero?lote=${lote}`, { method: 'DELETE' }); if (r.ok) router.refresh() } finally { setCarregando(false) }
  }
  return (
    <>
      {modal}
      <button onClick={desfazer} disabled={carregando} className="botao botao-perigo" title={`Desfazer o lote ${lote}`} style={{ minHeight: 32, fontSize: 12.5 }}>
        <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /> Desfazer
      </button>
    </>
  )
}
