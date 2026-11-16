import Link from 'next/link'
import {
  getCobrancas,
  getMinhasCobrancas,
  getMetricasCobrancas,
  ROTULO_STATUS,
  type Cobranca,
  type FiltroStatus,
} from '@/lib/cobrancas'
import { getPapelAtual } from '@/lib/papel'
import { getModelosCobranca } from '@/lib/modelos'
import { createClient } from '@/lib/supabase/server'
import { formatarTelefone, formatarDataHora, formatarNome, formatarDuracao } from '@/lib/utils'
import AcoesCobranca from '@/components/AcoesCobranca'
import NovaCobranca from '@/components/NovaCobranca'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { BellRing, AlarmClock, Check, X, Clock, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getAtendentes(): Promise<{ id: string; nome: string }[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('at_colaboradores').select('id, nome').order('nome')
    return (data ?? []) as { id: string; nome: string }[]
  } catch {
    return []
  }
}

const SITUACOES: { chave: FiltroStatus; label: string }[] = [
  { chave: 'ABERTA', label: 'A resolver' },
  { chave: 'RESOLVIDA', label: 'Resolvidas' },
  { chave: 'CANCELADA', label: 'Canceladas' },
  { chave: 'TODAS', label: 'Todas' },
]

const PERIODOS = [7, 30, 90]

function nomeCliente(c: Cobranca): string {
  return c.at_clientes?.nome ? formatarNome(c.at_clientes.nome) : 'Cliente'
}
function venceu(prazo: string | null): boolean {
  return !!prazo && new Date(prazo).getTime() < Date.now()
}
function horasLegivel(h: number | null): string {
  if (h === null) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 24) return `${Math.round(h)}h`
  const d = Math.floor(h / 24)
  const r = Math.round(h % 24)
  return r ? `${d}d ${r}h` : `${d}d`
}

