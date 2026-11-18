import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Flag, FileText, Phone, StickyNote, Sparkles, Target, UserX, ChevronRight } from 'lucide-react'
import { getPessoa } from '@/lib/dados'
import { formatarCpf, formatarTelefone, formatarDataHora, rotuloEstagio, coresEstagio, tempoDecorrido, statusObjetivo, statusMissao, statusConversa, seloPrioridade, pareceTelefone, formatarNome } from '@/lib/utils'
import type { Evento, TipoEvento } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

const ROTULO_IDENT: Record<string, string> = {
  WHATSAPP: 'WhatsApp', TELEFONE: 'Telefone', EMAIL: 'E-mail', CPF: 'CPF', CNPJ: 'CNPJ', NIT: 'NIT',
  PIS: 'PIS', PASEP: 'PASEP', NB: 'NB', INSTAGRAM: 'Instagram', FACEBOOK: 'Facebook', TELEGRAM: 'Telegram', OUTRO: 'Outro',
}

const ROTULO_PRIORIDADE: Record<string, string> = { URGENTE: 'Urgente', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }

/** Ícone + cor (só tokens da Apple Design — auditoria T9) + nome de cada tipo de registro da linha do tempo. */
function visualEvento(tipo: TipoEvento): { Icone: typeof MessageSquare; cor: string; rotulo: string } {
  switch (tipo) {
    case 'mensagem_recebida': return { Icone: MessageSquare, cor: 'var(--sucesso)', rotulo: 'Mensagem recebida' }
    case 'mensagem_enviada': return { Icone: Send, cor: 'var(--acao)', rotulo: 'Resposta enviada' }
    case 'nota_interna': return { Icone: StickyNote, cor: 'var(--atencao)', rotulo: 'Nota interna' }
    case 'ligacao': return { Icone: Phone, cor: 'var(--acao-forte)', rotulo: 'Ligação' }
    case 'documento': return { Icone: FileText, cor: 'var(--tinta-2)', rotulo: 'Documento' }
    case 'mudanca_estagio': return { Icone: Flag, cor: 'var(--tinta)', rotulo: 'Mudança de estágio' }
    case 'life_event': return { Icone: Sparkles, cor: 'var(--atencao)', rotulo: 'Evento da vida' }
    case 'contato_criado': return { Icone: Sparkles, cor: 'var(--tinta-3)', rotulo: 'Primeiro contato' }
    default: return { Icone: Flag, cor: 'var(--tinta-3)', rotulo: 'Registro' }
  }
}

function formatarIdentificador(tipo: string, valor: string): string {
  if (tipo === 'CPF') return formatarCpf(valor)
  if (tipo === 'WHATSAPP' || tipo === 'TELEFONE') return pareceTelefone(valor) ? formatarTelefone(valor) : valor
  return valor
}

/** Duas iniciais, como no resto do sistema (auditoria P3). */
function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const a = partes[0][0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase()
}

