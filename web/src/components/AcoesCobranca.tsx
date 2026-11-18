'use client'

import { useState, useId, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Pencil, Trash2, RotateCcw, AlertCircle, Undo2 } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'
import { useAvisoPe } from '@/components/AvisoPe'
import { useConfirmacao } from '@/components/Confirmacao'

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

/** Erro do servidor em linguagem simples (Regra 43 item 3): sem texto técnico do banco. */
function mensagemDeErro(status: number, erro: unknown): string {
  if (status === 401) return 'A sua sessão terminou. Entre de novo no sistema e repita a ação.'
  if ((status === 400 || status === 403) && typeof erro === 'string' && erro) {
    return erro.charAt(0).toUpperCase() + erro.slice(1) + '.'
  }
  return 'Não foi possível concluir a ação. Tente de novo em alguns instantes.'
}

export default function AcoesCobranca({ id, status, mensagem, prazo, podeGerenciar, cliente }: {
  id: string
  status: 'ABERTA' | 'RESOLVIDA' | 'CANCELADA'
  mensagem: string
  prazo: string | null
  podeGerenciar?: boolean
  /** Nome do cliente (já formatado), para os nomes dos botões no leitor de tela. */
  cliente?: string
}) {
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const { confirmar, modal } = useConfirmacao()
  const uid = useId()
  const [carregando, setCarregando] = useState<Acao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(mensagem)
  const [novoPrazo, setNovoPrazo] = useState(isoParaInput(prazo))
  const [erroTexto, setErroTexto] = useState<string | null>(null)
  const campoTexto = useRef<HTMLTextAreaElement | null>(null)
  const botaoEditar = useRef<HTMLButtonElement | null>(null)
  const voltarFoco = useRef(false)

  const deQuem = cliente ? ` de ${cliente}` : ''
  const alterou = texto !== mensagem || novoPrazo !== isoParaInput(prazo)

  useEffect(() => {
    if (editando) campoTexto.current?.focus()
    else if (voltarFoco.current) { voltarFoco.current = false; botaoEditar.current?.focus() }
  }, [editando])

  /** Chama a API. Devolve true se deu certo. */
  async function enviar(acao: Acao, corpo?: Record<string, unknown>): Promise<boolean> {
    let res: Response
    try {
      res = acao === 'excluir'
        ? await fetch(`/api/cobrancas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        : await fetch('/api/cobrancas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, acao, ...corpo }) })
    } catch {
      throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.')
    }
    if (res.ok) return true
    const data = await res.json().catch(() => ({}))
    throw new Error(mensagemDeErro(res.status, (data as { erro?: unknown }).erro))
  }

  /** "Desfazer" do aviso do pé: refaz o estado anterior e avisa se não deu. */
  function desfazerCom(acao: Acao, corpo?: Record<string, unknown>) {
    return async () => {
      try { await enviar(acao, corpo) } catch {
        setTimeout(() => avisar({ texto: 'Não foi possível desfazer. Atualize a página e faça a mudança pela própria cobrança.' }), 300)
      }
      router.refresh()
    }
  }

  async function chamar(acao: Acao, corpo?: Record<string, unknown>) {
    setCarregando(acao); setErro(null)
    try {
      await enviar(acao, corpo)
      if (acao === 'editar') { voltarFoco.current = true; setEditando(false) }
      router.refresh()
      // Aviso do pé (Regra 43 item 2) e "Desfazer" quando a ação tem volta pela API (Regra 50).
      if (acao === 'resolver') {
        avisar({ texto: 'Cobrança marcada como resolvida.', desfazer: podeGerenciar ? desfazerCom('reabrir') : undefined })
      } else if (acao === 'cancelar') {
        avisar({ texto: 'Cobrança cancelada.', desfazer: desfazerCom('reabrir') })
      } else if (acao === 'reabrir') {
        avisar({ texto: 'Cobrança reaberta. Ela voltou para “A resolver”.', desfazer: status === 'CANCELADA' ? desfazerCom('cancelar') : undefined })
      } else if (acao === 'editar') {
        avisar({ texto: 'Cobrança atualizada.', desfazer: desfazerCom('editar', { mensagem, prazo }) })
      } else if (acao === 'excluir') {
        avisar({ texto: 'Cobrança excluída.' })
      }
    } catch (e) {
      setErro((e as Error).message || 'Não foi possível concluir a ação. Tente de novo em alguns instantes.')
    } finally {
      setCarregando(null)
    }
  }

  async function resolver() {
    // Quem não supervisiona não consegue reabrir depois: confirma antes (Regra 50).
    if (!podeGerenciar) {
      const ok = await confirmar({
        titulo: 'Marcar como resolvida?',
        mensagem: 'Use quando você já respondeu o cliente. Depois disso, só o supervisor consegue reabrir esta cobrança.',
        confirmar: 'Marcar como resolvida',
        cancelar: 'Voltar',
      })
      if (!ok) return
    }
    chamar('resolver')
  }

  async function reabrir() {
    // Reabrir uma resolvida apaga a data em que foi resolvida: não tem volta exata, então confirma.
    if (status === 'RESOLVIDA') {
      const ok = await confirmar({
        titulo: 'Reabrir esta cobrança?',
        mensagem: 'Ela volta para “A resolver”, e a data em que foi resolvida é apagada (o tempo até resolver deixa de contar nas métricas).',
        confirmar: 'Reabrir cobrança',
        cancelar: 'Manter resolvida',
      })
      if (!ok) return
    }
    chamar('reabrir')
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: 'Excluir esta cobrança?',
      mensagem: `A cobrança${deQuem} some do histórico e das métricas. Isso não pode ser desfeito.`,
      confirmar: 'Excluir de vez',
      cancelar: 'Manter cobrança',
      perigo: true,
    })
    if (ok) chamar('excluir')
  }

  function restaurarEdicao() {
    setErro(null); setErroTexto(null); setTexto(mensagem); setNovoPrazo(isoParaInput(prazo))
  }

  async function cancelarEdicao() {
    if (alterou) {
      const ok = await confirmar({
        titulo: 'Descartar as alterações?',
        mensagem: 'O que você mudou nesta cobrança ainda não foi salvo e vai se perder.',
        confirmar: 'Descartar',
        cancelar: 'Continuar editando',
        perigo: true,
      })
      if (!ok) return
    }
    restaurarEdicao(); voltarFoco.current = true; setEditando(false)
  }

  if (editando) {
    const idTexto = `${uid}-texto`
    const idPrazo = `${uid}-prazo`
    return (
      <>
        {modal}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!texto.trim()) { setErroTexto('Escreva o que precisa ser feito.'); campoTexto.current?.focus(); return }
            chamar('editar', { mensagem: texto, prazo: inputParaIso(novoPrazo) })
          }}
          onKeyDown={tecladoFormulario}
          noValidate
          aria-labelledby={`${uid}-titulo`}
          style={{ background: 'var(--recuo)', boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 'var(--raio-g)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: 420, maxWidth: '100%' }}
        >
          <h3 className="sub-titulo" id={`${uid}-titulo`}>Editar cobrança{deQuem}</h3>
          <div className="campo">
            <label className="rotulo" htmlFor={idTexto}>O que precisa ser feito? <span className="obrig" aria-hidden="true">*</span></label>
            <textarea
              ref={campoTexto}
              id={idTexto}
              className="entrada"
              style={{ minHeight: 64, resize: 'vertical' }}
              value={texto}
              required
              aria-invalid={erroTexto ? true : undefined}
              aria-describedby={erroTexto ? `${idTexto}-erro` : undefined}
              onChange={(e) => { setTexto(e.target.value); if (erroTexto) setErroTexto(e.target.value.trim() ? null : 'Escreva o que precisa ser feito.') }}
              onBlur={(e) => setErroTexto(e.target.value.trim() ? null : 'Escreva o que precisa ser feito.')}
            />
            {erroTexto && <div className="erro-campo" id={`${idTexto}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroTexto}</div>}
          </div>
          <div className="campo">
            <span className="rotulo" id={`${idPrazo}-rot`}>Prazo <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}>(opcional)</span></span>
            <div className="chips" role="group" aria-labelledby={`${idPrazo}-rot`}>
              {DIAS_PRAZO.map((d) => {
                const valor = prazoEmDias(d)
                const escolhido = novoPrazo === valor
                return (
                  <button key={d} type="button" className="chip" aria-pressed={escolhido} onClick={() => setNovoPrazo(escolhido ? '' : valor)}>{d} {d === 1 ? 'dia' : 'dias'}</button>
                )
              })}
            </div>
            <label className="rotulo" htmlFor={idPrazo} style={{ marginTop: 6, fontWeight: 550, color: 'var(--tinta-2)' }}>Data e hora do prazo</label>
            <input id={idPrazo} className="entrada" type="datetime-local" value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} />
          </div>
          {erro && <div className="erro-campo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" disabled={carregando !== null} className="botao botao-principal">
              {carregando === 'editar' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />}
              {carregando === 'editar' ? 'Salvando…' : 'Salvar alterações'}
            </button>
            {alterou && (
              <button type="button" className="botao botao-discreto" onClick={restaurarEdicao}>
                <Undo2 className="icone icone-p" aria-hidden="true" focusable="false" /> Desfazer alterações
              </button>
            )}
            <button type="button" className="botao botao-secundario" onClick={cancelarEdicao}>Cancelar</button>
          </div>
        </form>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
      {modal}
      <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {status === 'ABERTA' ? (
          <>
            <button type="button" onClick={resolver} disabled={carregando !== null} className="botao botao-acao" title="Marcar esta cobrança como resolvida (você já respondeu o cliente)">
              {carregando === 'resolver' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />}
              {carregando === 'resolver' ? 'Marcando…' : 'Resolver'}<span className="so-leitor"> a cobrança{deQuem}</span>
            </button>
            {podeGerenciar && (
              <>
                <button ref={botaoEditar} type="button" onClick={() => setEditando(true)} disabled={carregando !== null} className="botao botao-secundario" title="Mudar o texto ou o prazo">
                  <Pencil className="icone icone-p" aria-hidden="true" focusable="false" /> Editar<span className="so-leitor"> a cobrança{deQuem}</span>
                </button>
                <button type="button" onClick={() => chamar('cancelar')} disabled={carregando !== null} className="botao botao-secundario" title="Esta cobrança não era necessária">
                  {carregando === 'cancelar' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <X className="icone icone-p" aria-hidden="true" focusable="false" />}
                  {carregando === 'cancelar' ? 'Cancelando…' : 'Cancelar cobrança'}<span className="so-leitor">{deQuem}</span>
                </button>
              </>
            )}
          </>
        ) : (
          podeGerenciar && (
            <button type="button" onClick={reabrir} disabled={carregando !== null} className="botao botao-secundario" title="Voltar esta cobrança para “A resolver”">
              {carregando === 'reabrir' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <RotateCcw className="icone icone-p" aria-hidden="true" focusable="false" />}
              {carregando === 'reabrir' ? 'Reabrindo…' : 'Reabrir'}<span className="so-leitor"> a cobrança{deQuem}</span>
            </button>
          )
        )}
        {podeGerenciar && (
          <button type="button" onClick={excluir} disabled={carregando !== null} className="botao botao-perigo" title="Excluir de vez" aria-label={`Excluir a cobrança${deQuem}`}>
            {carregando === 'excluir' ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Trash2 className="icone icone-p" aria-hidden="true" focusable="false" />}
          </button>
        )}
      </div>

      {erro && <div className="erro-campo" role="alert" style={{ maxWidth: 300 }}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erro}</div>}
    </div>
  )
}