export default async function CobrancasPage({ searchParams }: { searchParams: Promise<{ situacao?: string; dias?: string }> }) {
  const sp = await searchParams
  const situacao: FiltroStatus = (SITUACOES.find((s) => s.chave === sp.situacao)?.chave ?? 'ABERTA') as FiltroStatus
  const dias = PERIODOS.includes(Number(sp.dias)) ? Number(sp.dias) : 30

  const papel = await getPapelAtual()
  const supervisiona = papel.cobrar
  const souAtendente = !papel.cobrar

  const [cobrancas, metricas, atendentes, modelos] = await Promise.all([
    supervisiona ? getCobrancas(situacao) : getMinhasCobrancas(papel.atColaboradorId, situacao),
    supervisiona ? getMetricasCobrancas(dias) : Promise.resolve(null),
    supervisiona ? getAtendentes() : Promise.resolve([] as { id: string; nome: string }[]),
    supervisiona ? getModelosCobranca() : Promise.resolve([]),
  ])

  const titulo = souAtendente ? 'Minhas cobranças' : 'Painel de Cobrança'
  const subtitulo = souAtendente
    ? 'Conversas que o supervisor pediu que você responda. Marque como resolvida quando atender o cliente.'
    : 'Conversas paradas que você cobrou dos atendentes. Acompanhe até serem respondidas.'

  const href = (p: { situacao?: string; dias?: number }) => {
    const q = new URLSearchParams()
    const s = p.situacao ?? situacao
    const d = p.dias ?? dias
    if (s !== 'ABERTA') q.set('situacao', s)
    if (d !== 30) q.set('dias', String(d))
    const s2 = q.toString()
    return `/dashboard/cobrancas${s2 ? `?${s2}` : ''}`
  }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BellRing className="icone icone-g" style={{ color: 'var(--atencao)' }} aria-hidden="true" focusable="false" /> {titulo}
          </h1>
          <p className="subtitulo">{subtitulo}</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {supervisiona && (
        <div style={{ marginBottom: 18 }}>
          <NovaCobranca atendentes={atendentes} modelos={modelos.map((m) => ({ id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias }))} />
        </div>
      )}

      {/* Métricas (só para quem cobra) */}
      {supervisiona && metricas && (
        <section className="cartao" style={{ marginBottom: 18 }}>
          <div className="cartao-cabeca">
            <h2 className="cartao-titulo">O que a cobrança está produzindo</h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="texto-apoio">últimos</span>
              <div className="abas">
                {PERIODOS.map((d) => (<Link key={d} className="aba" aria-selected={d === dias} href={href({ dias: d })}>{d} dias</Link>))}
              </div>
            </div>
          </div>
          <div className="cartao-corpo">
            {!metricas.temDados ? (
              <p className="texto-apoio">Nenhuma cobrança criada nesse período. As métricas aparecem quando você começar a cobrar.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  <Cartao icone={BellRing} cor="var(--tinta)" valor={metricas.criadas} label="cobranças criadas" />
                  <Cartao icone={Check} cor="var(--sucesso)" valor={metricas.resolvidas} label="resolvidas" />
                  <Cartao icone={Clock} cor="var(--atencao)" valor={metricas.abertas} label="ainda a resolver" />
                  <Cartao icone={AlarmClock} cor="var(--perigo)" valor={metricas.atrasadas} label="com prazo vencido" />
                  <Cartao icone={X} cor="var(--tinta-2)" valor={metricas.canceladas} label="canceladas" />
                  <Cartao icone={TrendingUp} cor="var(--sucesso)" valor={`${metricas.taxaResolucao}%`} label="taxa de resolução" />
                  <Cartao icone={Clock} cor="var(--acao)" valor={horasLegivel(metricas.tempoMedioHoras)} label="tempo médio até resolver" />
                </div>

                {metricas.porAtendente.length > 0 && (
                  <div className="tabela-caixa" style={{ marginTop: 16, overflowX: 'auto' }}>
                    <table className="tabela" style={{ minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th>Atendente</th>
                          <th style={{ textAlign: 'center' }}>Cobranças</th>
                          <th style={{ textAlign: 'center' }}>Resolvidas</th>
                          <th style={{ textAlign: 'center' }}>A resolver</th>
                          <th style={{ textAlign: 'center' }}>Canceladas</th>
                          <th style={{ textAlign: 'center' }}>Prazo vencido</th>
                          <th style={{ textAlign: 'center' }}>Tempo médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.porAtendente.map((a) => (
                          <tr key={a.nome}>
                            <td className="nome" style={{ color: 'var(--tinta)' }}>{formatarNome(a.nome)}</td>
                            <td style={{ textAlign: 'center' }}>{a.criadas}</td>
                            <td style={{ textAlign: 'center', color: 'var(--sucesso)', fontWeight: 700 }}>{a.resolvidas}</td>
                            <td style={{ textAlign: 'center' }}>{a.abertas}</td>
                            <td style={{ textAlign: 'center', color: 'var(--tinta-3)' }}>{a.canceladas || '—'}</td>
                            <td style={{ textAlign: 'center', color: a.atrasadas > 0 ? 'var(--perigo)' : 'var(--tinta-3)', fontWeight: a.atrasadas > 0 ? 700 : 400 }}>{a.atrasadas || '—'}</td>
                            <td style={{ textAlign: 'center' }}>{horasLegivel(a.tempoMedioHoras)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="texto-apoio" style={{ marginTop: 8 }}>Tempo médio = da hora em que você cobrou até a cobrança ser marcada como resolvida.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Filtro de situação */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="mon-rot">Situação</span>
        <div className="abas">
          {SITUACOES.map((s) => (<Link key={s.chave} className="aba" aria-selected={s.chave === situacao} href={href({ situacao: s.chave })}>{s.label}</Link>))}
        </div>
      </div>

      {cobrancas.length === 0 ? (
        <div className="cartao"><div className="vazio" style={{ alignItems: 'center', textAlign: 'center' }}>
          <BellRing className="icone" style={{ width: 30, height: 30, color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
          <p className="vazio-texto" style={{ maxWidth: 'none' }}>
            {situacao === 'ABERTA'
              ? souAtendente ? 'Você não tem cobranças a resolver.' : 'Nenhuma cobrança a resolver no momento.'
              : `Nenhuma cobrança ${ROTULO_STATUS[situacao as 'RESOLVIDA' | 'CANCELADA']?.toLowerCase() ?? ''} por aqui.`}
          </p>
          {souAtendente && !papel.atColaboradorId && (
            <p style={{ color: 'var(--atencao)', fontSize: 13.5 }}>(Seu login ainda não está vinculado a um atendente do Multi360 — peça ao gestor para vincular.)</p>
          )}
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cobrancas.map((c) => {
            const atrasada = c.status === 'ABERTA' && venceu(c.prazo)
            const seloClasse = c.status === 'RESOLVIDA' ? 'selo-sucesso' : c.status === 'CANCELADA' ? 'selo-neutro' : atrasada ? 'selo-perigo' : 'selo-atencao'
            return (
              <section key={c.id} className="cartao" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Link href={c.protocolo_id ? `/dashboard/monitor/${c.protocolo_id}` : '#'} className="sub-titulo" style={{ textDecoration: 'none' }}>{nomeCliente(c)}</Link>
                      <span style={{ fontSize: 13, color: 'var(--tinta-3)' }}>
                        {formatarTelefone(c.at_clientes?.telefone ?? null)}{c.at_protocolos?.departamento ? ` · ${c.at_protocolos.departamento}` : ''}
                      </span>
                      <span className={`selo ${seloClasse}`}>{c.status === 'ABERTA' && atrasada ? 'A resolver · atrasada' : ROTULO_STATUS[c.status]}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--tinta)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.mensagem}</div>
                    <div className="texto-apoio" style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {!souAtendente && <span>Atendente: <b style={{ color: 'var(--tinta-2)' }}>{c.colaborador_nome ? formatarNome(c.colaborador_nome) : '—'}</b></span>}
                      <span>Por: {c.criado_por_nome ?? '—'}</span>
                      <span>Criada <b style={{ color: 'var(--tinta-2)' }}>{formatarDataHora(c.criado_em)}</b></span>
                      {c.editado_em && <span title={`Editada por ${c.editado_por_nome ?? 'alguém'}`}>(editada)</span>}
                      {c.prazo && c.status === 'ABERTA' && (
                        <span style={{ color: atrasada ? 'var(--perigo)' : 'var(--atencao)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlarmClock className="icone icone-p" aria-hidden="true" focusable="false" /> {atrasada ? 'Venceu ' : 'Prazo '}{formatarDataHora(c.prazo)}
                        </span>
                      )}
                      {c.status === 'RESOLVIDA' && c.resolvido_em && (
                        <span style={{ color: 'var(--sucesso)' }}>Resolvida em {formatarDataHora(c.resolvido_em)} · levou {formatarDuracao(c.criado_em, c.resolvido_em)}</span>
                      )}
                    </div>
                  </div>
                  <AcoesCobranca id={c.id} status={c.status} mensagem={c.mensagem} prazo={c.prazo} podeGerenciar={supervisiona} />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}

function Cartao({ icone: Icone, valor, label, cor }: { icone: typeof BellRing; valor: number | string; label: string; cor: string }) {
  return (
    <div style={{ background: 'var(--recuo)', borderRadius: 12, padding: '10px 12px' }}>
      <Icone className="icone icone-p" style={{ color: cor, marginBottom: 2 }} aria-hidden="true" focusable="false" />
      <div style={{ fontSize: 20, fontWeight: 650, color: cor, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
      <div style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{label}</div>
    </div>
  )
}
