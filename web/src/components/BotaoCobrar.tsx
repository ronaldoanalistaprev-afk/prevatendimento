'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, Loader2, X } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'

const DIAS_PRAZO = [1, 2, 3, 4, 5]

function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function inputParaIso(valor: string): string | null {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
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
export default function BotaoCobrar({ protocoloId, atendente, modelos = [] }: { protocoloId: string; atendente?: string | null; modelos?: ModeloParaCobrar[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) { setModeloId(''); return }
    setModeloId(m.id); setMensagem(m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true); setMsg(null)
    try {
      const res = await fetch('/api/cobrancas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ protocolo_id: protocoloId, mensagem, prazo: inputParaIso(prazo), modelo_id: modeloId || null }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao cobrar')
      setMsg({ tipo: 'ok', texto: 'Cobrança enviada ao atendente.' })
      setMensagem(''); setPrazo(''); setModeloId('')
      setTimeout(() => setAberto(false), 900)
      router.refresh()
    } catch (err) {
      setMsg({ tipo: 'erro', texto: (err as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return <button onClick={() => setAberto(true)} className="botao" style={{ background: 'var(--atencao)', color: '#fff', border: 'none' }}><BellRing className="icone icone-p" aria-hidden="true" focusable="false" /> Cobrar atendente</button>
  }

  return (
    <form onSubmit={enviar} onKeyDown={tecladoFormulario} style={{ background: 'var(--atencao-suave)', boxShadow: 'inset 0 0 0 1px var(--atencao-borda)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 650, color: 'var(--atencao)', fontSize: 14 }}>Cobrar {atendente ? atendente : 'o atendente'} sobre esta conversa</div>

      {modelos.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--atencao)', marginBottom: 6 }}>Texto pronto (opcional) — clique para usar e edite se quiser:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modelos.map((m) => (
              <button key={m.id} type="button" onClick={() => usarModelo(m)} title={m.texto} className={`botao ${modeloId === m.id ? 'botao-acao' : 'botao-secundario'}`} style={{ minHeight: 34 }}>
                {m.titulo}{m.prazo_dias ? ` · ${m.prazo_dias}d` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea className="entrada" style={{ minHeight: 64, resize: 'vertical' }} placeholder="O que precisa ser feito? Ex.: Cliente perguntou sobre o processo e não teve resposta — favor responder hoje." value={mensagem} onChange={(e) => setMensagem(e.target.value)} required />

      <div style={{ fontSize: 13, color: 'var(--atencao)' }}>
        Prazo (opcional)
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0', alignItems: 'center' }}>
          <div className="abas">
            {DIAS_PRAZO.map((d) => { const valor = prazoEmDias(d); const ativo = prazo === valor; return (
              <button key={d} type="button" className="aba" aria-selected={ativo} onClick={() => setPrazo(ativo ? '' : valor)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
            )})}
          </div>
          {prazo && <button type="button" className="botao botao-discreto" style={{ minHeight: 34 }} onClick={() => setPrazo('')}><X className="icone icone-p" aria-hidden="true" focusable="false" /> sem prazo</button>}
        </div>
        <input className="entrada" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        <div className="ajuda" style={{ marginTop: 4 }}>Os botões preenchem a data às 18h do dia escolhido. Você pode ajustar no campo acima.</div>
      </div>

      {msg && <div className={`aviso ${msg.tipo === 'ok' ? 'aviso-info' : 'aviso-perigo'}`}>{msg.texto}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={salvando} className="botao" style={{ background: 'var(--atencao)', color: '#fff', border: 'none' }}>{salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <BellRing className="icone icone-p" aria-hidden="true" focusable="false" />} Enviar cobrança</button>
        <button type="button" className="botao botao-secundario" onClick={() => { setAberto(false); setMsg(null) }}>Cancelar</button>
      </div>
    </form>
  )
}
