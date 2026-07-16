'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power, Lock } from 'lucide-react'

export interface PapelItem {
  codigo: string
  nome: string
  descricao: string | null
  sistema: boolean
  pode_ver_tudo: boolean
  pode_cobrar: boolean
  ativo: boolean
  /** Quantos logins usam este papel (para avisar antes de excluir). */
  emUso: number
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid #DCE6EF', outline: 'none',
  fontSize: 14, background: '#fff', width: '100%',
}
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
  borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280',
}

/** CRUD dos papéis (cargos). Só o Administrador. */
export default function GerenciarPapeis({ papeis }: { papeis: PapelItem[] }) {
  const router = useRouter()
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [verTudo, setVerTudo] = useState(false)
  const [cobrar, setCobrar] = useState(false)

  function limpar() {
    setNome('')
    setDescricao('')
    setVerTudo(false)
    setCobrar(false)
    setErro(null)
  }
  function abrirNovo() {
    limpar()
    setEditando(null)
    setCriando(true)
  }
  function abrirEdicao(p: PapelItem) {
    setErro(null)
    setCriando(false)
    setEditando(p.codigo)
    setNome(p.nome)
    setDescricao(p.descricao ?? '')
    setVerTudo(p.pode_ver_tudo)
    setCobrar(p.pode_cobrar)
  }

  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, codigo?: string) {
    setOcupado(codigo ?? 'novo')
    setErro(null)
    try {
      const res =
        metodo === 'DELETE'
          ? await fetch(`/api/papeis?codigo=${encodeURIComponent(codigo ?? '')}`, { method: 'DELETE' })
          : await fetch('/api/papeis', {
              method: metodo,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(corpo),
            })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar.')
      setCriando(false)
      setEditando(null)
      limpar()
      router.refresh()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const corpo = { nome, descricao, pode_ver_tudo: verTudo, pode_cobrar: cobrar }
    if (editando) chamar('PATCH', { ...corpo, codigo: editando }, editando)
    else chamar('POST', corpo)
  }

  function excluir(p: PapelItem) {
    if (p.emUso > 0) {
      alert(`${p.emUso} login(s) usam o papel "${p.nome}". Troque o papel dessas pessoas antes de excluir.`)
      return
    }
    if (confirm(`Excluir o papel "${p.nome}"? Isso não pode ser desfeito.`)) chamar('DELETE', undefined, p.codigo)
  }

  const editandoAdmin = editando === 'ADMIN'

  const formulario = (
    <form onSubmit={salvar} style={{ background: '#fff', border: '1px solid #DCE6EF', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14 }}>{editando ? 'Editar papel' : 'Novo papel'}</div>
      <label style={{ fontSize: 12.5, color: '#6B7280' }}>
        Nome do papel
        <input style={{ ...inputStyle, marginTop: 4 }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Estagiário" required />
      </label>
      <label style={{ fontSize: 12.5, color: '#6B7280' }}>
        Para que serve (opcional)
        <input style={{ ...inputStyle, marginTop: 4 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Uma frase explicando o cargo" />
      </label>

      <div style={{ fontSize: 12.5, color: '#6B7280' }}>
        O que este papel pode fazer:
        {editandoAdmin && (
          <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>
            O Administrador sempre pode tudo — esses poderes não podem ser tirados dele.
          </div>
        )}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, cursor: editandoAdmin ? 'not-allowed' : 'pointer' }}>
          <input type="checkbox" checked={verTudo || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setVerTudo(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#16A34A' }} />
          <span>
            <b style={{ color: '#1A3C5A' }}>Ver as conversas de todos</b>
            <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>Desmarcado, a pessoa só vê as conversas em que ela é a atendente.</div>
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, cursor: editandoAdmin ? 'not-allowed' : 'pointer' }}>
          <input type="checkbox" checked={cobrar || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setCobrar(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#16A34A' }} />
          <span>
            <b style={{ color: '#1A3C5A' }}>Cobrar os atendentes</b>
            <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>Criar, editar, cancelar e excluir cobranças — e mexer nos modelos de cobrança.</div>
          </span>
        </label>
      </div>

      {erro && <div style={{ fontSize: 13, color: '#B91C1C' }}>{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={ocupado !== null} style={{ ...btnBase, height: 40, background: 'linear-gradient(135deg, #1A3C5A, #16A34A)', color: '#fff', border: 'none' }}>
          {ocupado !== null ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar
        </button>
        <button type="button" onClick={() => { setCriando(false); setEditando(null); limpar() }} style={{ ...btnBase, height: 40 }}>
          Cancelar
        </button>
      </div>
    </form>
  )

  return (
    <div>
      {!criando && !editando && (
        <button onClick={abrirNovo} style={{ ...btnBase, height: 40, background: 'linear-gradient(135deg, #1A3C5A, #16A34A)', color: '#fff', border: 'none', marginBottom: 14 }}>
          <Plus size={16} /> Novo papel
        </button>
      )}

      {(criando || editando) && formulario}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {papeis.map((p) => (
          <div
            key={p.codigo}
            style={{
              background: '#fff', borderRadius: 14, border: '1px solid #EEF2F7',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '14px 16px',
              borderLeft: p.ativo ? '4px solid #16A34A' : '4px solid #CBD5E1',
              opacity: p.ativo ? 1 : 0.7,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14.5 }}>{p.nome}</span>
                  {p.sistema && (
                    <span title="Papel de fábrica: pode editar o nome, mas não excluir" style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={10} /> de fábrica
                    </span>
                  )}
                  {!p.ativo && (
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: '#F1F5F9', color: '#64748B' }}>desativado</span>
                  )}
                  <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{p.emUso} {p.emUso === 1 ? 'login' : 'logins'}</span>
                </div>
                {p.descricao && <div style={{ fontSize: 13, color: '#374151', marginTop: 5 }}>{p.descricao}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <Poder ligado={p.pode_ver_tudo} texto={p.pode_ver_tudo ? 'Vê as conversas de todos' : 'Vê só as próprias conversas'} />
                  <Poder ligado={p.pode_cobrar} texto={p.pode_cobrar ? 'Pode cobrar' : 'Não cobra'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => abrirEdicao(p)} style={btnBase} title="Mudar nome, descrição e poderes">
                  <Pencil size={14} /> Editar
                </button>
                {p.codigo !== 'ADMIN' && (
                  <button
                    onClick={() => chamar('PATCH', { codigo: p.codigo, ativo: !p.ativo }, p.codigo)}
                    disabled={ocupado !== null}
                    style={{ ...btnBase, color: p.ativo ? '#B45309' : '#15803D' }}
                    title={p.ativo ? 'Quem tiver este papel perde o acesso até reativar' : 'Volta a valer'}
                  >
                    {ocupado === p.codigo ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
                {!p.sistema && (
                  <button onClick={() => excluir(p)} disabled={ocupado !== null} style={{ ...btnBase, color: '#B91C1C', borderColor: '#FECACA' }} title="Excluir de vez">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {erro && !criando && !editando && <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 10 }}>{erro}</div>}
    </div>
  )
}

function Poder({ ligado, texto }: { ligado: boolean; texto: string }) {
  return (
    <span
      style={{
        fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '4px 10px',
        background: ligado ? '#DCFCE7' : '#F1F5F9',
        color: ligado ? '#15803D' : '#64748B',
      }}
    >
      {texto}
    </span>
  )
}
