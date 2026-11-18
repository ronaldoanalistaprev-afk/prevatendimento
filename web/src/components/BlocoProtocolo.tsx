'use client'

import { useId, useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Check, Users } from 'lucide-react'
import { formatarDataHora, formatarNome } from '@/lib/utils'
import type { HistoricoProtocolo, AtMensagem } from '@/lib/dados'

function ehFinalizada(status: string | null): boolean {
  return status === 'FINALIZADO'
}

export default function BlocoProtocolo({ p, atual, espera }: { p: HistoricoProtocolo; atual: boolean; espera?: string }) {
  const [aberto, setAberto] = useState(false)
  const idMensagens = useId()
  const finalizada = ehFinalizada(p.status_multi360)
  const clienteFalouPorUltimo = p.ultima_mensagem_direcao === 'cliente'

  // Participantes da conversa (espelhados do Multi360): o responsável (principal)
  // e os demais colaboradores adicionados para acompanhar. O gestor pode entrar
  // numa conversa sem ser participante — por isso ele não aparece nesta lista.
  const participantes = p.participantes ?? []
  const responsavel = participantes.find((x) => x.principal) ?? null
  const acompanhantes = participantes.filter((x) => !x.principal)

  const ordenadas = [...p.mensagens].reverse()
  const visiveis = aberto ? ordenadas : ordenadas.slice(0, 3)
  const escondidas = ordenadas.length - visiveis.length

  return (
    <section className="cartao" aria-label={`Protocolo ${p.numero_protocolo}`} style={{ overflow: 'hidden', boxShadow: atual ? '0 0 0 1.5px var(--acao), var(--sombra-cartao)' : 'var(--sombra-cartao)' }}>
      {/* separador do protocolo */}
      <div style={{ background: 'var(--recuo)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px 10px', flexWrap: 'wrap', borderBottom: '1px solid var(--linha)' }}>
        <span className={`selo ${finalizada ? 'selo-neutro' : 'selo-sucesso'}`}>{finalizada ? 'Finalizada' : 'Aberta'}</span>
        <h2 className="sub-titulo">Protocolo {p.numero_protocolo}</h2>
        <span className="texto-apoio">{p.departamento ?? 'sem setor'} · {p.atendente_nome ? formatarNome(p.atendente_nome) : 'sem atendente'}</span>
        {atual && <span className="selo selo-acao">você abriu este</span>}
        {ordenadas.length > 3 && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="botao botao-discreto"
            aria-expanded={aberto}
            aria-controls={idMensagens}
            style={{ marginLeft: 'auto' }}
          >
            {aberto
              ? <><ChevronUp className="icone icone-p" aria-hidden="true" focusable="false" /> Mostrar só as 3 últimas</>
              : <><ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" /> Mostrar todas ({ordenadas.length})</>}
          </button>
        )}
      </div>

      {/* participantes da conversa (sempre que capturados) */}
      {participantes.length > 0 && (
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--linha)' }}>
          <Users className="icone icone-p" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
          <span className="texto-apoio">{acompanhantes.length > 0 ? 'Participantes:' : 'Responsável:'}</span>
          {responsavel && <span className="selo selo-acao" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{formatarNome(responsavel.nome)} · responsável</span>}
          {acompanhantes.map((a) => (<span key={a.nome} className="selo selo-neutro" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{formatarNome(a.nome)}</span>))}
          {!responsavel && acompanhantes.length === 0 && <span className="texto-apoio">—</span>}
        </div>
      )}

      {/* quem falou por último (cor + ícone + texto: nada só pela cor) */}
      {!finalizada && (
        <div style={{ padding: '7px 16px', fontSize: 'var(--t-meta)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: clienteFalouPorUltimo ? 'var(--atencao-suave)' : 'var(--sucesso-suave)', color: clienteFalouPorUltimo ? 'var(--atencao)' : 'var(--sucesso)', borderBottom: '1px solid var(--linha)' }}>
          {clienteFalouPorUltimo
            ? <><Clock className="icone icone-p" aria-hidden="true" focusable="false" /> O cliente falou por último — esperando resposta da equipe{espera ? ` há ${espera}` : ''}</>
            : <><Check className="icone icone-p" aria-hidden="true" focusable="false" /> A equipe respondeu por último</>}
        </div>
      )}

      {/* mensagens (mais recente primeiro): cliente à esquerda, equipe à direita */}
      <div id={idMensagens} style={{ background: 'var(--recuo-2)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ordenadas.length === 0 ? (
          <p className="vazio-linha" style={{ textAlign: 'center', margin: '16px auto' }}>Sem mensagens capturadas.</p>
        ) : (
          <>
            <p className="texto-apoio" style={{ textAlign: 'center', fontSize: 'var(--t-pequeno)', fontWeight: 600, marginBottom: 4, background: 'var(--superficie)', borderRadius: 999, padding: '3px 10px', alignSelf: 'center' }}>
              Da mensagem mais recente para a mais antiga{!aberto && escondidas > 0 ? ` · vendo as 3 últimas de ${ordenadas.length}` : ''}
            </p>
            {visiveis.map((m) => <Bolha key={m.id} m={m} />)}
            {escondidas > 0 && !aberto && (
              <button type="button" onClick={() => setAberto(true)} className="botao botao-secundario" aria-expanded={false} aria-controls={idMensagens} style={{ alignSelf: 'center', marginTop: 4 }}>
                <ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" /> Ver as {escondidas} {escondidas === 1 ? 'mensagem anterior' : 'mensagens anteriores'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function Bolha({ m }: { m: AtMensagem }) {
  const daEquipe = m.remetente_tipo === 'colaborador' || m.remetente_tipo === 'bot'
  return (
    <div style={{ alignSelf: daEquipe ? 'flex-end' : 'flex-start', maxWidth: '78%', background: daEquipe ? 'var(--acao-suave)' : 'var(--superficie)', borderRadius: 'var(--raio)', padding: '8px 12px', boxShadow: 'var(--sombra-cartao)' }}>
      <div style={{ fontSize: 'var(--t-pequeno)', fontWeight: 650, color: daEquipe ? 'var(--acao-forte)' : 'var(--atencao)', marginBottom: 2, overflowWrap: 'anywhere' }}>
        <span className="so-leitor">{daEquipe ? 'Equipe' : 'Cliente'}: </span>
        {m.remetente_nome ? formatarNome(m.remetente_nome) : daEquipe ? 'Equipe' : 'Cliente'}
      </div>
      <div style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {m.texto ?? <span style={{ color: 'var(--tinta-3)', fontStyle: 'italic' }}>{m.tem_anexo ? '[anexo]' : '[sem texto]'}</span>}
      </div>
      <div style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-2)', fontWeight: 600, textAlign: 'right', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{formatarDataHora(m.enviado_em)}</div>
    </div>
  )
}
