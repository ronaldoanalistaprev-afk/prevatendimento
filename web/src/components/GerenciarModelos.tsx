'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power } from 'lucide-react'

export interface ModeloItem {
  id: string
  titulo: string
  texto: string
  prazo_dias: number | null
  ativo: boolean
  vezes_usado: number
}

const DIAS = [1, 2, 3, 4, 5]

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid #DCE6EF', outline: 'none',
  fontSize: 14, background: '#fff', width: '100%',
}
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
  borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280',
}

/** CRUD dos textos prontos de cobrança. Só quem pode cobrar enxerga esta tela. */
export default function GerenciarModelos({ modelos, podeEditar }: { modelos: ModeloItem[]; podeEditar: boolean }) {
  const router = useRouter()
  const [criando, setCriando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // formulário (serve para criar e editar)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [prazoDias, setPrazoDias] = useState<number | null>(null)

  function limpar() {
    setTitulo('')
    setTexto('')
    setPrazoDias(null)
    setErro(null)
  }
  function abrirNovo() {
    limpar()
    setEditandoId(null)
    setCriando(true)
  }
  function abrirEdicao(m: ModeloItem) {
    setErro(null)
    setCriando(false)
    setEditandoId(m.id)
    setTitulo(m.titulo)
    setTexto(m.texto)
    setPrazoDias(m.prazo_dias)
  }

  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, id?: string) {
    setOcupado(id ?? 'novo')
    setErro(null)
    try {
      const res =
        metodo === 'DELETE'
          ? await fetch(`/api/modelos?id=${encodeURIComponent(id ?? '')}`, { method: 'DELETE' })
          : await fetch('/api/modelos', {
              method: metodo,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(corpo),
            })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar.')
      setCriando(false)
      setEditandoId(null)
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
    if (editandoId) chamar('PATCH', { id: editandoId, titulo, texto, prazo_dias: prazoDias }, editandoId)
    else chamar('POST', { titulo, texto, prazo_dias: prazoDias })
  }

  function excluir(m: ModeloItem) {
    if (confirm(`Excluir o modelo "${m.titulo}"? As cobranças já criadas com ele não mudam.`)) {
      chamar('DELETE', undefined, m.id)
    }
  }

  const formulario = (
    <form onSubmit={salvar} style={{ background: '#fff', border: '1px solid #DCE6EF', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14 }}>
        {editandoId ? 'Editar modelo' : 'Novo modelo de cobrança'}
      </div>
      <label style={{ fontSize: 12.5, color: '#6B7280' }}>
        Nome do modelo (é o que aparece no botão)
        <input style={{ ...inputStyle, marginTop: 4 }} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Cliente sem resposta" required />
      </label>
      <label style={{ fontSize: 12.5, color: '#6B7280' }}>
        Texto da cobrança
        <textarea style={{ ...inputStyle, marginTop: 4, minHeight: 80, resize: 'vertical' }} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que o atendente precisa fazer." required />
      </label>
      <div style={{ fontSize: 12.5, color: '#6B7280' }}>
        Prazo sugerido (opcional) — já vem preenchido quando você usar este modelo:
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {DIAS.map((d) => {
            const ativo = prazoDias === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => setPrazoDias(ativo ? null : d)}
                style={{ ...btnBase, height: 30, padding: '0 12px', fontSize: 12.5, background: ativo ? '#1A3C5A' : '#fff', color: ativo ? '#fff' : '#6B7280', border: ativo ? '1px solid #1A3C5A' : '1px solid #DCE6EF' }}
              >
                {d} {d === 1 ? 'dia' : 'dias'}
              </button>
            )
          })}
          {prazoDias !== null && (
            <button type="button" onClick={() => setPrazoDias(null)} style={{ ...btnBase, height: 30, padding: '0 10px', fontSize: 12.5 }}>
              ✕ sem prazo
            </button>
          )}
        </div>
      </div>
      {erro && <div style={{ fontSize: 13, color: '#B91C1C' }}>{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={ocupado !== null} style={{ ...btnBase, height: 40, background: 'linear-gradient(135deg, #1A3C5A, #16A34A)', color: '#fff', border: 'none' }}>
          {ocupado !== null ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar
        </button>
        <button type="button" onClick={() => { setCriando(false); setEditandoId(null); limpar() }} style={{ ...btnBase, height: 40 }}>
          Cancelar
        </button>
      </div>
    </form>
  )

  return (
    <div>
      {podeEditar && !criando && !editandoId && (
        <button onClick={abrirNovo} style={{ ...btnBase, height: 40, background: 'linear-gradient(135deg, #1A3C5A, #16A34A)', color: '#fff', border: 'none', marginBottom: 14 }}>
          <Plus size={16} /> Novo modelo
        </button>
      )}

      {(criando || editandoId) && podeEditar && formulario}

      {modelos.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '36px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13.5, lineHeight: 1.6 }}>
          Nenhum modelo cadastrado ainda.<br />
          Modelos são textos prontos: em vez de digitar a mesma cobrança toda vez, você clica no nome dele.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modelos.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#fff', borderRadius: 14, border: '1px solid #EEF2F7',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '14px 16px',
                borderLeft: m.ativo ? '4px solid #16A34A' : '4px solid #CBD5E1',
                opacity: m.ativo ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14.5 }}>{m.titulo}</span>
                    {m.prazo_dias && (
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: '#FEF3C7', color: '#92400E' }}>
                        prazo {m.prazo_dias} {m.prazo_dias === 1 ? 'dia' : 'dias'}
                      </span>
                    )}
                    {!m.ativo && (
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: '#F1F5F9', color: '#64748B' }}>
                        desativado
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#374151', marginTop: 6, whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
                    {m.vezes_usado > 0 ? `Usado ${m.vezes_usado}x` : 'Ainda não usado'}
                  </div>
                </div>
                {podeEditar && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => abrirEdicao(m)} style={btnBase} title="Mudar nome, texto ou prazo">
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      onClick={() => chamar('PATCH', { id: m.id, ativo: !m.ativo }, m.id)}
                      disabled={ocupado !== null}
                      style={{ ...btnBase, color: m.ativo ? '#B45309' : '#15803D' }}
                      title={m.ativo ? 'Some da lista na hora de cobrar (não apaga)' : 'Volta a aparecer na hora de cobrar'}
                    >
                      {ocupado === m.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                      {m.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => excluir(m)} disabled={ocupado !== null} style={{ ...btnBase, color: '#B91C1C', borderColor: '#FECACA' }} title="Excluir de vez">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {erro && !criando && !editandoId && <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 10 }}>{erro}</div>}
    </div>
  )
}
