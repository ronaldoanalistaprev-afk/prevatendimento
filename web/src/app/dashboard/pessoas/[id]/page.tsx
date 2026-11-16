import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Flag, FileText, Phone, StickyNote, Sparkles, Target } from 'lucide-react'
import { getPessoa } from '@/lib/dados'
import { formatarCpf, formatarTelefone, formatarDataHora, rotuloEstagio, coresEstagio, tempoDecorrido, statusObjetivo, statusMissao, corPrioridade, pareceTelefone, formatarNome } from '@/lib/utils'
import type { Evento, TipoEvento } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

const ROTULO_IDENT: Record<string, string> = {
  WHATSAPP: 'WhatsApp', TELEFONE: 'Telefone', EMAIL: 'E-mail', CPF: 'CPF', CNPJ: 'CNPJ', NIT: 'NIT',
  PIS: 'PIS', PASEP: 'PASEP', NB: 'NB', INSTAGRAM: 'Instagram', FACEBOOK: 'Facebook', TELEGRAM: 'Telegram', OUTRO: 'Outro',
}

function visualEvento(tipo: TipoEvento): { Icone: typeof MessageSquare; cor: string; rotulo: string } {
  switch (tipo) {
    case 'mensagem_recebida': return { Icone: MessageSquare, cor: 'var(--sucesso)', rotulo: 'Mensagem recebida' }
    case 'mensagem_enviada': return { Icone: Send, cor: 'var(--acao)', rotulo: 'Resposta enviada' }
    case 'nota_interna': return { Icone: StickyNote, cor: 'var(--atencao)', rotulo: 'Nota interna' }
    case 'ligacao': return { Icone: Phone, cor: '#7E22CE', rotulo: 'Ligação' }
    case 'documento': return { Icone: FileText, cor: '#0891B2', rotulo: 'Documento' }
    case 'mudanca_estagio': return { Icone: Flag, cor: 'var(--tinta)', rotulo: 'Mudança de estágio' }
    case 'life_event': return { Icone: Sparkles, cor: '#DB2777', rotulo: 'Evento da vida' }
    case 'contato_criado': return { Icone: Sparkles, cor: 'var(--tinta-3)', rotulo: 'Primeiro contato' }
    default: return { Icone: Flag, cor: 'var(--tinta-3)', rotulo: 'Registro' }
  }
}

function formatarIdentificador(tipo: string, valor: string): string {
  if (tipo === 'CPF') return formatarCpf(valor)
  if (tipo === 'WHATSAPP' || tipo === 'TELEFONE') return pareceTelefone(valor) ? formatarTelefone(valor) : valor
  return valor
}

