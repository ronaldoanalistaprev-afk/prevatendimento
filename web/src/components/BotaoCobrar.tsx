'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, Loader2 } from 'lucide-react'

/** Prazos rápidos: 1 a 5 dias. Preenchem o campo de data (que continua editável). */
const DIAS_PRAZO = [1, 2, 3, 4, 5]

/** Data/hora local no formato que o <input type="datetime-local"> entende. */
function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Valor do campo de data/hora -> ISO absoluto. O campo não carrega fuso;
 * o servidor roda em UTC e leria "18:00" como se fosse em Londres.
 */
function inputParaIso(valor: string): string | null {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Hoje + N dias, às 18h (fim do expediente). */
function prazoEmDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  d.setHours(18, 0, 0, 0)
  return paraInputLocal(d)
}

export interface ModeloParaCobrar {
  id: string
  titulo: string
  texto: string
  prazo_dias: number | null
}

/** Botão do supervisor/gestor: cria uma cobrança para o atendente do protocolo. */
export default function BotaoCobrar({
  protocoloId,
  atendente,
  modelos = [],
}: {
  protocoloId: string
  atendente?: string | null
  modelos?: ModeloParaCobrar[]
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  /** Aplica o texto pronto — e o prazo sugerido dele, se tiver. */
  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) {
      setModeloId('')
      return
    }
    setModeloId(m.id)
    setMensagem(m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolo_id: protocoloId, mensagem, prazo: inputParaIso(prazo), modelo_id: modeloId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao cobrar')
      setMsg({ tipo: 'ok', texto: 'Cobrança enviada ao atendente.' })
      setMensagem('')
      setPrazo('')
      setModeloId('')
      setTimeout(() => setAberto(false), 900)
      router.refresh()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: (err as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px',
          borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #B45309, #C2410C)',
          color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}
      >
        <BellRing size={16} /> Cobrar atendente
      </button>
    )
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 10, border: '1px solid #DCE6EF', outline: 'none', fontSize: 14, background: '#fff', width: '100%',
  }

  return (
    <form onSubmit={enviar} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 700, color: '#92400E', fontSize: 13.5 }}>
        Cobrar {atendente ? atendente : 'o atendente'} sobre esta conversa
      </div>

      {modelos.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, color: '#92400E', marginBottom: 6 }}>
            Texto pronto (opcional) — clique para usar e edite se quiser:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modelos.map((m) => {
              const ativo = modeloId === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => usarModelo(m)}
                  title={m.texto}
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                    border: ativo ? '1px solid #1A3C5A' : '1px solid #FDE68A',
                    background: ativo ? '#1A3C5A' : '#fff',
                    color: ativo ? '#fff' : '#92400E',
                  }}
                >
                  {m.titulo}
                  {m.prazo_dias ? ` · ${m.prazo_dias}d` : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <textarea
        style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
        placeholder="O que precisa ser feito? Ex.: Cliente perguntou sobre o processo e não teve resposta — favor responder hoje."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        required
      />
      <div style={{ fontSize: 12.5, color: '#92400E' }}>
        Prazo (opcional)
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
          {DIAS_PRAZO.map((d) => {
            const valor = prazoEmDias(d)
            const ativo = prazo === valor
            return (
              <button
                key={d}
                type="button"
                onClick={() => setPrazo(ativo ? '' : valor)}
                style={{
                  height: 30, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                  border: ativo ? '1px solid #1A3C5A' : '1px solid #FDE68A',
                  background: ativo ? '#1A3C5A' : '#fff',
                  color: ativo ? '#fff' : '#92400E',
                }}
              >
                {d} {d === 1 ? 'dia' : 'dias'}
              </button>
            )
          })}
          {prazo && (
            <button
              type="button"
              onClick={() => setPrazo('')}
              style={{ height: 30, padding: '0 10px', borderRadius: 999, border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280', fontSize: 12.5, cursor: 'pointer' }}
            >
              ✕ sem prazo
            </button>
          )}
        </div>
        <input type="datetime-local" style={inputStyle} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 4 }}>
          Os botões preenchem a data às 18h do dia escolhido. Você pode ajustar no campo acima.
        </div>
      </div>
      {msg && (
        <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 10, background: msg.tipo === 'ok' ? '#DCFCE7' : '#FEF2F2', color: msg.tipo === 'ok' ? '#15803D' : '#B91C1C' }}>
          {msg.texto}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={salvando}
          style={{ height: 40, padding: '0 18px', borderRadius: 10, border: 'none', background: salvando ? '#9CA3AF' : 'linear-gradient(135deg, #B45309, #C2410C)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: salvando ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <BellRing size={15} />} Enviar cobrança
        </button>
        <button type="button" onClick={() => { setAberto(false); setMsg(null) }} style={{ height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
