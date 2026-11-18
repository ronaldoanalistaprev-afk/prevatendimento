'use client'

import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, Loader2, X, AlertCircle } from 'lucide-react'
import { tecladoFormulario } from '@/lib/formulario'
import { formatarNome } from '@/lib/utils'
import { useAvisoPe } from '@/components/AvisoPe'
import { useConfirmacao } from '@/components/Confirmacao'

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
  const { avisar } = useAvisoPe()
  const { confirmar, modal } = useConfirmacao()
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tocado, setTocado] = useState(false)
  const botaoAbrirRef = useRef<HTMLButtonElement>(null)
  const textoRef = useRef<HTMLTextAreaElement>(null)
  const id = useId()

  const nomeAtendente = atendente ? formatarNome(atendente) : null
  const erroMensagem = !mensagem.trim() ? 'Escreva o que o atendente precisa fazer.' : null
  const mostrarErroMensagem = tocado && erroMensagem
  const preenchido = Boolean(mensagem.trim() || prazo || modeloId)

  function usarModelo(m: ModeloParaCobrar) {
    if (modeloId === m.id) { setModeloId(''); return }
    setModeloId(m.id); setMensagem(m.texto)
    if (m.prazo_dias) setPrazo(prazoEmDias(m.prazo_dias))
  }

  function abrir() {
    setAberto(true)
    requestAnimationFrame(() => textoRef.current?.focus())
  }

  function fechar() {
    setAberto(false); setErro(null); setTocado(false)
    setMensagem(''); setPrazo(''); setModeloId('')
    requestAnimationFrame(() => botaoAbrirRef.current?.focus())
  }

  // Cancelar com algo preenchido pergunta antes (Regras 28 e 30); o cursor começa em "Continuar escrevendo".
  async function cancelar() {
    if (preenchido) {
      const ok = await confirmar({
        titulo: 'Descartar esta cobrança?',
        mensagem: 'O que você escreveu ainda não foi enviado ao atendente e será perdido.',
        cancelar: 'Continuar escrevendo',
        confirmar: 'Descartar',
        perigo: true,
      })
      if (!ok) return
    }
    fechar()
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setTocado(true)
    if (erroMensagem) { textoRef.current?.focus(); return }
    setSalvando(true); setErro(null)
    try {
      const res = await fetch('/api/cobrancas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ protocolo_id: protocoloId, mensagem, prazo: inputParaIso(prazo), modelo_id: modeloId || null }) })
      const data = await res.json()
      if (!res.ok) {
        const porCodigo: Record<number, string> = {
          401: 'Sua sessão terminou. Entre de novo no sistema e envie a cobrança outra vez.',
          403: 'O seu papel não permite cobrar atendentes. Peça ao administrador, se precisar.',
          404: 'Esta conversa não foi encontrada. Atualize a página e tente de novo.',
          400: 'Confira a mensagem e o prazo da cobrança e tente de novo.',
        }
        throw new Error(porCodigo[res.status] ?? 'Não foi possível enviar a cobrança. Tente de novo; se continuar, avise o administrador.')
      }
      const novaId: string | undefined = data?.id
      fechar()
      router.refresh()
      // Aviso do pé com "Desfazer" (Regras 43 e 50): desfazer apaga a cobrança recém-criada.
      avisar({
        texto: nomeAtendente ? `Cobrança enviada a ${nomeAtendente}.` : 'Cobrança enviada ao atendente.',
        desfazer: novaId
          ? async () => {
              const r = await fetch(`/api/cobrancas?id=${encodeURIComponent(novaId)}`, { method: 'DELETE' }).catch(() => null)
              if (r?.ok) router.refresh()
              // O aviso atual fecha ao terminar o Desfazer; o resultado entra logo depois, num aviso novo.
              const texto = r?.ok ? 'Cobrança desfeita.' : 'Não foi possível desfazer. Cancele a cobrança na tela Cobranças.'
              setTimeout(() => avisar({ texto, erro: !r?.ok }), 300)
            }
          : undefined,
      })
    } catch (err) {
      // Mensagem escolhida pelo código da resposta (acima); falha de rede cai no texto geral.
      const msg = (err as Error).message
      setErro(msg && !/fetch|network/i.test(msg) ? msg : 'Não foi possível enviar a cobrança. Confira a internet e tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <button ref={botaoAbrirRef} type="button" onClick={abrir} className="botao botao-principal">
        <BellRing className="icone icone-p" aria-hidden="true" focusable="false" /> Cobrar atendente
      </button>
    )
  }

  const idTexto = `${id}-texto`
  const idPrazo = `${id}-prazo`
  const idTitulo = `${id}-titulo`

  return (
    <>
      <form onSubmit={enviar} onKeyDown={tecladoFormulario} noValidate className="cartao" aria-labelledby={idTitulo} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="cartao-titulo" id={idTitulo}>Cobrar {nomeAtendente ?? 'o atendente'} sobre esta conversa</h2>

        {modelos.length > 0 && (
          <div role="group" aria-labelledby={`${id}-modelos`}>
            <p className="rotulo" id={`${id}-modelos`} style={{ marginBottom: 6 }}>Texto pronto <span className="ajuda" style={{ fontWeight: 400 }}>(opcional — toque para usar e edite se quiser)</span></p>
            <div className="chips">
              {modelos.map((m) => (
                <button key={m.id} type="button" className="chip" aria-pressed={modeloId === m.id} onClick={() => usarModelo(m)} title={m.texto}>
                  {m.titulo}{m.prazo_dias ? ` · ${m.prazo_dias} ${m.prazo_dias === 1 ? 'dia' : 'dias'}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="campo">
          <label className="rotulo" htmlFor={idTexto}>O que o atendente precisa fazer <span className="obrig" aria-hidden="true">*</span></label>
          <textarea
            ref={textoRef}
            id={idTexto}
            className="entrada"
            placeholder="Ex.: Cliente perguntou sobre o processo e não teve resposta — favor responder hoje."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            onBlur={() => setTocado(true)}
            aria-required="true"
            aria-invalid={mostrarErroMensagem ? true : undefined}
            aria-describedby={mostrarErroMensagem ? `${idTexto}-erro` : undefined}
          />
          {mostrarErroMensagem && <p className="erro-campo" id={`${idTexto}-erro`}><AlertCircle className="icone" aria-hidden="true" focusable="false" />{erroMensagem}</p>}
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor={idPrazo}>Prazo <span className="ajuda" style={{ fontWeight: 400 }}>(opcional)</span></label>
          <div role="group" aria-label="Prazo rápido" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="chips">
              {DIAS_PRAZO.map((d) => {
                const valor = prazoEmDias(d)
                const ativo = prazo === valor
                return (
                  <button key={d} type="button" className="chip" aria-pressed={ativo} onClick={() => setPrazo(ativo ? '' : valor)}>
                    {d} {d === 1 ? 'dia' : 'dias'}
                  </button>
                )
              })}
            </div>
            {prazo && (
              <button type="button" className="botao botao-discreto" onClick={() => setPrazo('')}>
                <X className="icone icone-p" aria-hidden="true" focusable="false" /> Sem prazo
              </button>
            )}
          </div>
          <input id={idPrazo} className="entrada" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} aria-describedby={`${idPrazo}-ajuda`} />
          <p className="ajuda" id={`${idPrazo}-ajuda`}>Os botões de dias preenchem a data às 18h do dia escolhido. Você pode ajustar a data e a hora no campo.</p>
        </div>

        {erro && <div className="aviso aviso-perigo" role="alert"><AlertCircle className="icone" aria-hidden="true" focusable="false" /><div>{erro}</div></div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={salvando} className="botao botao-principal">
            {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <BellRing className="icone icone-p" aria-hidden="true" focusable="false" />}
            {salvando ? 'Enviando…' : 'Enviar cobrança'}
          </button>
          <button type="button" className="botao botao-secundario" onClick={cancelar} disabled={salvando}>Cancelar</button>
        </div>
      </form>
      {modal}
    </>
  )
}
