'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { useRouter } from 'next/navigation'
import { BellPlus, Loader2, Search, X, Link2, ChevronDown, AlertCircle } from 'lucide-react'
import { formatarNome, formatarTelefone } from '@/lib/utils'
import { tecladoFormulario } from '@/lib/formulario'
import { useAvisoPe } from '@/components/AvisoPe'
import { useConfirmacao } from '@/components/Confirmacao'
import type { ModeloParaCobrar } from '@/components/BotaoCobrar'

interface Atendente { id: string; nome: string }
interface ClienteBusca { id: string; nome: string | null; telefone: string | null }
type Campo = 'colaborador' | 'mensagem'

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

/** Mensagens de cada campo obrigatório (Regras 10, 18 e 19: no campo, em tempo real). */
function validar(campo: Campo, valor: string): string | null {
  if (campo === 'colaborador') return valor ? null : 'Escolha quem vai receber a cobrança.'
  return valor.trim() ? null : 'Escreva o que precisa ser feito.'
}

export default function NovaCobranca({ atendentes = [], modelos = [] }: { atendentes?: Atendente[]; modelos?: ModeloParaCobrar[] }) {
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const { confirmar, modal } = useConfirmacao()
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [colaborador, setColaborador] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erros, setErros] = useState<Partial<Record<Campo, string | null>>>({})
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({})

  const [termo, setTermo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ClienteBusca[]>([])
  const [ativo, setAtivo] = useState(-1)
  const [cliente, setCliente] = useState<ClienteBusca | null>(null)

  const botaoAbrir = useRef<HTMLButtonElement | null>(null)
  const campoColaborador = useRef<HTMLSelectElement | null>(null)
  const campoMensagem = useRef<HTMLTextAreaElement | null>(null)
  const campoBusca = useRef<HTMLInputElement | null>(null)
  const voltarFoco = useRef(false)

  // Ao abrir, o cursor vai para o primeiro campo; ao fechar, volta para o botão que abriu.
  useEffect(() => {
    if (aberto) campoColaborador.current?.focus()
    else if (voltarFoco.current) { voltarFoco.current = false; botaoAbrir.current?.focus() }
  }, [aberto])

  function limpar() {
    setColaborador(''); setMensagem(''); setPrazo(''); setModeloId(''); setErro(null)
    setErros({}); setTocados({})
    setTermo(''); setResultados([]); setCliente(null); setAtivo(-1)
  }

  function fechar() {
    limpar(); voltarFoco.current = true; setAberto(false)
  }

  const temAlgoPreenchido = Boolean(colaborador || mensagem.trim() || prazo || cliente || termo.trim() || modeloId)

  async function cancelar() {
    if (temAlgoPreenchido) {
      const ok = await confirmar({
        titulo: 'Descartar esta cobrança?',
        mensagem: 'O que você preencheu ainda não foi salvo e vai se perder.',
        confirmar: 'Descartar',
        cancelar: 'Continuar preenchendo',
        perigo: true,
      })
      if (!ok) return
    }
    fechar()
  }

  function mudarCampo(campo: Campo, valor: string) {
    if (campo === 'colaborador') setColaborador(valor)
    else setMensagem(valor)
    // Depois que a pessoa passou pelo campo, a mensagem acompanha a digitação.
    if (tocados[campo]) setErros((e) => ({ ...e, [campo]: validar(campo, valor) }))
  }
  function sairDoCampo(campo: Campo, valor: string) {
    setTocados((t) => ({ ...t, [campo]: true }))
    setErros((e) => ({ ...e, [campo]: validar(campo, valor) }))
  }

  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) { setModeloId(''); return }
    setModeloId(m.id); mudarCampo('mensagem', m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

  useEffect(() => {
    if (cliente) return
    const t = termo.trim()
    if (t.length < 2) { setResultados([]); setAtivo(-1); return }
    setBuscando(true)
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/clientes/buscar?q=${encodeURIComponent(t)}`)
        const j = await r.json()
        setResultados((j.clientes ?? []) as ClienteBusca[])
        setAtivo(-1)
      } catch { setResultados([]) } finally { setBuscando(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [termo, cliente])

  function escolherCliente(c: ClienteBusca) {
    setCliente(c); setResultados([]); setTermo(''); setAtivo(-1)
  }

  // Setas e Enter na lista de clientes encontrados (Regra 25: seleção pesquisável pelo teclado).
  function teclaBusca(e: React.KeyboardEvent<HTMLInputElement>) {
    if (resultados.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((i) => (i + 1) % resultados.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((i) => (i <= 0 ? resultados.length - 1 : i - 1)) }
    else if (e.key === 'Enter' && ativo >= 0 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); e.stopPropagation(); escolherCliente(resultados[ativo])
    } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setResultados([]); setAtivo(-1) }
  }

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const eCol = validar('colaborador', colaborador)
    const eMsg = validar('mensagem', mensagem)
    setErros({ colaborador: eCol, mensagem: eMsg })
    setTocados({ colaborador: true, mensagem: true })
    if (eCol) { campoColaborador.current?.focus(); return }
    if (eMsg) { campoMensagem.current?.focus(); return }
    setSalvando(true)
    try {
      const r = await fetch('/api/cobrancas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaborador_id: colaborador, mensagem: mensagem.trim(), prazo: inputParaIso(prazo), cliente_id: cliente?.id, modelo_id: modeloId || null }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErro(r.status === 403 ? 'O seu papel não permite criar cobranças. Fale com o administrador.' : 'Não foi possível criar a cobrança. Confira os campos e tente de novo.')
        return
      }
      const nome = formatarNome(atendentes.find((a) => a.id === colaborador)?.nome)
      const novaId = (j as { id?: string }).id
      fechar(); router.refresh()
      avisar({
        texto: `Cobrança criada para ${nome}.`,
        desfazer: novaId ? async () => {
          const d = await fetch(`/api/cobrancas?id=${encodeURIComponent(novaId)}`, { method: 'DELETE' }).catch(() => null)
          router.refresh()
          if (!d?.ok) setTimeout(() => avisar({ texto: 'Não foi possível desfazer. A cobrança continua na lista; exclua por ela, se quiser.' }), 300)
        } : undefined,
      })
    } catch {
      setErro('Sem conexão com o servidor. Confira a internet e tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <>
        {modal}
        <button ref={botaoAbrir} type="button" onClick={() => setAberto(true)} className="botao botao-principal">
          <BellPlus className="icone icone-p" aria-hidden="true" focusable="false" /> Nova cobrança
        </button>
      </>
    )
  }

  const idCol = `${id}-colaborador`
  const idMsg = `${id}-mensagem`
  const idPrazo = `${id}-prazo`
  const idBusca = `${id}-busca`
  const idLista = `${id}-lista`

  return (
    <>
      {modal}
      <form className="cartao" style={{ padding: '18px 20px', maxWidth: 640 }} onSubmit={criar} onKeyDown={tecladoFormulario} noValidate aria-labelledby={`${id}-titulo`}>
        <h2 className="cartao-titulo" id={`${id}-titulo`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <BellPlus className="icone" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Nova cobrança
        </h2>

        <div className="campo" style={{ marginBottom: 12 }}>
          <label className="rotulo" htmlFor={idCol}>Colaborador <span className="obrig" aria-hidden="true">*</span></label>
          <div className="caixa-select">
            <select
              ref={campoColaborador}
              id={idCol}
              className="entrada"
              value={colaborador}
              required
              aria-invalid={erros.colaborador ? true : undefined}
              aria-describedby={erros.colaborador ? `${idCol}-erro` : undefined}
              onChange={(e) => mudarCampo('colaborador', e.target.value)}
              onBlur={(e) => sairDoCampo('colaborador', e.target.value)}
            >
              <option value="">— escolha quem vai receber a cobrança —</option>
              {atendentes.map((a) => (<option key={a.id} value={a.id}>{formatarNome(a.nome)}</option>))}
            </select>
            <ChevronDown className="icone" aria-hidden="true" focusable="false" />
          </div>
          {erros.colaborador && <div className="erro-campo" id={`${idCol}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erros.colaborador}</div>}
        </div>

        {modelos.length > 0 && (
          <div style={{ marginBottom: 12 }} role="group" aria-labelledby={`${id}-modelos`}>
            <span className="rotulo" id={`${id}-modelos`} style={{ display: 'block', marginBottom: 5 }}>Texto pronto <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional) — escolha um para usar e edite se quiser</span></span>
            <div className="chips">
              {modelos.map((m) => (
                <button key={m.id} type="button" onClick={() => usarModelo(m)} title={m.texto} className="chip" aria-pressed={modeloId === m.id}>
                  {m.titulo}{m.prazo_dias ? <span className="chip-conta">· {m.prazo_dias} {m.prazo_dias === 1 ? 'dia' : 'dias'}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="campo" style={{ marginBottom: 12 }}>
          <label className="rotulo" htmlFor={idMsg}>O que precisa ser feito? <span className="obrig" aria-hidden="true">*</span></label>
          <textarea
            ref={campoMensagem}
            id={idMsg}
            className="entrada"
            value={mensagem}
            rows={3}
            required
            placeholder="Ex.: Retornar o contato do cliente sobre o andamento do processo."
            aria-invalid={erros.mensagem ? true : undefined}
            aria-describedby={erros.mensagem ? `${idMsg}-erro` : undefined}
            onChange={(e) => mudarCampo('mensagem', e.target.value)}
            onBlur={(e) => sairDoCampo('mensagem', e.target.value)}
          />
          {erros.mensagem && <div className="erro-campo" id={`${idMsg}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erros.mensagem}</div>}
        </div>

        <div className="campo" style={{ marginBottom: 12 }}>
          <span className="rotulo" id={`${idPrazo}-rot`}>Prazo <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} role="group" aria-labelledby={`${idPrazo}-rot`}>
            <div className="chips">
              {DIAS_PRAZO.map((d) => {
                const valor = prazoEmDias(d)
                const escolhido = prazo === valor
                return (
                  <button key={d} type="button" className="chip" aria-pressed={escolhido} onClick={() => setPrazo(escolhido ? '' : valor)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
                )
              })}
            </div>
            {prazo && <button type="button" className="botao botao-discreto" onClick={() => setPrazo('')}><X className="icone icone-p" aria-hidden="true" focusable="false" /> Tirar o prazo</button>}
          </div>
          <label className="rotulo" htmlFor={idPrazo} style={{ marginTop: 6, fontWeight: 550, color: 'var(--tinta-2)' }}>Data e hora do prazo</label>
          <input id={idPrazo} className="entrada" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} style={{ maxWidth: 260 }} aria-describedby={`${idPrazo}-ajuda`} />
          <div className="ajuda" id={`${idPrazo}-ajuda`}>Os botões de dias preenchem a data às 18h do dia escolhido. Você pode ajustar no campo acima.</div>
        </div>

        <div style={{ marginBottom: 14, background: 'var(--recuo)', borderRadius: 'var(--raio)', padding: '12px 14px' }}>
          <label className="rotulo" htmlFor={idBusca} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Link2 className="icone icone-p" aria-hidden="true" focusable="false" /> Ligar a um cliente <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span>
          </label>
          {cliente ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--acao-suave)', borderRadius: 'var(--raio-p)', padding: '8px 12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650, color: 'var(--acao-forte)', fontSize: 'var(--t-meta)' }}>{cliente.nome ? formatarNome(cliente.nome) : 'Cliente sem nome'}</div>
                <div style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-2)' }}>{formatarTelefone(cliente.telefone)} · liga ao atendimento aberto mais recente</div>
              </div>
              <button
                type="button"
                className="botao-icone"
                onClick={() => { setCliente(null); setTimeout(() => campoBusca.current?.focus(), 0) }}
                title="Tirar o vínculo com este cliente"
                aria-label={`Tirar o vínculo com ${cliente.nome ? formatarNome(cliente.nome) : 'o cliente'}`}
              >
                <X className="icone icone-p" aria-hidden="true" focusable="false" />
              </button>
            </div>
          ) : (
            <>
              <div className="caixa-icone">
                <Search className="icone" aria-hidden="true" focusable="false" />
                <input
                  ref={campoBusca}
                  id={idBusca}
                  className="entrada"
                  type="search"
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  onKeyDown={teclaBusca}
                  placeholder="Comece a digitar o nome ou o telefone…"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={resultados.length > 0}
                  aria-controls={idLista}
                  aria-autocomplete="list"
                  aria-activedescendant={ativo >= 0 ? `${idLista}-${ativo}` : undefined}
                  aria-describedby={`${idBusca}-ajuda`}
                />
                {buscando && <Loader2 className="icone icone-p animate-spin" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />}
              </div>
              <ul
                id={idLista}
                role="listbox"
                aria-label="Clientes encontrados"
                hidden={resultados.length === 0}
                style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}
              >
                {resultados.map((c, i) => (
                  <li
                    key={c.id}
                    id={`${idLista}-${i}`}
                    role="option"
                    aria-selected={i === ativo}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => escolherCliente(c)}
                    onMouseEnter={() => setAtivo(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 44, padding: '6px 12px', cursor: 'pointer',
                      borderRadius: 'var(--raio-p)', boxShadow: i === ativo ? 'inset 0 0 0 2px var(--acao)' : 'inset 0 0 0 1px var(--linha)',
                      background: i === ativo ? 'var(--acao-suave)' : 'var(--superficie)',
                    }}
                  >
                    <span style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 'var(--t-meta)' }}>{c.nome ? formatarNome(c.nome) : 'Cliente sem nome'}</span>
                    <span style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-2)' }}>{formatarTelefone(c.telefone)}</span>
                  </li>
                ))}
              </ul>
              <div role="status" className="texto-apoio" style={{ marginTop: resultados.length === 0 && !buscando && termo.trim().length >= 2 ? 8 : 0 }}>
                {!buscando && termo.trim().length >= 2 && resultados.length === 0 ? `Nenhum cliente encontrado para “${termo.trim()}”.` : ''}
                {resultados.length > 0 ? <span className="so-leitor">{resultados.length === 1 ? '1 cliente encontrado. Use as setas para escolher.' : `${resultados.length} clientes encontrados. Use as setas para escolher.`}</span> : null}
              </div>
              <div className="ajuda" id={`${idBusca}-ajuda`} style={{ marginTop: 6 }}>Sem vínculo, a cobrança é uma tarefa geral (resolvida à mão). Com vínculo, fecha sozinha quando o atendente responder o cliente.</div>
            </>
          )}
        </div>

        {erro && <div className="aviso aviso-perigo" role="alert" style={{ marginBottom: 10 }}><AlertCircle className="icone" aria-hidden="true" focusable="false" /><span>{erro}</span></div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={salvando} className="botao botao-principal">
            {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <BellPlus className="icone icone-p" aria-hidden="true" focusable="false" />}
            {salvando ? 'Criando…' : 'Criar cobrança'}
          </button>
          <button type="button" onClick={cancelar} className="botao botao-secundario">Cancelar</button>
        </div>
      </form>
    </>
  )
}