export default async function PessoaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { pessoa, identificadores, eventos, conversas, objetivos } = await getPessoa(id)

  if (!pessoa) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
        <Link href="/dashboard/pessoas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Voltar</Link>
        <div className="cartao" style={{ marginTop: 14 }}><div className="vazio"><p className="vazio-texto">Pessoa não encontrada.</p></div></div>
      </main>
    )
  }

  const est = coresEstagio(pessoa.estagio)
  const conversaAberta = conversas.find((c) => c.status !== 'FECHADA')

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <Link href="/dashboard/pessoas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Pessoas</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--acao-suave)', color: 'var(--acao)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>{pessoa.nome?.[0]?.toUpperCase() ?? '?'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="titulo" style={{ fontSize: 22, margin: 0, overflowWrap: 'anywhere' }}>{formatarNome(pessoa.nome)}</h1>
            <span className="selo" style={{ background: est.bg, color: est.fg }}>{rotuloEstagio(pessoa.estagio)}</span>
          </div>
          <div className="texto-apoio" style={{ marginTop: 3 }}>Primeiro contato: {formatarDataHora(pessoa.data_primeiro_contato)}{pessoa.responsavel_nome ? ` · Responsável: ${formatarNome(pessoa.responsavel_nome)}` : ''}</div>
        </div>
        {conversaAberta && <Link href={`/dashboard/conversas/${conversaAberta.id}`} className="botao botao-principal">Abrir conversa</Link>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          <section className="cartao" style={{ padding: '20px 22px' }}>
            <h2 className="cartao-titulo" style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Target className="icone" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Objetivos &amp; Missões</h2>
            {objetivos.length === 0 ? (
              <p className="texto-apoio" style={{ margin: 0 }}>Nenhum objetivo cadastrado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {objetivos.map((o) => {
                  const so = statusObjetivo(o.status)
                  return (
                    <div key={o.id} style={{ boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="sub-titulo">{o.titulo}</span>
                        <span className="selo" style={{ background: so.bg, color: so.fg }}>{so.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: corPrioridade(o.prioridade) }}>{o.prioridade}</span>
                        {(o.beneficio || o.servico) && (
                          <span className="selo selo-neutro" style={{ fontFamily: 'ui-monospace, monospace' }}>{(o.regime ?? '').replace('_', '/')}{o.beneficio?.codigo ? ` · ${o.beneficio.codigo}` : ''}{o.objeto_categoria === 'SERVICO' ? ' · serviço' : ''}</span>
                        )}
                      </div>
                      {o.descricao && <div className="texto-apoio" style={{ marginTop: 4 }}>{o.descricao}</div>}
                      {o.missoes.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                          {o.missoes.map((m) => {
                            const sm = statusMissao(m.status)
                            return (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 12, borderLeft: '2px solid var(--linha)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, color: 'var(--tinta)', fontWeight: 600 }}>{m.titulo}</div>
                                  {m.momento && <div className="texto-apoio" style={{ marginTop: 1 }}>{m.momento}</div>}
                                  {m.dono_nome && <div className="texto-apoio" style={{ marginTop: 1 }}>Responsável: {formatarNome(m.dono_nome)}</div>}
                                </div>
                                <span className="selo" style={{ background: sm.bg, color: sm.fg, whiteSpace: 'nowrap' }}>{sm.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="cartao" style={{ padding: '20px 22px' }}>
            <h2 className="cartao-titulo" style={{ margin: '0 0 18px' }}>Linha do tempo</h2>
            {eventos.length === 0 ? (
              <p className="texto-apoio">Sem eventos ainda.</p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 8 }}>
                {eventos.map((e: Evento, idx) => {
                  const v = visualEvento(e.tipo)
                  const Icone = v.Icone
                  const ultimo = idx === eventos.length - 1
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--recuo-2)', color: v.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icone className="icone icone-p" aria-hidden="true" focusable="false" /></div>
                        {!ultimo && <div style={{ flex: 1, width: 2, background: 'var(--linha)', minHeight: 18 }} />}
                      </div>
                      <div style={{ paddingBottom: ultimo ? 0 : 18, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tinta)' }}>{v.rotulo}</span>
                          {e.ator_nome && <span className="texto-apoio">· {e.ator_nome}</span>}
                          <span className="texto-apoio">{formatarDataHora(e.ocorrido_em)}</span>
                        </div>
                        {e.conteudo && <div style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 3, whiteSpace: 'pre-wrap' }}>{e.conteudo}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="cartao" style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Identificadores</h3>
            {identificadores.length === 0 ? (
              <p className="texto-apoio" style={{ margin: 0 }}>Nenhum.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {identificadores.map((i) => (
                  <div key={i.id}>
                    <div style={{ fontSize: 10.5, color: 'var(--tinta-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ROTULO_IDENT[i.tipo] ?? i.tipo}{i.principal ? ' · principal' : ''}</div>
                    <div style={{ fontSize: 14, color: 'var(--tinta)' }}>{formatarIdentificador(i.tipo, i.valor)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="cartao" style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tinta-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Conversas</h3>
            {conversas.length === 0 ? (
              <p className="texto-apoio" style={{ margin: 0 }}>Nenhuma.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conversas.map((c) => (
                  <Link key={c.id} href={`/dashboard/conversas/${c.id}`} style={{ fontSize: 13.5, color: 'var(--tinta-2)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{c.canal} · {c.status}</span>
                    <span className="texto-apoio">{tempoDecorrido(c.tempo_sem_resposta_horas)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
