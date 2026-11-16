'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BellPlus, Loader2, Search, X, Link2, ChevronDown } from 'lucide-react'
import { formatarNome, formatarTelefone } from '@/lib/utils'
import type { ModeloParaCobrar } from '@/components/BotaoCobrar'

interface Atendente { id: string; nome: string }
interface ClienteBusca { id: string; nome: string | null; telefone: string | null }

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

export default function NovaCobranca({ atendentes = [], modelos = [] }: { atendentes?: Atendente[]; modelos?: ModeloParaCobrar[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [colaborador, setColaborador] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [termo, setTermo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ClienteBusca[]>([])
  const [cliente, setCliente] = useState<ClienteBusca | null>(null)

  function limpar() {
    setColaborador(''); setMensagem(''); setPrazo(''); setModeloId(''); setErro(null)
    setTermo(''); setResultados([]); setCliente(null)
  }

  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) { setModeloId(''); return }
    setModeloId(m.id); setMensagem(m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

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
      } catch { setResultados([]) } finally { setBuscando(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [termo, cliente])

  async function criar() {
    setErro(null)
    if (!colaborador) { setErro('Escolha o colaborador.'); return }
    if (!mensagem.trim()) { setErro('Escreva o que precisa ser feito.'); return }
    setSalvando(true)
    try {
      const r = await fetch('/api/cobrancas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaborador_id: colaborador, mensagem: mensagem.trim(), prazo: inputParaIso(prazo), cliente_id: cliente?.id, modelo_id: modeloId || null }) })
      const j = await r.json()
      if (!r.ok) { setErro(j.erro ?? 'Não foi possível criar a cobrança.'); return }
      limpar(); setAberto(false); router.refresh()
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return <button onClick={() => setAberto(true)} className="botao botao-principal"><BellPlus className="icone icone-p" aria-hidden="true" focusable="false" /> Nova cobrança</button>
  }

  return (
    <div className="cartao" style={{ padding: '18px 20px', maxWidth: 640 }}>
      <div className="cartao-titulo" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BellPlus className="icone" style={{ color: 'var(--atencao)' }} aria-hidden="true" focusable="false" /> Nova cobrança
      </div>

      <label className="campo" style={{ marginBottom: 12 }}>
        <span className="rotulo">Colaborador <span className="obrig">*</span></span>
        <div className="caixa-select">
          <select className="entrada" value={colaborador} onChange={(e) => setColaborador(e.target.value)}>
            <option value="">— escolha quem vai receber a cobrança —</option>
            {atendentes.map((a) => (<option key={a.id} value={a.id}>{formatarNome(a.nome)}</option>))}
          </select>
          <ChevronDown className="icone" aria-hidden="true" focusable="false" />
        </div>
      </label>

      {modelos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <span className="rotulo" style={{ display: 'block', marginBottom: 5 }}>Texto pronto <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional) — clique para usar e edite se quiser</span></span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modelos.map((m) => (
              <button key={m.id} type="button" onClick={() => usarModelo(m)} title={m.texto} className={`botao ${modeloId === m.id ? 'botao-acao' : 'botao-secundario'}`} style={{ minHeight: 34 }}>
                {m.titulo}{m.prazo_dias ? ` · ${m.prazo_dias}d` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="campo" style={{ marginBottom: 12 }}>
        <span className="rotulo">O que precisa ser feito? <span className="obrig">*</span></span>
        <textarea className="entrada" value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Ex.: Retornar o contato do cliente sobre o andamento do processo." />
      </label>

      <div style={{ marginBottom: 12 }}>
        <span className="rotulo" style={{ display: 'block', marginBottom: 5 }}>Prazo <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <div className="abas">
            {DIAS_PRAZO.map((d) => { const valor = prazoEmDias(d); const ativo = prazo === valor; return (
              <button key={d} type="button" className="aba" aria-selected={ativo} onClick={() => setPrazo(ativo ? '' : valor)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
            )})}
          </div>
          {prazo && <button type="button" className="botao botao-discreto" style={{ minHeight: 34 }} onClick={() => setPrazo('')}><X className="icone icone-p" aria-hidden="true" focusable="false" /> sem prazo</button>}
        </div>
        <input className="entrada" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} style={{ maxWidth: 260 }} />
        <div className="ajuda" style={{ marginTop: 4 }}>Os botões preenchem a data às 18h do dia escolhido. Você pode ajustar no campo acima.</div>
      </div>

      <div style={{ marginBottom: 14, background: 'var(--recuo)', borderRadius: 10, padding: '12px 14px' }}>
        <span className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><Link2 className="icone icone-p" aria-hidden="true" focusable="false" /> Ligar a um cliente <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span>
        {cliente ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--acao-suave)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 650, color: 'var(--acao-forte)', fontSize: 14 }}>{cliente.nome ? formatarNome(cliente.nome) : 'Cliente'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--tinta-2)' }}>{formatarTelefone(cliente.telefone)} · liga ao atendimento aberto mais recente</div>
            </div>
            <button className="botao-icone" onClick={() => setCliente(null)} title="Remover vínculo" aria-label="Remover vínculo"><X className="icone icone-p" aria-hidden="true" focusable="false" /></button>
          </div>
        ) : (
          <>
            <div className="caixa-icone">
              <Search className="icone" aria-hidden="true" focusable="false" />
              <input className="entrada" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Comece a digitar o nome ou o telefone…" autoComplete="off" />
              {buscando && <Loader2 className="icone icone-p animate-spin" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />}
            </div>
            {resultados.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 190, overflowY: 'auto' }}>
                {resultados.map((c) => (
                  <button key={c.id} onClick={() => { setCliente(c); setResultados([]); setTermo('') }} style={{ textAlign: 'left', background: 'var(--superficie)', boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', border: 0 }}>
                    <span style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 13.5 }}>{c.nome ? formatarNome(c.nome) : 'Cliente'}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--tinta-2)', marginLeft: 8 }}>{formatarTelefone(c.telefone)}</span>
                  </button>
                ))}
              </div>
            )}
            {!buscando && termo.trim().length >= 2 && resultados.length === 0 && <div className="texto-apoio" style={{ marginTop: 8 }}>Nenhum cliente encontrado para “{termo.trim()}”.</div>}
            <div className="ajuda" style={{ marginTop: 6 }}>Sem vínculo, a cobrança é uma tarefa geral (resolvida à mão). Com vínculo, fecha sozinha quando o atendente responder o cliente.</div>
          </>
        )}
      </div>

      {erro && <div className="erro-campo" style={{ marginBottom: 10 }}><X className="icone" aria-hidden="true" focusable="false" />{erro}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={criar} disabled={salvando} className="botao botao-principal" style={{ background: 'var(--sucesso)' }}>{salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <BellPlus className="icone icone-p" aria-hidden="true" focusable="false" />} Criar cobrança</button>
        <button onClick={() => { limpar(); setAberto(false) }} className="botao botao-secundario">Cancelar</button>
      </div>
    </div>
  )
}