export default async function PessoaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { pessoa, identificadores, eventos, conversas, objetivos } = await getPessoa(id)

  if (!pessoa) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
        <Link href="/dashboard/pessoas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Pessoas</Link>
        <div className="cartao" style={{ marginTop: 14 }}><div className="vazio">
          <div className="vazio-icone"><UserX className="icone" aria-hidden="true" focusable="false" /></div>
          <h1 className="vazio-titulo">Pessoa não encontrada</h1>
          <p className="vazio-texto">O cadastro pode ter sido unido a outro, ou o endereço está incompleto. Volte à lista e abra a pessoa por lá.</p>
          <Link href="/dashboard/pessoas" className="botao botao-secundario">Voltar às pessoas</Link>
        </div></div>
      </main>
    )
  }

  const est = coresEstagio(pessoa.estagio)
  const conversaAberta = conversas.find((c) => c.status !== 'FECHADA')
  const nome = formatarNome(pessoa.nome)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <Link href="/dashboard/pessoas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Pessoas</Link>

      <div className="cabeca" style={{ marginTop: 10, alignItems: 'center' }}>
        <div className="cabeca-texto" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="avatar g" aria-hidden="true">{iniciais(pessoa.nome)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="titulo" style={{ overflowWrap: 'anywhere' }}>{nome}</h1>
              <span className={`selo ${est.classe}`}>{rotuloEstagio(pessoa.estagio)}</span>
            </div>
            <p className="meta-cliente" style={{ marginTop: 4 }}>Primeiro contato: {formatarDataHora(pessoa.data_primeiro_contato)}{pessoa.responsavel_nome ? ` · Responsável: ${formatarNome(pessoa.responsavel_nome)}` : ''}</p>
          </div>
        </div>
        {conversaAberta && <Link href={`/dashboard/conversas/${conversaAberta.id}`} className="botao botao-principal">Abrir conversa</Link>}
      </div>

      {/* .processo-grade: conteúdo + coluna lateral; vira uma coluna abaixo de 1.100 px (auditoria P1). */}
      <div className="processo-grade">
        <div className="coluna">
          <section className="cartao" aria-labelledby="pessoa-objetivos">
            <div className="cartao-cabeca">
              <h2 className="cartao-titulo" id="pessoa-objetivos" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Target className="icone" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Objetivos e missões</h2>
            </div>
            <div className="cartao-corpo">
              {objetivos.length === 0 ? (
                <p className="vazio-linha">Nenhum objetivo cadastrado ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {objetivos.map((o) => {
                    const so = statusObjetivo(o.status)
                    return (
                      <div key={o.id} style={{ boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 'var(--raio-g)', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 className="sub-titulo">{o.titulo}</h3>
                          <span className={`selo ${so.classe}`}>{so.label}</span>
                          <span className={`selo ${seloPrioridade(o.prioridade)}`}>Prioridade {ROTULO_PRIORIDADE[o.prioridade] ?? o.prioridade}</span>
                          {(o.beneficio || o.servico) && (
                            <span className="selo selo-neutro">{(o.regime ?? '').replace('_', '/')}{o.beneficio?.codigo ? ` · ${o.beneficio.codigo}` : ''}{o.objeto_categoria === 'SERVICO' ? ' · serviço' : ''}</span>
                          )}
                        </div>
                        {o.descricao && <p className="texto-apoio" style={{ marginTop: 4 }}>{o.descricao}</p>}
                        {o.missoes.length > 0 && (
                          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {o.missoes.map((m) => {
                              const sm = statusMissao(m.status)
                              return (
                                <li key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', paddingLeft: 12, borderLeft: '2px solid var(--linha-forte)' }}>
                                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                                    <div style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta)', fontWeight: 600 }}>{m.titulo}</div>
                                    {m.momento && <div className="texto-apoio" style={{ marginTop: 1 }}>{m.momento}</div>}
                                    {m.dono_nome && <div className="texto-apoio" style={{ marginTop: 1 }}>Responsável: {formatarNome(m.dono_nome)}</div>}
                                  </div>
                                  <span className={`selo ${sm.classe}`}>{sm.label}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="cartao" aria-labelledby="pessoa-linha-tempo">
            <div className="cartao-cabeca"><h2 className="cartao-titulo" id="pessoa-linha-tempo">Linha do tempo</h2></div>
            <div className="cartao-corpo">
              {eventos.length === 0 ? (
                <p className="vazio-linha">Sem registros ainda. Mensagens, notas e ligações aparecem aqui, da mais recente para a mais antiga.</p>
              ) : (
                <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 4px', position: 'relative' }}>
                  {eventos.map((e: Evento, idx) => {
                    const v = visualEvento(e.tipo)
                    const Icone = v.Icone
                    const ultimo = idx === eventos.length - 1
                    return (
                      <li key={e.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--recuo-2)', color: v.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icone className="icone icone-p" aria-hidden="true" focusable="false" /></div>
                          {!ultimo && <div style={{ flex: 1, width: 2, background: 'var(--linha)', minHeight: 18 }} />}
                        </div>
                        <div style={{ paddingBottom: ultimo ? 0 : 18, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px 8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 'var(--t-meta)', fontWeight: 600, color: 'var(--tinta)' }}>{v.rotulo}</span>
                            {e.ator_nome && <span className="texto-apoio">· {formatarNome(e.ator_nome)}</span>}
                            <span className="texto-apoio">{formatarDataHora(e.ocorrido_em)}</span>
                          </div>
                          {e.conteudo && <p style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta-2)', marginTop: 3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{e.conteudo}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>

        <div className="coluna">
          <section className="cartao" aria-labelledby="pessoa-identificadores">
            <div className="cartao-cabeca"><h2 className="cartao-titulo" id="pessoa-identificadores">Identificadores</h2></div>
            <div className="cartao-corpo">
              {identificadores.length === 0 ? (
                <p className="vazio-linha">Nenhum identificador além do nome.</p>
              ) : (
                <dl className="dados" style={{ gridTemplateColumns: 'minmax(90px, 40%) 1fr' }}>
                  {identificadores.map((i) => (
                    <Fragment key={i.id}>
                      <dt>{ROTULO_IDENT[i.tipo] ?? i.tipo}{i.principal ? ' (principal)' : ''}</dt>
                      <dd style={{ overflowWrap: 'anywhere' }}>{formatarIdentificador(i.tipo, i.valor)}</dd>
                    </Fragment>
                  ))}
                </dl>
              )}
            </div>
          </section>

          <section className="cartao" aria-labelledby="pessoa-conversas">
            <div className="cartao-cabeca"><h2 className="cartao-titulo" id="pessoa-conversas">Conversas</h2></div>
            {conversas.length === 0 ? (
              <div className="cartao-corpo"><p className="vazio-linha">Nenhuma conversa com esta pessoa.</p></div>
            ) : (
              <ul className="pend-lista">
                {conversas.map((c) => {
                  const st = statusConversa(c.status)
                  return (
                    <li key={c.id}>
                      <Link href={`/dashboard/conversas/${c.id}`} className="pend-item" aria-label={`Abrir a conversa por ${c.canal}, ${st.label}`}>
                        <span style={{ minWidth: 0 }}>
                          <span className="pend-nome" style={{ display: 'block' }}>{c.canal}</span>
                          <span className="texto-apoio">{c.tempo_sem_resposta_horas != null ? `Sem resposta há ${tempoDecorrido(c.tempo_sem_resposta_horas)}` : 'Sem espera'}</span>
                        </span>
                        <span className={`selo ${st.classe}`}>{st.label}</span>
                        <ChevronRight className="icone" aria-hidden="true" focusable="false" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
