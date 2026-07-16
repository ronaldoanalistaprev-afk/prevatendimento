'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Pencil, Trash2, RotateCcw } from 'lucide-react'

/** Prazos rápidos de 1 a 5 dias (mesma regra do botão Cobrar). */
const DIAS_PRAZO = [1, 2, 3, 4, 5]

function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function prazoEmDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  d.setHours(18, 0, 0, 0)
  return paraInputLocal(d)
}
/** ISO do banco -> valor do <input type="datetime-local"> */
function isoParaInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : paraInputLocal(d)
}

type Acao = 'resolver' | 'cancelar' | 'editar' | 'excluir' | 'reabrir'

/**
 * Ações de uma cobrança.
 * `podeGerenciar` = quem cobra (edita, cancela, exclui, reabre).
 * Quem não gerencia só resolve as cobranças dirigidas a ele.
 */
export default function AcoesCobranca({
  id,
  status,
  mensagem,
  prazo,
  podeGerenciar,
}: {
  id: string
  status: 'ABERTA' | 'RESOLVIDA' | 'CANCELADA'
  mensagem: string
  prazo: string | null
  podeGerenciar?: boolean
}) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<Acao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(mensagem)
  const [novoPrazo, setNovoPrazo] = useState(isoParaInput(prazo))

  async function chamar(acao: Acao, corpo?: Record<string, unknown>) {
    setCarregando(acao)
    setErro(null)
    try {
      const res =
        acao === 'excluir'
          ? await fetch(`/api/cobrancas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
          : await fetch('/api/cobrancas', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, acao, ...corpo }),
            })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível concluir a ação.')
      setEditando(false)
      router.refresh()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(null)
    }
  }

  function excluir() {
    if (confirm('Excluir esta cobrança? Ela some do histórico e das métricas. Isso não pode ser desfeito.')) {
      chamar('excluir')
    }
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px',
    borderRadius: 9, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', border: '1px solid #DCE6EF',
    background: '#fff', color: '#6B7280',
  }
  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 10, border: '1px solid #DCE6EF', outline: 'none', fontSize: 14, background: '#fff', width: '100%',
  }

  if (editando) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          chamar('editar', { mensagem: texto, prazo: novoPrazo || null })
        }}
        style={{ background: '#F8FAFC', border: '1px solid #DCE6EF', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 280, flex: 1 }}
      >
        <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 13 }}>Editar cobrança</div>
        <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={texto} onChange={(e) => setTexto(e.target.value)} required />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DIAS_PRAZO.map((d) => {
            const valor = prazoEmDias(d)
            const ativo = novoPrazo === valor
            return (
              <button
                key={d}
                type="button"
                onClick={() => setNovoPrazo(ativo ? '' : valor)}
                style={{ ...btn, height: 28, padding: '0 10px', fontSize: 12, background: ativo ? '#1A3C5A' : '#fff', color: ativo ? '#fff' : '#6B7280', border: ativo ? '1px solid #1A3C5A' : '1px solid #DCE6EF' }}
              >
                {d} {d === 1 ? 'dia' : 'dias'}
              </button>
            )
          })}
        </div>
        <input type="datetime-local" style={inputStyle} value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} />
        {erro && <div style={{ fontSize: 12.5, color: '#B91C1C' }}>{erro}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={carregando !== null} style={{ ...btn, background: '#1A3C5A', color: '#fff', border: 'none' }}>
            {carregando === 'editar' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
          </button>
          <button type="button" onClick={() => { setEditando(false); setErro(null); setTexto(mensagem); setNovoPrazo(isoParaInput(prazo)) }} style={btn}>
            Cancelar
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {status === 'ABERTA' ? (
          <>
            <button onClick={() => chamar('resolver')} disabled={carregando !== null} style={{ ...btn, background: '#16A34A', color: '#fff', border: 'none' }} title="O atendente já respondeu o cliente">
              {carregando === 'resolver' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Resolvida
            </button>
            {podeGerenciar && (
              <>
                <button onClick={() => setEditando(true)} style={btn} title="Mudar o texto ou o prazo">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => chamar('cancelar')} disabled={carregando !== null} style={btn} title="Esta cobrança não era necessária">
                  {carregando === 'cancelar' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Cancelar
                </button>
              </>
            )}
          </>
        ) : (
          podeGerenciar && (
            <button onClick={() => chamar('reabrir')} disabled={carregando !== null} style={btn} title="Voltar esta cobrança para aberta">
              {carregando === 'reabrir' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reabrir
            </button>
          )
        )}
        {podeGerenciar && (
          <button onClick={excluir} disabled={carregando !== null} style={{ ...btn, color: '#B91C1C', borderColor: '#FECACA' }} title="Excluir de vez">
            {carregando === 'excluir' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>
      {erro && <div style={{ fontSize: 12, color: '#B91C1C', maxWidth: 260, textAlign: 'right' }}>{erro}</div>}
    </div>
  )
}
