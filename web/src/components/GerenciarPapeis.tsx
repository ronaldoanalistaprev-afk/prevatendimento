'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power, Lock } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
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

/** CRUD dos papéis (cargos). Só o Administrador. */
export default function GerenciarPapeis({ papeis }: { papeis: PapelItem[] }) {
  const router = useRouter()
  const { confirmar, avisar, modal } = useConfirmacao()
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [verTudo, setVerTudo] = useState(false)
  const [cobrar, setCobrar] = useState(false)

  function limpar() { setNome(''); setDescricao(''); setVerTudo(false); setCobrar(false); setErro(null) }
  function abrirNovo() { limpar(); setEditando(null); setCriando(true) }
  function abrirEdicao(p: PapelItem) { setErro(null); setCriando(false); setEditando(p.codigo); setNome(p.nome); setDescricao(p.descricao ?? ''); setVerTudo(p.pode_ver_tudo); setCobrar(p.pode_cobrar) }

  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, codigo?: string) {
    setOcupado(codigo ?? 'novo'); setErro(null)
    try {
      const res = metodo === 'DELETE'
        ? await fetch(`/api/papeis?codigo=${encodeURIComponent(codigo ?? '')}`, { method: 'DELETE' })
        : await fetch('/api/papeis', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar.')
      setCriando(false); setEditando(null); limpar(); router.refresh()
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

  async function excluir(p: PapelItem) {
    if (p.emUso > 0) {
      await avisar({ titulo: 'Não dá para excluir ainda', mensagem: `${p.emUso} ${p.emUso === 1 ? 'login usa' : 'logins usam'} o papel "${p.nome}". Troque o papel dessas pessoas antes de excluir.` })
      return
    }
    if (await confirmar({ titulo: 'Excluir papel', mensagem: `O papel "${p.nome}" será excluído. Isso não pode ser desfeito.`, confirmar: 'Excluir papel', perigo: true })) {
      chamar('DELETE', undefined, p.codigo)
    }
  }

  const editandoAdmin = editando === 'ADMIN'

  const formulario = (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} className="cartao" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
      <div className="cartao-titulo">{editando ? 'Editar papel' : 'Novo papel'}</div>
      <label className="campo"><span className="rotulo">Nome do papel</span><input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Estagiário" required /></label>
      <label className="campo"><span className="rotulo">Para que serve <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span><input className="entrada" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Uma frase explicando o cargo" /></label>

      <div>
        <span className="rotulo">O que este papel pode fazer:</span>
        {editandoAdmin && <div style={{ fontSize: 13, color: 'var(--atencao)', marginTop: 4 }}>O Administrador sempre pode tudo — esses poderes não podem ser tirados dele.</div>}
        <div className="escolhas" style={{ marginTop: 8 }}>
          <label className="escolha">
            <input type="checkbox" checked={verTudo || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setVerTudo(e.target.checked)} />
            <span><span className="titulo-escolha">Ver as conversas de todos</span><span className="detalhe-escolha">Desmarcado, a pessoa só vê as conversas em que ela é a atendente.</span></span>
          </label>
          <label className="escolha">
            <input type="checkbox" checked={cobrar || editandoAdmin} disabled={editandoAdmin} onChange={(e) => setCobrar(e.target.checked)} />
            <span><span className="titulo-escolha">Cobrar os atendentes</span><span className="detalhe-escolha">Criar, editar, cancelar e excluir cobranças — e mexer nos modelos de cobrança.</span></span>
          </label>
        </div>
      </div>

      {erro && <div className="erro-campo"><Trash2 className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={ocupado !== null} className="botao botao-principal">{ocupado !== null ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={() => { setCriando(false); setEditando(null); limpar() }}>Cancelar</button>
      </div>
    </form>
  )

  return (
    <div>
      {modal}
      {!criando && !editando && (
        <button onClick={abrirNovo} className="botao botao-principal" style={{ marginBottom: 14 }}><Plus className="icone icone-p" aria-hidden="true" focusable="false" /> Novo papel</button>
      )}

      {(criando || editando) && formulario}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {papeis.map((p) => (
          <section key={p.codigo} className="cartao" style={{ padding: '14px 16px', opacity: p.ativo ? 1 : 0.7 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="sub-titulo">{p.nome}</span>
                  {p.sistema && <span className="selo selo-acao" title="Papel de fábrica: pode editar o nome, mas não excluir"><Lock className="icone" aria-hidden="true" focusable="false" /> de fábrica</span>}
                  {!p.ativo && <span className="selo selo-neutro">desativado</span>}
                  <span className="texto-apoio">{p.emUso} {p.emUso === 1 ? 'login' : 'logins'}</span>
                </div>
                {p.descricao && <div style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 5 }}>{p.descricao}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <Poder ligado={p.pode_ver_tudo} texto={p.pode_ver_tudo ? 'Vê as conversas de todos' : 'Vê só as próprias conversas'} />
                  <Poder ligado={p.pode_cobrar} texto={p.pode_cobrar ? 'Pode cobrar' : 'Não cobra'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => abrirEdicao(p)} className="botao botao-secundario" title="Mudar nome, descrição e poderes"><Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar</button>
                {p.codigo !== 'ADMIN' && (
                  <button onClick={() => chamar('PATCH', { codigo: p.codigo, ativo: !p.ativo }, p.codigo)} disabled={ocupado !== null} className="botao botao-secundario" style={{ color: p.ativo ? 'var(--atencao)' : 'var(--sucesso)' }} title={p.ativo ? 'Quem tiver este papel perde o acesso até reativar' : 'Volta a valer'}>
                    {ocupado === p.codigo ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Power className="icone icone-p" aria-hidden="true" focusable="false" />} {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
                {!p.sistema && <button onClick={() => excluir(p)} disabled={ocupado !== null} className="botao botao-perigo" title="Excluir de vez"><Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /></button>}
              </div>
            </div>
          </section>
        ))}
      </div>
      {erro && !criando && !editando && <div className="erro-campo" style={{ marginTop: 10 }}><Trash2 className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
    </div>
  )
}

function Poder({ ligado, texto }: { ligado: boolean; texto: string }) {
  return <span className={`selo ${ligado ? 'selo-sucesso' : 'selo-neutro'}`}>{texto}</span>
}
