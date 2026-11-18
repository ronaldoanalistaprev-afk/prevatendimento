'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power, Lock, AlertCircle, RotateCcw, Eraser } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
import { useAvisoPe } from './AvisoPe'
import { tecladoFormulario } from '@/lib/formulario'

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

interface Rascunho { nome: string; descricao: string; verTudo: boolean; cobrar: boolean }
const VAZIO: Rascunho = { nome: '', descricao: '', verTudo: false, cobrar: false }

/** CRUD dos papéis (cargos). Só o Administrador. */
export default function GerenciarPapeis({ papeis }: { papeis: PapelItem[] }) {
  const router = useRouter()
  const { confirmar, avisar: avisarJanela, modal } = useConfirmacao()
  const { avisar } = useAvisoPe()
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<PapelItem | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [nomeTocado, setNomeTocado] = useState(false)

  const [form, setForm] = useState<Rascunho>(VAZIO)
  const original: Rascunho = editando
    ? { nome: editando.nome, descricao: editando.descricao ?? '', verTudo: editando.pode_ver_tudo, cobrar: editando.pode_cobrar }
    : VAZIO
  const alterado = form.nome !== original.nome || form.descricao !== original.descricao || form.verTudo !== original.verTudo || form.cobrar !== original.cobrar
  const erroNome = form.nome.trim() ? null : 'Dê um nome ao papel (é o que aparece no cadastro de cada login).'

  function fechar() { setCriando(false); setEditando(null); setForm(VAZIO); setErro(null); setNomeTocado(false) }
  function abrirNovo() { setErro(null); setNomeTocado(false); setEditando(null); setForm(VAZIO); setCriando(true) }
  function abrirEdicao(p: PapelItem) {
    setErro(null); setNomeTocado(false); setCriando(false); setEditando(p)
    setForm({ nome: p.nome, descricao: p.descricao ?? '', verTudo: p.pode_ver_tudo, cobrar: p.pode_cobrar })
  }

  async function cancelar() {
    if (alterado && !(await confirmar({ titulo: 'Sair sem salvar?', mensagem: editando ? `As mudanças no papel "${editando.nome}" ainda não foram salvas e serão perdidas.` : 'O papel que você começou a criar ainda não foi salvo e será perdido.', confirmar: 'Sair sem salvar', cancelar: 'Continuar editando', perigo: true }))) return
    fechar()
  }

  /** Chama a API. Devolve true quando deu certo; o erro fica visível perto de onde a pessoa está. */
  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, codigo?: string): Promise<boolean> {
    setOcupado(codigo ?? 'novo'); setErro(null)
    try {
      const res = metodo === 'DELETE'
        ? await fetch(`/api/papeis?codigo=${encodeURIComponent(codigo ?? '')}`, { method: 'DELETE' })
        : await fetch('/api/papeis', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
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
    setNomeTocado(true)
    if (erroNome) { document.getElementById('papel-nome')?.focus(); return }
    const corpo = { nome: form.nome.trim(), descricao: form.descricao, pode_ver_tudo: form.verTudo, pode_cobrar: form.cobrar }
    if (editando) {
      const p = editando
      const antes = { codigo: p.codigo, nome: p.nome, descricao: p.descricao ?? '', pode_ver_tudo: p.pode_ver_tudo, pode_cobrar: p.pode_cobrar }
      if (await chamar('PATCH', { ...corpo, codigo: p.codigo }, p.codigo)) {
        fechar()
        avisar({
          texto: `Papel "${corpo.nome}" salvo.`,
          desfazer: async () => { if (await chamar('PATCH', antes, p.codigo)) avisar({ texto: `Papel "${p.nome}" voltou ao que era.` }) },
        })
      }
    } else if (await chamar('POST', corpo)) {
      fechar()
      avisar({ texto: `Papel "${corpo.nome}" criado. Escolha as telas dele em Permissões.` })
    }
  }

  /** Ativar/Desativar: SEMPRE com janela de confirmação e o nome do papel (Regra 39 item 2). */
  async function alternarAtivo(p: PapelItem) {
    const ok = await confirmar(p.ativo
      ? { titulo: `Desativar o papel "${p.nome}"?`, mensagem: p.emUso > 0 ? `${p.emUso} ${p.emUso === 1 ? 'pessoa tem' : 'pessoas têm'} este papel e ${p.emUso === 1 ? 'perde' : 'perdem'} o acesso ao sistema até ele ser reativado. Nada é apagado.` : 'Ninguém usa este papel agora. Ele deixa de aparecer no cadastro de logins até ser reativado.', confirmar: 'Desativar papel', perigo: true }
      : { titulo: `Ativar o papel "${p.nome}"?`, mensagem: 'O papel volta a valer, e quem o tem volta a entrar no sistema.', confirmar: 'Ativar papel' })
    if (!ok) return
    const novo = !p.ativo
    if (await chamar('PATCH', { codigo: p.codigo, ativo: novo }, p.codigo)) {
      avisar({
        texto: `Papel "${p.nome}" ${novo ? 'ativado' : 'desativado'}.`,
        desfazer: async () => { if (await chamar('PATCH', { codigo: p.codigo, ativo: !novo }, p.codigo)) avisar({ texto: `Papel "${p.nome}" voltou a ficar ${novo ? 'desativado' : 'ativo'}.` }) },
      })
    }
  }

  async function excluir(p: PapelItem) {
    if (p.emUso > 0) {
      await avisarJanela({ titulo: 'Não dá para excluir ainda', mensagem: `${p.emUso} ${p.emUso === 1 ? 'login usa' : 'logins usam'} o papel "${p.nome}". Troque o papel dessas pessoas antes de excluir.` })
      return
    }
    if (await confirmar({ titulo: `Excluir o papel "${p.nome}"?`, mensagem: `O papel "${p.nome}" será excluído. Isso não pode ser desfeito.`, confirmar: 'Excluir papel', perigo: true })) {
      if (await chamar('DELETE', undefined, p.codigo)) avisar({ texto: `Papel "${p.nome}" excluído.` })
    }
  }

  const editandoAdmin = editando?.codigo === 'ADMIN'
  const mostrarErroNome = nomeTocado ? erroNome : null

  const formulario = (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} noValidate className="cartao" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }} aria-labelledby="papel-form-titulo">
      <h2 className="cartao-titulo" id="papel-form-titulo">{editando ? `Editar papel "${editando.nome}"` : 'Novo papel'}</h2>
      <div className="campo">
        <label className="rotulo" htmlFor="papel-nome">Nome do papel <span className="obrig" aria-hidden="true">*</span></label>
        <input
          id="papel-nome"
          className="entrada"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          onBlur={() => setNomeTocado(true)}
          placeholder="Ex.: Estagiário"
          aria-required="true"
          aria-invalid={Boolean(mostrarErroNome)}
          aria-describedby={mostrarErroNome ? 'papel-nome-erro' : undefined}
          autoComplete="off"
        />
        {mostrarErroNome && <span className="erro-campo" id="papel-nome-erro"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{mostrarErroNome}</span>}
      </div>
      <div className="campo">
        <label className="rotulo" htmlFor="papel-descricao">Para que serve <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></label>
        <input id="papel-descricao" className="entrada" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Uma frase explicando o cargo" autoComplete="off" />
      </div>

      <fieldset>
        <legend className="rotulo">O que este papel pode fazer</legend>
        {editandoAdmin && <p className="ajuda" style={{ marginTop: 4 }}>O Administrador sempre pode tudo: esses poderes não podem ser tirados dele.</p>}
        <div className="escolhas" style={{ marginTop: 8 }}>
          <label className="escolha">
            <input type="checkbox" checked={form.verTudo || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setForm((f) => ({ ...f, verTudo: e.target.checked }))} />
            <span><span className="titulo-escolha">Ver as conversas de todos</span><span className="detalhe-escolha">Desmarcado, a pessoa só vê as conversas em que ela é a atendente.</span></span>
          </label>
          <label className="escolha">
            <input type="checkbox" checked={form.cobrar || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setForm((f) => ({ ...f, cobrar: e.target.checked }))} />
            <span><span className="titulo-escolha">Cobrar os atendentes</span><span className="detalhe-escolha">Criar, editar, cancelar e excluir cobranças, e mexer nos modelos de cobrança.</span></span>
          </label>
        </div>
      </fieldset>

      {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" disabled={ocupado !== null} className="botao botao-principal">{ocupado !== null ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} {ocupado !== null ? 'Salvando…' : 'Salvar papel'}</button>
        <button type="button" className="botao botao-secundario" onClick={cancelar} disabled={ocupado !== null}>Cancelar</button>
        {editando
          ? <button type="button" className="botao botao-discreto" onClick={() => { setForm(original); setNomeTocado(false) }} disabled={!alterado || ocupado !== null}><RotateCcw className="icone icone-p" aria-hidden="true" focusable="false" /> Desfazer alterações</button>
          : <button type="button" className="botao botao-discreto" onClick={() => { setForm(VAZIO); setNomeTocado(false) }} disabled={!alterado || ocupado !== null}><Eraser className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar</button>}
      </div>
    </form>
  )

  return (
    <div>
      {modal}
      {!criando && !editando && (
        <button type="button" onClick={abrirNovo} className="botao botao-principal" style={{ marginBottom: 14 }}><Plus className="icone icone-p" aria-hidden="true" focusable="false" /> Novo papel</button>
      )}

      {(criando || editando) && formulario}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {papeis.map((p) => (
          <li key={p.codigo} className="cartao" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 className="sub-titulo" style={{ color: p.ativo ? undefined : 'var(--tinta-2)' }}>{p.nome}</h3>
                  {p.sistema && <span className="selo selo-acao" title="Papel de fábrica: pode editar o nome, mas não excluir"><Lock className="icone" aria-hidden="true" focusable="false" /> De Fábrica</span>}
                  <span className={`selo ${p.ativo ? 'selo-sucesso' : 'selo-neutro'}`}>{p.ativo ? 'Ativo' : 'Desativado'}</span>
                  <span className="texto-apoio">{p.emUso} {p.emUso === 1 ? 'login' : 'logins'}</span>
                </div>
                {p.descricao && <p style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta-2)', marginTop: 5 }}>{p.descricao}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <Poder ligado={p.pode_ver_tudo} texto={p.pode_ver_tudo ? 'Vê as conversas de todos' : 'Vê só as próprias conversas'} />
                  <Poder ligado={p.pode_cobrar} texto={p.pode_cobrar ? 'Pode cobrar' : 'Não cobra'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => abrirEdicao(p)} className="botao botao-secundario" aria-label={`Editar o papel ${p.nome}`} title="Mudar nome, descrição e poderes"><Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar</button>
                {p.codigo !== 'ADMIN' && (
                  <button type="button" onClick={() => alternarAtivo(p)} disabled={ocupado !== null} className="botao botao-secundario" aria-label={`${p.ativo ? 'Desativar' : 'Ativar'} o papel ${p.nome}`} title={p.ativo ? 'Quem tiver este papel perde o acesso até reativar' : 'Volta a valer'}>
                    {ocupado === p.codigo ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Power className="icone icone-p" aria-hidden="true" focusable="false" />} {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
                {!p.sistema && (
                  <button type="button" onClick={() => excluir(p)} disabled={ocupado !== null} className="botao botao-perigo" aria-label={`Excluir o papel ${p.nome}`} title="Excluir de vez">
                    <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {erro && !criando && !editando && <div className="aviso aviso-perigo" role="alert" style={{ marginTop: 10 }}><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}
    </div>
  )
}

function Poder({ ligado, texto }: { ligado: boolean; texto: string }) {
  return <span className={`selo ${ligado ? 'selo-sucesso' : 'selo-neutro'}`}>{texto}</span>
}
