'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BellPlus, Loader2, Search, X, Link2 } from 'lucide-react'
import { formatarNome, formatarTelefone } from '@/lib/utils'
import type { ModeloParaCobrar } from '@/components/BotaoCobrar'

interface Atendente {
  id: string
  nome: string
}
interface ClienteBusca {
  id: string
  nome: string | null
  telefone: string | null
}

const DIAS_PRAZO = [1, 2, 3, 4, 5]

function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
/** Valor do campo datetime-local -> ISO absoluto (o campo não carrega fuso). */
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

export default function NovaCobranca({ atendentes = [], modelos = [] }: { atendentes?: Atendente[]; modelos?: ModeloParaCobrar[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [colaborador, setColaborador] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('') // datetime-local
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // vínculo opcional a um cliente
  const [termo, setTermo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ClienteBusca[]>([])
  const [cliente, setCliente] = useState<ClienteBusca | null>(null)

  function limpar() {
    setColaborador(''); setMensagem(''); setPrazo(''); setModeloId(''); setErro(null)
    setTermo(''); setResultados([]); setCliente(null)
  }

  /** Aplica o texto pronto — e o prazo sugerido dele, se tiver. */
  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) { setModeloId(''); return }
    setModeloId(m.id)
    setMensagem(m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

  // Busca AO VIVO: aparece conforme você digita (a partir de 2 letras), com uma
  // pequena pausa (300ms) para não consultar a cada tecla.
  useEffect(() => {
    if (cliente) return
    const t = termo.trim()
    if (t.length < 2) { setResultados([]); return }
    setBuscando(true)
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/clientes/buscar?q=${encodeURIComponent(t)}`)
        const j = await r.json()
        setResultados((j.clientes ?? []) as ClienteBusca[])
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [termo, cliente])

  async function criar() {
    setErro(null)
    if (!colaborador) { setErro('Escolha o colaborador.'); return }
    if (!mensagem.trim()) { setErro('Escreva o que precisa ser feito.'); return }
    setSalvando(true)
    try {
      const r = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaborador_id: colaborador, mensagem: mensagem.trim(), prazo: inputParaIso(prazo), cliente_id: cliente?.id, modelo_id: modeloId || null }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j.erro ?? 'Não foi possível criar a cobrança.'); return }
      limpar()
      setAberto(false)
      router.refresh()
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 999, border: 'none', background: '#1A3C5A', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
      >
        <BellPlus size={16} /> Nova cobrança
      </button>
    )
  }

  const campo: React.CSSProperties = { width: '100%', borderRadius: 8, border: '1px solid #DCE6EF', fontSize: 13.5, padding: '9px 12px', background: '#fff' }
  const rotulo: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block' }
  const chip = (ativo: boolean): React.CSSProperties => ({
    height: 30, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
    border: ativo ? '1px solid #1A3C5A' : '1px solid #DCE6EF', background: ativo ? '#1A3C5A' : '#fff', color: ativo ? '#fff' : '#475569',
  })

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '18px 20px', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BellPlus size={18} style={{ color: '#C2410C' }} />
        <h2 style={{ fontSize: 15.5, fontWeight: 700, color: '#1A3C5A' }}>Nova cobrança</h2>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={rotulo}>Colaborador *</label>
        <select value={colaborador} onChange={(e) => setColaborador(e.target.value)} style={{ ...campo, cursor: 'pointer' }}>
          <option value="">— escolha quem vai receber a cobrança —</option>
          {atendentes.map((a) => (
            <option key={a.id} value={a.id}>{formatarNome(a.nome)}</option>
          ))}
        </select>
      </div>

      {modelos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={rotulo}>Texto pronto (opcional) — clique para usar e edite se quiser:</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modelos.map((m) => (
              <button key={m.id} type="button" onClick={() => usarModelo(m)} title={m.texto} style={chip(modeloId === m.id)}>
                {m.titulo}{m.prazo_dias ? ` · ${m.prazo_dias}d` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={rotulo}>O que precisa ser feito? *</label>
        <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Ex.: Retornar o contato do cliente sobre o andamento do processo." style={{ ...campo, resize: 'vertical' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={rotulo}>Prazo (opcional)</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {DIAS_PRAZO.map((d) => {
            const valor = prazoEmDias(d)
            const ativo = prazo === valor
            return (
              <button key={d} type="button" onClick={() => setPrazo(ativo ? '' : valor)} style={chip(ativo)}>
                {d} {d === 1 ? 'dia' : 'dias'}
              </button>
            )
          })}
          {prazo && (
            <button type="button" onClick={() => setPrazo('')} style={{ height: 30, padding: '0 10px', borderRadius: 999, border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280', fontSize: 12.5, cursor: 'pointer' }}>
              ✕ sem prazo
            </button>
          )}
        </div>
        <input type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} style={{ ...campo, maxWidth: 260 }} />
        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>
          Os botões preenchem a data às 18h do dia escolhido. Você pode ajustar no campo acima.
        </div>
      </div>

      {/* Vínculo opcional a um cliente */}
      <div style={{ marginBottom: 14, background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
        <label style={{ ...rotulo, marginBottom: 8 }}>
          <Link2 size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }} />
          Ligar a um cliente (opcional)
        </label>
        {cliente ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EAF1F9', border: '1px solid #BFD3E6', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 13.5 }}>{cliente.nome ? formatarNome(cliente.nome) : 'Cliente'}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{formatarTelefone(cliente.telefone)} · liga ao atendimento aberto mais recente</div>
            </div>
            <button onClick={() => setCliente(null)} title="Remover vínculo" style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'inline-flex' }}><X size={16} /></button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#9CA3AF' }} />
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Comece a digitar o nome ou o telefone…"
                autoComplete="off"
                style={{ ...campo, paddingLeft: 34 }}
              />
              {buscando && <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', right: 11, top: 12, color: '#9CA3AF' }} />}
            </div>
            {resultados.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 190, overflowY: 'auto' }}>
                {resultados.map((c) => (
                  <button key={c.id} onClick={() => { setCliente(c); setResultados([]); setTermo('') }} style={{ textAlign: 'left', background: '#fff', border: '1px solid #EEF2F7', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 13 }}>{c.nome ? formatarNome(c.nome) : 'Cliente'}</span>
                    <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>{formatarTelefone(c.telefone)}</span>
                  </button>
                ))}
              </div>
            )}
            {!buscando && termo.trim().length >= 2 && resultados.length === 0 && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Nenhum cliente encontrado para “{termo.trim()}”.</div>
            )}
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
              Sem vínculo, a cobrança é uma tarefa geral (resolvida à mão). Com vínculo, fecha sozinha quando o atendente responder o cliente.
            </div>
          </>
        )}
      </div>

      {erro && <div style={{ color: '#B91C1C', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{erro}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={criar} disabled={salvando} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 999, border: 'none', background: salvando ? '#94A3B8' : '#16A34A', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: salvando ? 'default' : 'pointer' }}>
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <BellPlus size={15} />} Criar cobrança
        </button>
        <button onClick={() => { limpar(); setAberto(false) }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid #DCE6EF', background: '#fff', color: '#6B7280', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
