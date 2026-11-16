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
    setCarregando(true)
    setMsg(null)
    try {
      const r = await fetch('/api/marco-zero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'preparar', quantidade: qtd }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMsg(j.erro ?? 'Não foi possível preparar o lote.')
      } else if (j.inseridos === 0) {
        setMsg('Não há mais conversas em espera para incluir num lote.')
      } else {
        setMsg(`Lote ${j.lote} preparado com ${j.inseridos} pessoa(s). Copie a lista abaixo para o disparo.`)
        router.refresh()
      }
    } catch {
      setMsg('Falha de conexão.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Quantas conversas neste lote?</label>
        <input
          type="number"
          min={1}
          max={500}
          value={qtd}
          onChange={(e) => setQtd(Number(e.target.value))}
          style={{ width: 80, height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #DCE6EF', fontSize: 14 }}
        />
        <button
          onClick={preparar}
          disabled={carregando}
          style={{
            height: 36, padding: '0 16px', borderRadius: 999, border: 'none',
            background: carregando ? '#94A3B8' : '#1A3C5A', color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: carregando ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
          }}
        >
          {carregando ? <Loader2 size={15} className="spin" /> : <Rocket size={15} />}
          Preparar lote
        </button>
      </div>
      {msg && <div style={{ fontSize: 13, color: msg.startsWith('Lote') ? '#15803D' : '#B45309', fontWeight: 600 }}>{msg}</div>}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/** Copia a lista de telefones+nomes do lote (para colar no disparo). */
export function CopiarLista({ linhas, quantos }: { linhas: string; quantos: number }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(linhas)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      /* clipboard indisponível */
    }
  }
  return (
    <button
      onClick={copiar}
      style={{
        height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid #DCE6EF',
        background: copiado ? '#DCFCE7' : '#fff', color: copiado ? '#15803D' : '#1A3C5A',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
      }}
    >
      {copiado ? <Check size={15} /> : <Copy size={15} />}
      {copiado ? 'Copiado!' : `Copiar lista (${quantos})`}
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
    if (!(await confirmar({
      titulo: 'Remover do lote',
      mensagem: `${quem} sai deste lote e não vai receber a mensagem agora. Volta a ficar disponível para um lote futuro.`,
      confirmar: 'Remover do lote',
      perigo: true,
    }))) return
    setCarregando(true)
    try {
      const r = await fetch(`/api/marco-zero?id=${id}`, { method: 'DELETE' })
      if (r.ok) router.refresh()
    } finally {
      setCarregando(false)
    }
  }
  return (
    <>
      {modal}
      <button
        onClick={remover}
        disabled={carregando}
        title="Remover esta pessoa do lote"
        style={{
          height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #FECACA',
          background: '#fff', color: '#B4232A', fontSize: 12, fontWeight: 700,
          cursor: carregando ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        }}
      >
        <Trash2 size={13} /> Remover
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
    if (!(await confirmar({
      titulo: `Desfazer o lote ${lote}`,
      mensagem: `As pessoas deste lote voltam a ficar disponíveis para um novo lote. Use isto só antes do disparo.`,
      confirmar: 'Desfazer o lote',
      perigo: true,
    }))) return
    setCarregando(true)
    try {
      const r = await fetch(`/api/marco-zero?lote=${lote}`, { method: 'DELETE' })
      if (r.ok) router.refresh()
    } finally {
      setCarregando(false)
    }
  }
  return (
    <>
      {modal}
      <button
        onClick={desfazer}
        disabled={carregando}
        title={`Desfazer o lote ${lote}`}
        style={{
          height: 34, padding: '0 12px', borderRadius: 999, border: '1px solid #FECACA',
          background: '#fff', color: '#B4232A', fontSize: 12.5, fontWeight: 700,
          cursor: carregando ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        <Trash2 size={14} /> Desfazer
      </button>
    </>
  )
}
