'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Loader2, Pencil, Trash2, Power, X } from 'lucide-react'
import { useConfirmacao } from './Confirmacao'
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

/** CRUD dos textos prontos de cobrança. Só quem pode cobrar enxerga esta tela. */
export default function GerenciarModelos({ modelos, podeEditar }: { modelos: ModeloItem[]; podeEditar: boolean }) {
  const router = useRouter()
  const { confirmar, modal } = useConfirmacao()
  const [criando, setCriando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [prazoDias, setPrazoDias] = useState<number | null>(null)

  function limpar() { setTitulo(''); setTexto(''); setPrazoDias(null); setErro(null) }
  function abrirNovo() { limpar(); setEditandoId(null); setCriando(true) }
  function abrirEdicao(m: ModeloItem) { setErro(null); setCriando(false); setEditandoId(m.id); setTitulo(m.titulo); setTexto(m.texto); setPrazoDias(m.prazo_dias) }

  async function chamar(metodo: 'POST' | 'PATCH' | 'DELETE', corpo?: Record<string, unknown>, id?: string) {
    setOcupado(id ?? 'novo'); setErro(null)
    try {
      const res = metodo === 'DELETE'
        ? await fetch(`/api/modelos?id=${encodeURIComponent(id ?? '')}`, { method: 'DELETE' })
        : await fetch('/api/modelos', { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível salvar.')
      setCriando(false); setEditandoId(null); limpar(); router.refresh()
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

  async function excluir(m: ModeloItem) {
    if (await confirmar({ titulo: 'Excluir modelo', mensagem: `O modelo "${m.titulo}" será excluído. As cobranças já criadas com ele não mudam.`, confirmar: 'Excluir modelo', perigo: true })) {
      chamar('DELETE', undefined, m.id)
    }
  }

  const formulario = (
    <form onSubmit={salvar} onKeyDown={tecladoFormulario} className="cartao" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
      <div className="cartao-titulo">{editandoId ? 'Editar modelo' : 'Novo modelo de cobrança'}</div>
      <label className="campo"><span className="rotulo">Nome do modelo <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(é o que aparece no botão)</span></span>
        <input className="entrada" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Cliente sem resposta" required />
      </label>
      <label className="campo"><span className="rotulo">Texto da cobrança</span>
        <textarea className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que o atendente precisa fazer." required />
      </label>
      <div className="campo">
        <span className="rotulo" style={{ fontWeight: 600 }}>Prazo sugerido <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional) — já vem preenchido ao usar o modelo</span></span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          <div className="abas">
            {DIAS.map((d) => (
              <button key={d} type="button" className="aba" aria-selected={prazoDias === d} onClick={() => setPrazoDias(prazoDias === d ? null : d)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
            ))}
          </div>
          {prazoDias !== null && (
            <button type="button" className="botao botao-discreto" style={{ minHeight: 36 }} onClick={() => setPrazoDias(null)}><X className="icone icone-p" aria-hidden="true" focusable="false" /> sem prazo</button>
          )}
        </div>
      </div>
      {erro && <div className="erro-campo"><X className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={ocupado !== null} className="botao botao-principal">{ocupado !== null ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={() => { setCriando(false); setEditandoId(null); limpar() }}>Cancelar</button>
      </div>
    </form>
  )

  return (
    <div>
      {modal}
      {podeEditar && !criando && !editandoId && (
        <button onClick={abrirNovo} className="botao botao-principal" style={{ marginBottom: 14 }}><Plus className="icone icone-p" aria-hidden="true" focusable="false" /> Novo modelo</button>
      )}

      {(criando || editandoId) && podeEditar && formulario}

      {modelos.length === 0 ? (
        <div className="cartao"><div className="vazio"><p className="vazio-texto">Nenhum modelo cadastrado ainda. Modelos são textos prontos: em vez de digitar a mesma cobrança toda vez, você clica no nome dele.</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modelos.map((m) => (
            <section key={m.id} className="cartao" style={{ padding: '14px 16px', opacity: m.ativo ? 1 : 0.7 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="sub-titulo">{m.titulo}</span>
                    {m.prazo_dias && <span className="selo selo-atencao">prazo {m.prazo_dias} {m.prazo_dias === 1 ? 'dia' : 'dias'}</span>}
                    {!m.ativo && <span className="selo selo-neutro">desativado</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  <div className="texto-apoio" style={{ marginTop: 6 }}>{m.vezes_usado > 0 ? `Usado ${m.vezes_usado}x` : 'Ainda não usado'}</div>
                </div>
                {podeEditar && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => abrirEdicao(m)} className="botao botao-secundario" title="Mudar nome, texto ou prazo"><Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar</button>
                    <button onClick={() => chamar('PATCH', { id: m.id, ativo: !m.ativo }, m.id)} disabled={ocupado !== null} className="botao botao-secundario" style={{ color: m.ativo ? 'var(--atencao)' : 'var(--sucesso)' }} title={m.ativo ? 'Some da lista na hora de cobrar (não apaga)' : 'Volta a aparecer na hora de cobrar'}>
                      {ocupado === m.id ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Power className="icone icone-p" aria-hidden="true" focusable="false" />} {m.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => excluir(m)} disabled={ocupado !== null} className="botao botao-perigo" title="Excluir de vez"><Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /></button>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      {erro && !criando && !editandoId && <div className="erro-campo" style={{ marginTop: 10 }}><X className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
    </div>
  )
}
