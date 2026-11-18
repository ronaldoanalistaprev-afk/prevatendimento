import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Send, Reply, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight, Percent } from 'lucide-react'
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

const pessoas = (n: number) => (n === 1 ? '1 pessoa' : `${n.toLocaleString('pt-BR')} pessoas`)

export default async function MarcoZeroPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  const papel = await getPapelAtual()
  if (!papel.verTudo) redirect('/dashboard/monitor')

  const sp = await searchParams
  const { itens, resumo } = await getMarcoZero()

  const loteSelecionado = Number(sp.lote) || resumo.lotes[0]?.lote || 0
  const itensDoLote = itens.filter((i) => i.lote === loteSelecionado).sort((a, b) => ordem(a.status_calc) - ordem(b.status_calc))
  const listaDisparo = itensDoLote.map((i) => `${i.cliente_nome ?? 'Cliente'} — ${i.cliente_telefone ?? 'sem telefone'}`).join('\n')
  const faltam = resumo.aguardandoAtendimento

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Marco Zero</h1>
          <p className="subtitulo">O placar da recuperação do atendimento. Enviamos a mensagem para quem espera, em lotes; quem responde é atendido com prioridade.</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      <div className="aviso aviso-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
        <div>Cada pessoa contatada aparece aqui e muda de situação sozinha conforme o Multi360: <b>Aguardando resposta</b> → <b>Respondeu (atender)</b> → <b>Atendido</b>. Quem passa de 7 dias sem responder vira <b>Sem resposta</b> (fica registrado — é a defesa documentada).</div>
      </div>

      <dl className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 14 }}>
        <Numero icone={Send} valor={resumo.enviados} label="Contatados" />
        <Numero icone={Reply} cor="var(--acao)" valor={resumo.responderam} label="Responderam" />
        <Numero icone={Clock} cor="var(--atencao)" valor={faltam} label="Responderam e faltam atender" destaque={faltam > 0} />
        <Numero icone={CheckCircle2} cor="var(--sucesso)" valor={resumo.atendidos} label="Já atendidos" />
        <Numero icone={XCircle} cor="var(--tinta-2)" valor={resumo.semResposta} label="Sem resposta (encerrados)" />
        <Numero icone={Percent} cor="var(--acao)" valor={`${resumo.taxaResposta}%`} label="Taxa de resposta" />
      </dl>

      {resumo.temDados && (
        <div className={`aviso ${resumo.podeLiberarProximo ? 'aviso-info' : 'aviso-atencao'}`} style={{ marginBottom: 18, fontWeight: 600 }}>
          {resumo.podeLiberarProximo ? <CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> : <AlertTriangle className="icone" aria-hidden="true" focusable="false" />}
          <div>
            {resumo.podeLiberarProximo
              ? 'Todos os que responderam já foram atendidos. Pode liberar o próximo lote.'
              : `Ainda ${faltam === 1 ? 'há 1 pessoa que respondeu e não foi atendida' : `há ${faltam.toLocaleString('pt-BR')} pessoas que responderam e não foram atendidas`}. Atenda ${faltam === 1 ? 'essa pessoa' : 'essas pessoas'} antes de enviar um novo lote.`}
          </div>
        </div>
      )}

      <section className="cartao" style={{ padding: '16px 18px', marginBottom: 18 }} aria-labelledby="mz-preparar">
        <h2 className="cartao-titulo" id="mz-preparar" style={{ marginBottom: 4 }}>Preparar um novo lote</h2>
        <p className="texto-apoio" style={{ marginBottom: 12 }}>Registra as conversas <b>mais antigas que esperam</b> (uma por cliente, ainda não contatadas). Depois copie a lista e use no disparo da noite.</p>
        <PrepararLote padrao={40} />
      </section>

      {resumo.lotes.length > 0 && (
        <section className="cartao" style={{ marginBottom: 18 }} aria-labelledby="mz-lotes">
          <div className="cartao-cabeca"><h2 className="cartao-titulo" id="mz-lotes">Lotes</h2></div>
          <div className="tabela-caixa">
            <table className="tabela tabela-cartoes">
              <caption className="so-leitor">Lotes do Marco Zero</caption>
              <thead>
                <tr>
                  <th scope="col">Lote</th><th scope="col">Enviado em</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Contatados</th><th scope="col" style={{ textAlign: 'center' }}>Responderam</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Faltam atender</th><th scope="col" style={{ textAlign: 'center' }}>Atendidos</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Sem resposta</th><th scope="col" className="acoes"><span className="so-leitor">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {resumo.lotes.map((l) => (
                  <tr key={l.lote}>
                    <td className="nome" data-rotulo="Lote">
                      <Link href={`/dashboard/marco-zero?lote=${l.lote}`} aria-current={l.lote === loteSelecionado ? 'true' : undefined} style={{ fontWeight: 650 }}>
                        Lote {l.lote}{l.lote === loteSelecionado ? <span className="texto-apoio" style={{ fontWeight: 500 }}> · aberto abaixo</span> : null}
                      </Link>
                    </td>
                    <td data-rotulo="Enviado em" style={{ color: 'var(--tinta-2)' }}>{l.enviado_em ? formatarData(l.enviado_em) : '—'}</td>
                    <td data-rotulo="Contatados" style={{ textAlign: 'center' }}>{l.enviados}</td>
                    <td data-rotulo="Responderam" style={{ textAlign: 'center', color: 'var(--acao)', fontWeight: 700 }}>{l.responderam}</td>
                    <td data-rotulo="Faltam atender" style={{ textAlign: 'center', color: l.aguardandoAtendimento > 0 ? 'var(--atencao)' : 'var(--tinta-3)', fontWeight: l.aguardandoAtendimento > 0 ? 700 : 400 }}>{l.aguardandoAtendimento || '—'}</td>
                    <td data-rotulo="Atendidos" style={{ textAlign: 'center', color: 'var(--sucesso)', fontWeight: 700 }}>{l.atendidos || '—'}</td>
                    <td data-rotulo="Sem resposta" style={{ textAlign: 'center', color: 'var(--tinta-3)' }}>{l.semResposta || '—'}</td>
                    <td className="acoes" data-rotulo="Ações" style={{ textAlign: 'right' }}>{l.responderam === 0 && <DesfazerLote lote={l.lote} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {loteSelecionado > 0 && itensDoLote.length > 0 && (
        <section className="cartao" aria-labelledby="mz-lote-aberto">
          <div className="cartao-cabeca">
            <h2 className="cartao-titulo" id="mz-lote-aberto">Lote {loteSelecionado} — {pessoas(itensDoLote.length)}</h2>
            <CopiarLista linhas={listaDisparo} quantos={itensDoLote.length} />
          </div>
          <p className="texto-apoio" style={{ padding: '0 16px 10px' }}>&ldquo;Copiar lista&rdquo; entrega nome e telefone desta leva para usar no disparo da noite.</p>
          <ul className="mon-lista">
            {itensDoLote.map((i) => (<Linha key={i.id} i={i} />))}
          </ul>
        </section>
      )}
    </main>
  )
}

function ordem(s: MarcoZeroStatus): number {
  return { RESPONDEU: 0, AGUARDANDO_RESPOSTA: 1, ATENDIDO: 2, SEM_RESPOSTA: 3 }[s]
}

/** Cartão de número da referência (.mon-num), dentro de .grade-numeros. */
function Numero({ icone: Icone, valor, label, cor, destaque }: { icone: typeof Send; valor: number | string; label: string; cor?: string; destaque?: boolean }) {
  return (
    <div className="mon-num" style={destaque ? { background: 'var(--atencao-suave)', boxShadow: 'inset 0 0 0 1px var(--atencao-borda)' } : undefined}>
      <dt><Icone className="icone" style={cor ? { color: cor } : undefined} aria-hidden="true" focusable="false" />{label}</dt>
      <dd style={cor ? { color: cor } : undefined}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</dd>
      {destaque && <div className="pista" style={{ color: 'var(--atencao)', fontWeight: 600 }}>atenda antes do próximo lote</div>}
    </div>
  )
}

function Linha({ i }: { i: MarcoZeroItem }) {
  const nome = i.cliente_nome ? formatarNome(i.cliente_nome) : 'Cliente sem nome'
  return (
    <li className="mon-item">
      <div>
        <div className="mon-nome-linha">
          {i.protocolo_link
            ? <Link href={`/dashboard/monitor/${i.protocolo_link}`} className="mon-nome">{nome}</Link>
            : <span className="mon-nome">{nome}</span>}
          {i.departamento && <span className="mon-dep">{i.departamento}</span>}
        </div>
        <div className="mon-meta">{formatarTelefone(i.cliente_telefone)}{i.atendente_nome ? ` · Atendente: ${formatarNome(i.atendente_nome)}` : ''}</div>
      </div>
      <div className="mon-dir">
        <span className={`selo ${SELO[i.status_calc]}`}>{ROTULO_MZ_STATUS[i.status_calc]}</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <RemoverPessoa id={i.id} nome={i.cliente_nome} />
          {i.protocolo_link && (
            <Link href={`/dashboard/monitor/${i.protocolo_link}`} className="mon-abrir" style={{ minHeight: 'var(--alvo)' }}>
              Abrir<span className="so-leitor"> a conversa de {nome}</span> <ChevronRight className="icone" aria-hidden="true" focusable="false" />
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
