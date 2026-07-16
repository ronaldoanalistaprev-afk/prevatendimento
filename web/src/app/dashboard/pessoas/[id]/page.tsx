import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Flag, FileText, Phone, StickyNote, Sparkles } from 'lucide-react'
import { getPessoa } from '@/lib/dados'
import {
  formatarCpf,
  formatarTelefone,
  formatarDataHora,
  rotuloEstagio,
  coresEstagio,
  tempoDecorrido,
  statusObjetivo,
  statusMissao,
  corPrioridade,
  pareceTelefone,
} from '@/lib/utils'
import type { Evento, TipoEvento } from '@/lib/tipos'
import { Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ROTULO_IDENT: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEFONE: 'Telefone',
  EMAIL: 'E-mail',
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  NIT: 'NIT',
  PIS: 'PIS',
  PASEP: 'PASEP',
  NB: 'NB',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TELEGRAM: 'Telegram',
  OUTRO: 'Outro',
}

function visualEvento(tipo: TipoEvento): { Icone: typeof MessageSquare; cor: string; rotulo: string } {
  switch (tipo) {
    case 'mensagem_recebida':
      return { Icone: MessageSquare, cor: '#16A34A', rotulo: 'Mensagem recebida' }
    case 'mensagem_enviada':
      return { Icone: Send, cor: '#4B7BA6', rotulo: 'Resposta enviada' }
    case 'nota_interna':
      return { Icone: StickyNote, cor: '#A16207', rotulo: 'Nota interna' }
    case 'ligacao':
      return { Icone: Phone, cor: '#7E22CE', rotulo: 'Ligação' }
    case 'documento':
      return { Icone: FileText, cor: '#0891B2', rotulo: 'Documento' }
    case 'mudanca_estagio':
      return { Icone: Flag, cor: '#1A3C5A', rotulo: 'Mudança de estágio' }
    case 'life_event':
      return { Icone: Sparkles, cor: '#DB2777', rotulo: 'Evento da vida' }
    case 'contato_criado':
      return { Icone: Sparkles, cor: '#64748B', rotulo: 'Primeiro contato' }
    default:
      return { Icone: Flag, cor: '#94A3B8', rotulo: 'Registro' }
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
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <Link href="/dashboard/pessoas" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Voltar
        </Link>
        <div style={{ marginTop: 20, padding: 40, textAlign: 'center', color: '#9CA3AF', background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7' }}>
          Pessoa não encontrada.
        </div>
      </div>
    )
  }

  const est = coresEstagio(pessoa.estagio)
  const conversaAberta = conversas.find((c) => c.status !== 'FECHADA')

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/dashboard/pessoas" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Pessoas
      </Link>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>
          {pessoa.nome?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3C5A', margin: 0 }}>{pessoa.nome}</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: est.bg, color: est.fg }}>
              {rotuloEstagio(pessoa.estagio)}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
            Primeiro contato: {formatarDataHora(pessoa.data_primeiro_contato)}
            {pessoa.responsavel_nome ? ` · Responsável: ${pessoa.responsavel_nome}` : ''}
          </div>
        </div>
        {conversaAberta && (
          <Link
            href={`/dashboard/conversas/${conversaAberta.id}`}
            style={{ background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: 13.5, padding: '10px 16px', borderRadius: 12, textDecoration: 'none' }}
          >
            Abrir conversa
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 20, alignItems: 'start' }}>
        {/* Coluna principal: objetivos + linha do tempo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

        {/* Objetivos & Missões */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} style={{ color: '#16A34A' }} /> Objetivos &amp; Missões
          </h2>
          {objetivos.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>Nenhum objetivo cadastrado ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {objetivos.map((o) => {
                const so = statusObjetivo(o.status)
                return (
                  <div key={o.id} style={{ border: '1px solid #EEF2F7', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14.5 }}>{o.titulo}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: so.bg, color: so.fg }}>{so.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: corPrioridade(o.prioridade) }}>{o.prioridade}</span>
                      {(o.beneficio || o.servico) && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#EEF2F7', color: '#475569', fontFamily: 'ui-monospace, monospace' }}>
                          {(o.regime ?? '').replace('_', '/')}
                          {o.beneficio?.codigo ? ` · ${o.beneficio.codigo}` : ''}
                          {o.objeto_categoria === 'SERVICO' ? ' · serviço' : ''}
                        </span>
                      )}
                    </div>
                    {o.descricao && <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4 }}>{o.descricao}</div>}
                    {o.missoes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        {o.missoes.map((m) => {
                          const sm = statusMissao(m.status)
                          return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 12, borderLeft: '2px solid #EEF2F7' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, color: '#1A3C5A', fontWeight: 600 }}>{m.titulo}</div>
                                {m.momento && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{m.momento}</div>}
                                {m.dono_nome && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Responsável: {m.dono_nome}</div>}
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sm.bg, color: sm.fg, whiteSpace: 'nowrap' }}>{sm.label}</span>
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
        </div>

        {/* Linha do tempo */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A', margin: '0 0 18px' }}>
            Linha do tempo
          </h2>

          {eventos.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Sem eventos ainda.</p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 8 }}>
              {eventos.map((e: Evento, idx) => {
                const v = visualEvento(e.tipo)
                const Icone = v.Icone
                const ultimo = idx === eventos.length - 1
                return (
                  <div key={e.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                    {/* rail */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${v.cor}1A`, color: v.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icone size={15} />
                      </div>
                      {!ultimo && <div style={{ flex: 1, width: 2, background: '#EEF2F7', minHeight: 18 }} />}
                    </div>
                    {/* conteúdo */}
                    <div style={{ paddingBottom: ultimo ? 0 : 18, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A3C5A' }}>{v.rotulo}</span>
                        {e.ator_nome && <span style={{ fontSize: 12, color: '#6B7280' }}>· {e.ator_nome}</span>}
                        <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{formatarDataHora(e.ocorrido_em)}</span>
                      </div>
                      {e.conteudo && (
                        <div style={{ fontSize: 13.5, color: '#374151', marginTop: 3, whiteSpace: 'pre-wrap' }}>{e.conteudo}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </div>

        {/* Coluna lateral: identificadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
              Identificadores
            </h3>
            {identificadores.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Nenhum.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {identificadores.map((i) => (
                  <div key={i.id}>
                    <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {ROTULO_IDENT[i.tipo] ?? i.tipo}
                      {i.principal ? ' · principal' : ''}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#1A3C5A' }}>{formatarIdentificador(i.tipo, i.valor)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
              Conversas
            </h3>
            {conversas.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Nenhuma.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conversas.map((c) => (
                  <Link key={c.id} href={`/dashboard/conversas/${c.id}`} style={{ fontSize: 13, color: '#374151', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{c.canal} · {c.status}</span>
                    <span style={{ color: '#9CA3AF' }}>{tempoDecorrido(c.tempo_sem_resposta_horas)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
