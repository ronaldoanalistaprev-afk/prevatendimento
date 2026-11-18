'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power, X, AlertCircle, RotateCcw, Eraser, MessageSquareText } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'
import { tecladoFormulario } from '@/lib/formulario'

export interface ModeloItem {
  id: string
  titulo: string
  texto: string
  prazo_dias: number | null
  ativo: boolean
  vezes_usado: number
}

const DIAS = [1, 2, 3, 4, 5]

interface Rascunho { titulo: string; texto: string; prazoDias: number | null }
const VAZIO: Rascunho = { titulo: '', texto: '', prazoDias: null }
type Campo = 'titulo' | 'texto'

function validar(c: Campo, v: string): string | null {
  if (v.trim()) return null
  return c === 'titulo' ? 'Dê um nome ao modelo (é o que aparece no botão na hora de cobrar).' : 'Escreva o texto da cobrança.'
}

/** CRUD dos textos prontos de cobrança. Só quem pode cobrar enxerga esta tela. */
export default function GerenciarModelos({ modelos, podeEditar }: { modelos: ModeloItem[]; podeEditar: boolean }) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<ModeloItem | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState<Rascunho>(VAZIO)
  const [tocado, setTocado] = useState<Record<Campo, boolean>>({ titulo: false, texto: false })

  const original: Rascunho = editando ? { titulo: editando.titulo, texto: editando.texto, prazoDias: editando.prazo_dias } : VAZIO
  const alterado = form.titulo !== original.titulo || form.texto !== original.texto || form.prazoDias !== original.prazoDias
  const erros: Record<Campo, string | null> = { titulo: validar('titulo', form.titulo), texto: validar('texto', form.texto) }
  const mostrar = (c: Campo) => (tocado[c] ? erros[c] : null)

  function fechar() { setCriando(false); setEditando(null); setForm(VAZIO); setErro(null); setTocado({ titulo: false, texto: false }) }
  function abrirNovo() { fechar(); setCriando(true) }
  function abrirEdicao(m: ModeloItem) {
    setErro(null); setTocado({ titulo: false, texto: false }); setCriando(false); setEditando(m)
    setForm({ titulo: m.titulo, texto: m.texto, prazoDias: m.prazo_dias })
  }

  async function cancelar() {
    if (alterado && !(await confirmar({ titulo: 'Sair sem salvar?', mensagem: editando ? `As mudanças no modelo "${editando.titulo}" ainda não foram salvas e serão perdidas.` : 'O modelo que você começou a escrever ainda não foi salvo e será perdido.', confirmar: 'Sair sem salvar', cancelar: 'Continuar editando', perigo: true }))) return
    fechar()
  }

  /** Chama a API. Devolve true quando deu certo; o erro fica visível perto de onde a pessoa está. */
  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, id?: string): Promise<boolean> {
    setOcupado(id ?? 'novo'); setErro(null)
    try {
      const res = metodo === 'DELETE'
        ? await fetch(`/api/modelos?id=${encodeURIComponent(id ?? '')}`, { method: 'DELETE' })
        : await fetch('/api/modelos', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar. Tente de novo.')
      router.refresh()
      return true
    } catch (e) {
      setErro((e as Error).message)
      return false
    } finally {
      setOcupado(null)
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setTocado({ titulo: true, texto: true })
    const primeiro = (['titulo', 'texto'] as Campo[]).find((c) => erros[c])
    if (primeiro) { document.getElementById(`modelo-${primeiro}`)?.focus(); return }
    const corpo = { titulo: form.titulo.trim(), texto: form.texto, prazo_dias: form.prazoDias }
    if (editando) {
      const m = editando
      const antes = { id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias }
      if (await chamar('PATCH', { id: m.id, ...corpo }, m.id)) {
        fechar()
        avisar({
          texto: `Modelo "${corpo.titulo}" salvo.`,
          desfazer: async () => { if (await chamar('PATCH', antes, m.id)) avisar({ texto: `Modelo "${m.titulo}" voltou ao que era.` }) },
        })
      }
    } else if (await chamar('POST', corpo)) {
      fechar()
      avisar({ texto: `Modelo "${corpo.titulo}" criado. Ele já aparece ao cobrar um atendente.` })
    }
  }

  /** Ativar/Desativar: SEMPRE com janela de confirmação e o nome do modelo (Regra 39 item 2). */
  async function alternarAtivo(m: ModeloItem) {
    const ok = await confirmar(m.ativo
      ? { titulo: `Desativar o modelo "${m.titulo}"?`, mensagem: 'Ele some da lista na hora de cobrar, mas não é apagado. Dá para ativar de novo quando quiser.', confirmar: 'Desativar modelo', perigo: true }
      : { titulo: `Ativar o modelo "${m.titulo}"?`, mensagem: 'Ele volta a aparecer na lista na hora de cobrar.', confirmar: 'Ativar modelo' })
    if (!ok) return
    const novo = !m.ativo
    if (await chamar('PATCH', { id: m.id, ativo: novo }, m.id)) {
      avisar({
        texto: `Modelo "${m.titulo}" ${novo ? 'ativado' : 'desativado'}.`,
        desfazer: async () => { if (await chamar('PATCH', { id: m.id, ativo: !novo }, m.id)) avisar({ texto: `Modelo "${m.titulo}" voltou a ficar ${novo ? 'desativado' : 'ativo'}.` }) },
      })
    }
  }

  async function excluir(m: ModeloItem) {
    if (await confirmar({ titulo: `Excluir o modelo "${m.titulo}"?`, mensagem: `O modelo "${m.titulo}" será excluído e isso não pode ser desfeito. As cobranças já criadas com ele não mudam.`, confirmar: 'Excluir modelo', perigo: true })) {
      if (await chamar('DELETE', undefined, m.id)) avisar({ texto: `Modelo "${m.titulo}" excluído.` })
    }
  }

  const formulario = (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} noValidate className="cartao" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }} aria-labelledby="modelo-form-titulo">
      <h2 className="cartao-titulo" id="modelo-form-titulo">{editando ? `Editar modelo "${editando.titulo}"` : 'Novo modelo de cobrança'}</h2>
      <div className="campo">
        <label className="rotulo" htmlFor="modelo-titulo">Nome do modelo <span className="obrig" aria-hidden="true">*</span> <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(é o que aparece no botão)</span></label>
        <input
          id="modelo-titulo"
          className="entrada"
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          onBlur={() => setTocado((t) => ({ ...t, titulo: true }))}
          placeholder="Ex.: Cliente sem resposta"
          autoComplete="off"
          aria-required="true"
          aria-invalid={Boolean(mostrar('titulo'))}
          aria-describedby={mostrar('titulo') ? 'modelo-titulo-erro' : undefined}
        />
        {mostrar('titulo') && <span className="erro-campo" id="modelo-titulo-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrar('titulo')}</span>}
      </div>
      <div className="campo">
        <label className="rotulo" htmlFor="modelo-texto">Texto da cobrança <span className="obrig" aria-hidden="true">*</span></label>
        <textarea
          id="modelo-texto"
          className="entrada"
          value={form.texto}
          onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
          onBlur={() => setTocado((t) => ({ ...t, texto: true }))}
          placeholder="O que o atendente precisa fazer."
          aria-required="true"
          aria-invalid={Boolean(mostrar('texto'))}
          aria-describedby={mostrar('texto') ? 'modelo-texto-erro' : undefined}
        />
        {mostrar('texto') && <span className="erro-campo" id="modelo-texto-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrar('texto')}</span>}
      </div>
      <fieldset className="campo">
        <legend className="rotulo">Prazo sugerido <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional): já vem preenchido ao usar o modelo</span></legend>
        {/* Chips de alternar com aria-pressed (referência do Monitor; auditoria T12). */}
        <div className="chips" style={{ marginTop: 6 }}>
          {DIAS.map((d) => (
            <button key={d} type="button" className="chip" aria-pressed={form.prazoDias === d} onClick={() => setForm((f) => ({ ...f, prazoDias: f.prazoDias === d ? null : d }))}>{d} {d === 1 ? 'dia' : 'dias'}</button>
          ))}
          <button type="button" className="chip" aria-pressed={form.prazoDias === null} onClick={() => setForm((f) => ({ ...f, prazoDias: null }))}><X className="icone icone-p" aria-hidden="true" focusable="false" /> Sem prazo</button>
        </div>
      </fieldset>
      {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" disabled={ocupado !== null} className="botao botao-principal">{ocupado !== null ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} {ocupado !== null ? 'Salvando…' : 'Salvar modelo'}</button>
        <button type="button" className="botao botao-secundario" onClick={cancelar} disabled={ocupado !== null}>Cancelar</button>
        {editando
          ? <button type="button" className="botao botao-discreto" onClick={() => { setForm(original); setTocado({ titulo: false, texto: false }) }} disabled={!alterado || ocupado !== null}><RotateCcw className="icone icone-p" aria-hidden="true" focusable="false" /> Desfazer alterações</button>
          : <button type="button" className="botao botao-discreto" onClick={() => { setForm(VAZIO); setTocado({ titulo: false, texto: false }) }} disabled={!alterado || ocupado !== null}><Eraser className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar</button>}
      </div>
    </form>
  )

  return (
    <div>
      {modal}
      {podeEditar && !criando && !editando && (
        <button type="button" onClick={abrirNovo} className="botao botao-principal" style={{ marginBottom: 14 }}><Plus className="icone icone-p" aria-hidden="true" focusable="false" /> Novo modelo</button>
      )}

      {(criando || editando) && podeEditar && formulario}

      {modelos.length === 0 ? (
        <div className="cartao"><div className="vazio">
          <div className="vazio-icone"><MessageSquareText className="icone" aria-hidden="true" focusable="false" /></div>
          <div className="vazio-titulo">Nenhum modelo cadastrado ainda</div>
          <p className="vazio-texto">Modelos são textos prontos: em vez de digitar a mesma cobrança toda vez, você clica no nome dele.{podeEditar ? ' Use “Novo modelo” para criar o primeiro.' : ''}</p>
        </div></div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modelos.map((m) => (
            <li key={m.id} className="cartao" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 className="sub-titulo" style={{ color: m.ativo ? undefined : 'var(--tinta-2)' }}>{m.titulo}</h3>
                    {m.prazo_dias ? <span className="selo selo-neutro">Prazo de {m.prazo_dias} {m.prazo_dias === 1 ? 'dia' : 'dias'}</span> : null}
                    <span className={`selo ${m.ativo ? 'selo-sucesso' : 'selo-neutro'}`}>{m.ativo ? 'Ativo' : 'Desativado'}</span>
                  </div>
                  <p style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta-2)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{m.texto}</p>
                  <p className="texto-apoio" style={{ marginTop: 6 }}>{m.vezes_usado > 0 ? `Usado ${m.vezes_usado} ${m.vezes_usado === 1 ? 'vez' : 'vezes'}` : 'Ainda não usado'}</p>
                </div>
                {podeEditar && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => abrirEdicao(m)} className="botao botao-secundario" aria-label={`Editar o modelo ${m.titulo}`} title="Mudar nome, texto ou prazo"><Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar</button>
                    <button type="button" onClick={() => alternarAtivo(m)} disabled={ocupado !== null} className="botao botao-secundario" aria-label={`${m.ativo ? 'Desativar' : 'Ativar'} o modelo ${m.titulo}`} title={m.ativo ? 'Some da lista na hora de cobrar (não apaga)' : 'Volta a aparecer na hora de cobrar'}>
                      {ocupado === m.id ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Power className="icone icone-p" aria-hidden="true" focusable="false" />} {m.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button type="button" onClick={() => excluir(m)} disabled={ocupado !== null} className="botao botao-perigo" aria-label={`Excluir o modelo ${m.titulo}`} title="Excluir de vez"><Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /></button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {erro && !criando && !editando && <div className="aviso aviso-perigo" role="alert" style={{ marginTop: 10 }}><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}
    </div>
  )
}
