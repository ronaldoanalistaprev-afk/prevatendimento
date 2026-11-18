'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'

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
function isoParaInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : paraInputLocal(d)
}
function inputParaIso(valor: string): string | null {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

type Acao = 'resolver' | 'cancelar' | 'editar' | 'excluir' | 'reabrir'

export default function AcoesCobranca({ id, status, mensagem, prazo, podeGerenciar }: {
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
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  async function chamar(acao: Acao, corpo?: Record<string, unknown>) {
    setCarregando(acao); setErro(null)
    try {
      const res = acao === 'excluir'
        ? await fetch(`/api/cobrancas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        : await fetch('/api/cobrancas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, acao, ...corpo }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.erro ?? 'Não foi possível concluir a ação.')
      setEditando(false); router.refresh()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(null)
    }
  }

  if (editando) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); chamar('editar', { mensagem: texto, prazo: inputParaIso(novoPrazo) }) }} onKeyDown={tecladoFormulario} style={{ background: 'var(--recuo)', boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 280, flex: 1 }}>
        <div className="sub-titulo" style={{ fontSize: 14 }}>Editar cobrança</div>
        <textarea className="entrada" style={{ minHeight: 64, resize: 'vertical' }} value={texto} onChange={(e) => setTexto(e.target.value)} required />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div className="abas">
            {DIAS_PRAZO.map((d) => { const valor = prazoEmDias(d); const ativo = novoPrazo === valor; return (
              <button key={d} type="button" className="aba" aria-selected={ativo} onClick={() => setNovoPrazo(ativo ? '' : valor)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
            )})}
          </div>
        </div>
        <input className="entrada" type="datetime-local" value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} />
        {erro && <div className="erro-campo"><X className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={carregando !== null} className="botao botao-principal">{carregando === 'editar' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Salvar</button>
          <button type="button" className="botao botao-secundario" onClick={() => { setEditando(false); setErro(null); setTexto(mensagem); setNovoPrazo(isoParaInput(prazo)) }}>Cancelar</button>
        </div>
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {status === 'ABERTA' ? (
          <>
            <button onClick={() => chamar('resolver')} disabled={carregando !== null} className="botao" style={{ background: 'var(--sucesso)', color: '#fff', border: 'none' }} title="Marcar esta cobrança como resolvida (você já respondeu o cliente)">
              {carregando === 'resolver' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Resolver
            </button>
            {podeGerenciar && (
              <>
                <button onClick={() => setEditando(true)} className="botao botao-secundario" title="Mudar o texto ou o prazo"><Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar</button>
                <button onClick={() => chamar('cancelar')} disabled={carregando !== null} className="botao botao-secundario" title="Esta cobrança não era necessária">{carregando === 'cancelar' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <X className="icone icone-p" aria-hidden="true" focusable="false" />} Cancelar</button>
              </>
            )}
          </>
        ) : (
          podeGerenciar && (
            <button onClick={() => chamar('reabrir')} disabled={carregando !== null} className="botao botao-secundario" title="Voltar esta cobrança para aberta">{carregando === 'reabrir' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <RotateCcw className="icone icone-p" aria-hidden="true" focusable="false" />} Reabrir</button>
          )
        )}
        {podeGerenciar && !confirmandoExclusao && (
          <button onClick={() => setConfirmandoExclusao(true)} disabled={carregando !== null} className="botao botao-perigo" title="Excluir de vez"><Trash2 className="icone icone-p" aria-hidden="true" focusable="false" /></button>
        )}
      </div>

      {confirmandoExclusao && (
        <div className="aviso aviso-perigo" style={{ maxWidth: 320, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Excluir esta cobrança? Ela some do histórico e das métricas, e isso não pode ser desfeito.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmandoExclusao(false)} disabled={carregando !== null} className="botao botao-secundario">Manter</button>
            <button onClick={() => chamar('excluir')} disabled={carregando !== null} className="botao botao-perigo" style={{ background: 'var(--perigo)', color: '#fff' }}>{carregando === 'excluir' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" />} Excluir de vez</button>
          </div>
        </div>
      )}

      {erro && <div style={{ fontSize: 13, color: 'var(--perigo)', maxWidth: 260, textAlign: 'right' }}>{erro}</div>}
    </div>
  )
}
