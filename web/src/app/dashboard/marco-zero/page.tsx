import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Flag, Send, Reply, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { getMarcoZero, ROTULO_MZ_STATUS, type MarcoZeroItem, type MarcoZeroStatus } from '@/lib/marcozero'
import { getPapelAtual } from '@/lib/papel'
import { formatarTelefone, formatarNome, formatarData } from '@/lib/utils'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { PrepararLote, CopiarLista, DesfazerLote, RemoverPessoa } from '@/components/MarcoZeroAcoes'

export const dynamic = 'force-dynamic'

const SELO: Record<MarcoZeroStatus, string> = {
  ATENDIDO: 'selo-sucesso',
  RESPONDEU: 'selo-atencao',
  AGUARDANDO_RESPOSTA: 'selo-acao',
  SEM_RESPOSTA: 'selo-neutro',
}

export default async function MarcoZeroPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  const papel = await getPapelAtual()
  if (!papel.verTudo) redirect('/dashboard/monitor')

  const sp = await searchParams
  const { itens, resumo } = await getMarcoZero()

  const loteSelecionado = Number(sp.lote) || resumo.lotes[0]?.lote || 0
  const itensDoLote = itens.filter((i) => i.lote === loteSelecionado).sort((a, b) => ordem(a.status_calc) - ordem(b.status_calc))
  const listaDisparo = itensDoLote.map((i) => `${i.cliente_nome ?? 'Cliente'} — ${i.cliente_telefone ?? 'sem telefone'}`).join('\n')

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flag className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Marco Zero
          </h1>
          <p className="subtitulo">O placar da recuperação do atendimento. Enviamos a mensagem para quem espera, em lotes; quem responde é atendido com prioridade.</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      <div className="aviso aviso-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
        <div>Cada pessoa contatada aparece aqui e muda de status sozinha conforme o Multi360: <b>Aguardando resposta</b> → <b>Respondeu (atender)</b> → <b>Atendido</b>. Quem passa de 7 dias sem responder vira <b>Sem resposta</b> (fica registrado — é a defesa documentada).</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Cartao icone={Send} cor="var(--tinta)" valor={resumo.enviados} label="contatados" />
        <Cartao icone={Reply} cor="var(--acao)" valor={resumo.responderam} label="responderam" />
        <Cartao icone={Clock} cor="var(--atencao)" valor={resumo.aguardandoAtendimento} label="responderam e faltam atender" destaque />
        <Cartao icone={CheckCircle2} cor="var(--sucesso)" valor={resumo.atendidos} label="já atendidos" />
        <Cartao icone={XCircle} cor="var(--tinta-2)" valor={resumo.semResposta} label="sem resposta (encerrados)" />
        <Cartao icone={Reply} cor="var(--acao)" valor={`${resumo.taxaResposta}%`} label="taxa de resposta" />
      </div>

      {resumo.temDados && (
        <div className={`aviso ${resumo.podeLiberarProximo ? 'aviso-info' : 'aviso-atencao'}`} style={{ marginBottom: 18, fontWeight: 600 }}>
          {resumo.podeLiberarProximo ? <CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> : <AlertTriangle className="icone" aria-hidden="true" focusable="false" />}
          <div>{resumo.podeLiberarProximo ? 'Todos os que responderam já foram atendidos. Pode liberar o próximo lote.' : `Ainda há ${resumo.aguardandoAtendimento} pessoa(s) que responderam e não foram atendidas. Atenda essas antes de enviar um novo lote.`}</div>
        </div>
      )}

      <section className="cartao" style={{ padding: '16px 18px', marginBottom: 18 }}>
        <h2 className="cartao-titulo" style={{ marginBottom: 4 }}>Preparar um novo lote</h2>
        <p className="texto-apoio" style={{ marginBottom: 12 }}>Registra as conversas <b>mais antigas que esperam</b> (uma por cliente, ainda não contatadas). Depois copie a lista e use no disparo da noite.</p>
        <PrepararLote padrao={40} />
      </section>

      {resumo.lotes.length > 0 && (
        <section className="cartao" style={{ padding: '16px 18px', marginBottom: 18 }}>
          <h2 className="cartao-titulo" style={{ marginBottom: 12 }}>Lotes</h2>
          <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
            <table className="tabela" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Lote</th><th>Enviado em</th>
                  <th style={{ textAlign: 'center' }}>Contatados</th><th style={{ textAlign: 'center' }}>Responderam</th>
                  <th style={{ textAlign: 'center' }}>Faltam atender</th><th style={{ textAlign: 'center' }}>Atendidos</th>
                  <th style={{ textAlign: 'center' }}>Sem resposta</th><th></th>
                </tr>
              </thead>
              <tbody>
                {resumo.lotes.map((l) => (
                  <tr key={l.lote}>
                    <td><Link href={`/dashboard/marco-zero?lote=${l.lote}`} style={{ fontWeight: 650, textDecoration: 'none' }}>Lote {l.lote}</Link></td>
                    <td style={{ color: 'var(--tinta-2)' }}>{l.enviado_em ? formatarData(l.enviado_em) : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{l.enviados}</td>
                    <td style={{ textAlign: 'center', color: 'var(--acao)', fontWeight: 700 }}>{l.responderam}</td>
                    <td style={{ textAlign: 'center', color: l.aguardandoAtendimento > 0 ? 'var(--atencao)' : 'var(--tinta-3)', fontWeight: l.aguardandoAtendimento > 0 ? 700 : 400 }}>{l.aguardandoAtendimento || '—'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--sucesso)', fontWeight: 700 }}>{l.atendidos || '—'}</td>
                    <td style={{ textAlign: 'center', color: 'var(--tinta-3)' }}>{l.semResposta || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{l.responderam === 0 && <DesfazerLote lote={l.lote} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {loteSelecionado > 0 && itensDoLote.length > 0 && (
        <section className="cartao" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
            <h2 className="cartao-titulo">Lote {loteSelecionado} — {itensDoLote.length} pessoas</h2>
            <div style={{ marginLeft: 'auto' }}><CopiarLista linhas={listaDisparo} quantos={itensDoLote.length} /></div>
          </div>
          <p className="texto-apoio" style={{ marginBottom: 12 }}>&ldquo;Copiar lista&rdquo; entrega nome e telefone desta leva para usar no disparo da noite.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itensDoLote.map((i) => (<Linha key={i.id} i={i} />))}
          </div>
        </section>
      )}
    </main>
  )
}

function ordem(s: MarcoZeroStatus): number {
  return { RESPONDEU: 0, AGUARDANDO_RESPOSTA: 1, ATENDIDO: 2, SEM_RESPOSTA: 3 }[s]
}

function Cartao({ icone: Icone, valor, label, cor, destaque }: { icone: typeof Send; valor: number | string; label: string; cor: string; destaque?: boolean }) {
  return (
    <div style={{ background: destaque ? 'var(--atencao-suave)' : 'var(--recuo)', borderRadius: 12, padding: '10px 12px', boxShadow: destaque ? 'inset 0 0 0 1px var(--atencao-borda)' : 'none' }}>
      <Icone className="icone icone-p" style={{ color: cor, marginBottom: 2 }} aria-hidden="true" focusable="false" />
      <div style={{ fontSize: 22, fontWeight: 650, color: cor, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
      <div style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>{label}</div>
    </div>
  )
}

function Linha({ i }: { i: MarcoZeroItem }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12, boxShadow: 'inset 0 0 0 1px var(--linha)' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <Link href={i.protocolo_link ? `/dashboard/monitor/${i.protocolo_link}` : '#'} className="sub-titulo" style={{ fontSize: 14, textDecoration: 'none' }}>{i.cliente_nome ? formatarNome(i.cliente_nome) : 'Cliente'}</Link>
        <div className="texto-apoio" style={{ marginTop: 2 }}>{formatarTelefone(i.cliente_telefone)}{i.departamento ? ` · ${i.departamento}` : ''}{i.atendente_nome ? ` · ${formatarNome(i.atendente_nome)}` : ''}</div>
      </div>
      <span className={`selo ${SELO[i.status_calc]}`}>{ROTULO_MZ_STATUS[i.status_calc]}</span>
      <RemoverPessoa id={i.id} nome={i.cliente_nome} />
      {i.protocolo_link && <Link href={`/dashboard/monitor/${i.protocolo_link}`} className="botao-icone" aria-label="Abrir conversa"><ChevronRight className="icone icone-p" aria-hidden="true" focusable="false" /></Link>}
    </div>
  )
}
