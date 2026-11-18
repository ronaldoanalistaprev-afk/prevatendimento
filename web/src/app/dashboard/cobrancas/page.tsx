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
import { BellRing, AlarmClock, Check, X, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

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
  return c.at_clientes?.nome ? formatarNome(c.at_clientes.nome) : 'Cliente sem nome'
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

  const semVinculo = souAtendente && !papel.atColaboradorId
  const quantas = cobrancas.length === 1 ? '1 cobrança' : `${cobrancas.length.toLocaleString('pt-BR')} cobranças`

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">{titulo}</h1>
          <p className="subtitulo">{subtitulo}</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {semVinculo && (
        <div className="aviso aviso-atencao" style={{ marginBottom: 14 }}>
          <AlertTriangle className="icone" aria-hidden="true" focusable="false" />
          <span>O seu login ainda não está ligado a um atendente do Multi360, por isso as suas cobranças não aparecem. Peça ao gestor para fazer o vínculo em Colaboradores.</span>
        </div>
      )}

      {supervisiona && (
        <div style={{ marginBottom: 18 }}>
          <NovaCobranca atendentes={atendentes} modelos={modelos.map((m) => ({ id: m.id, titulo: m.titulo, texto: m.texto, prazo_dias: m.prazo_dias }))} />
        </div>
      )}

      {/* Métricas (só para quem cobra) */}
      {supervisiona && metricas && (
        <section className="cartao" style={{ marginBottom: 18 }} aria-labelledby="cob-metricas-titulo">
          <div className="cartao-cabeca">
            <h2 className="cartao-titulo" id="cob-metricas-titulo">O que a cobrança está produzindo</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="texto-apoio" id="cob-periodo-rot">Últimos</span>
              <nav className="chips" aria-labelledby="cob-periodo-rot">
                {PERIODOS.map((d) => (
                  <Link key={d} className="chip" aria-current={d === dias ? 'true' : undefined} href={href({ dias: d })}>{d} dias</Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="cartao-corpo">
            {!metricas.temDados ? (
              <p className="texto-apoio">Nenhuma cobrança criada nesse período. As métricas aparecem quando você começar a cobrar.</p>
            ) : (
              <>
                <dl className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  <Numero icone={BellRing} valor={metricas.criadas} label="Cobranças criadas" />
                  <Numero icone={Check} cor="var(--sucesso)" valor={metricas.resolvidas} label="Resolvidas" />
                  <Numero icone={Clock} cor="var(--atencao)" valor={metricas.abertas} label="Ainda a resolver" />
                  <Numero icone={AlarmClock} cor="var(--perigo)" valor={metricas.atrasadas} label="Com prazo vencido" />
                  <Numero icone={X} cor="var(--tinta-2)" valor={metricas.canceladas} label="Canceladas" />
                  <Numero icone={TrendingUp} valor={`${metricas.taxaResolucao}%`} label="Taxa de resolução" />
                  <Numero icone={Clock} valor={horasLegivel(metricas.tempoMedioHoras)} label="Tempo médio até resolver" />
                </dl>

                {metricas.porAtendente.length > 0 && (
                  <div className="tabela-caixa" style={{ marginTop: 16 }}>
                    <table className="tabela tabela-cartoes">
                      <caption className="so-leitor">Cobranças por atendente</caption>
                      <thead>
                        <tr>
                          <th scope="col">Atendente</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Cobranças</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Resolvidas</th>
                          <th scope="col" style={{ textAlign: 'center' }}>A resolver</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Canceladas</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Prazo vencido</th>
                          <th scope="col" style={{ textAlign: 'center' }}>Tempo médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.porAtendente.map((a) => (
                          <tr key={a.nome}>
                            <td className="nome" data-rotulo="Atendente" style={{ color: 'var(--tinta)' }}>{formatarNome(a.nome)}</td>
                            <td data-rotulo="Cobranças" style={{ textAlign: 'center' }}>{a.criadas}</td>
                            <td data-rotulo="Resolvidas" style={{ textAlign: 'center', color: 'var(--sucesso)', fontWeight: 700 }}>{a.resolvidas}</td>
                            <td data-rotulo="A resolver" style={{ textAlign: 'center' }}>{a.abertas}</td>
                            <td data-rotulo="Canceladas" style={{ textAlign: 'center', color: 'var(--tinta-3)' }}>{a.canceladas || '—'}</td>
                            <td data-rotulo="Prazo vencido" style={{ textAlign: 'center', color: a.atrasadas > 0 ? 'var(--perigo)' : 'var(--tinta-3)', fontWeight: a.atrasadas > 0 ? 700 : 400 }}>{a.atrasadas || '—'}</td>
                            <td data-rotulo="Tempo médio" style={{ textAlign: 'center' }}>{horasLegivel(a.tempoMedioHoras)}</td>
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

      {/* Filtro de situação e lista no mesmo cartão (referência: peça 03) */}
      <section className="cartao" aria-labelledby="cob-lista-rot">
        <div className="mon-barra">
          <span className="mon-rot" id="cob-lista-rot">Situação</span>
          <nav className="chips" aria-labelledby="cob-lista-rot">
            {SITUACOES.map((s) => (
              <Link key={s.chave} className="chip" aria-current={s.chave === situacao ? 'true' : undefined} href={href({ situacao: s.chave })}>{s.label}</Link>
            ))}
          </nav>
          {cobrancas.length > 0 && <span className="texto-apoio" style={{ marginLeft: 'auto' }}>{quantas}</span>}
        </div>

        {cobrancas.length === 0 ? (
          <div className="vazio">
            <div className="vazio-icone"><BellRing className="icone" aria-hidden="true" focusable="false" /></div>
            <p className="vazio-titulo">
              {situacao === 'ABERTA'
                ? souAtendente ? 'Você não tem cobranças a resolver.' : 'Nenhuma cobrança a resolver no momento.'
                : situacao === 'TODAS' ? 'Nenhuma cobrança por aqui.' : `Nenhuma cobrança ${ROTULO_STATUS[situacao as 'RESOLVIDA' | 'CANCELADA']?.toLowerCase() ?? ''} por aqui.`}
            </p>
            <p className="vazio-texto">
              {souAtendente
                ? 'Quando o supervisor pedir que você responda uma conversa, ela aparece aqui.'
                : 'Para cobrar um atendente, use “Nova cobrança” acima ou o botão “Cobrar atendente” dentro de uma conversa.'}
            </p>
          </div>
        ) : (
          <ul className="mon-lista">
            {cobrancas.map((c) => {
              const atrasada = c.status === 'ABERTA' && venceu(c.prazo)
              const seloClasse = c.status === 'RESOLVIDA' ? 'selo-sucesso' : c.status === 'CANCELADA' ? 'selo-neutro' : atrasada ? 'selo-perigo' : 'selo-atencao'
              const nome = nomeCliente(c)
              return (
                <li key={c.id} className="mon-item">
                  <div>
                    <div className="mon-nome-linha">
                      {c.protocolo_id
                        ? <Link href={`/dashboard/monitor/${c.protocolo_id}`} className="mon-nome">{nome}</Link>
                        : <span className="mon-nome">{nome}</span>}
                      {c.at_protocolos?.departamento && <span className="mon-dep">{c.at_protocolos.departamento}</span>}
                      <span className={`selo ${seloClasse}`}>{c.status === 'ABERTA' && atrasada ? 'A resolver · atrasada' : ROTULO_STATUS[c.status]}</span>
                    </div>
                    {c.at_clientes?.telefone && <div className="mon-meta">{formatarTelefone(c.at_clientes.telefone)}</div>}
                    <div style={{ fontSize: 'var(--t-meta)', color: 'var(--tinta)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.mensagem}</div>
                    <div className="mon-meta" style={{ marginTop: 8, gap: '4px 12px' }}>
                      {!souAtendente && <span>Atendente: <b style={{ color: 'var(--tinta-2)' }}>{c.colaborador_nome ? formatarNome(c.colaborador_nome) : '—'}</b></span>}
                      <span>Cobrada por: {c.criado_por_nome ? formatarNome(c.criado_por_nome) : '—'}</span>
                      <span>Criada em <b style={{ color: 'var(--tinta-2)' }}>{formatarDataHora(c.criado_em)}</b></span>
                      {c.editado_em && <span>Editada por {c.editado_por_nome ? formatarNome(c.editado_por_nome) : 'alguém'} em {formatarDataHora(c.editado_em)}</span>}
                      {c.prazo && c.status === 'ABERTA' && (
                        <span style={{ color: atrasada ? 'var(--perigo)' : 'var(--atencao)', fontWeight: 700 }}>
                          <AlarmClock className="icone" aria-hidden="true" focusable="false" /> {atrasada ? 'Prazo venceu em ' : 'Prazo: '}{formatarDataHora(c.prazo)}
                        </span>
                      )}
                      {c.status === 'RESOLVIDA' && c.resolvido_em && (
                        <span style={{ color: 'var(--sucesso)' }}>Resolvida em {formatarDataHora(c.resolvido_em)} · levou {formatarDuracao(c.criado_em, c.resolvido_em)}</span>
                      )}
                    </div>
                  </div>
                  <div className="mon-dir">
                    <AcoesCobranca id={c.id} status={c.status} mensagem={c.mensagem} prazo={c.prazo} podeGerenciar={supervisiona} cliente={nome} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

/** Cartão de número da referência (.mon-num), dentro de .grade-numeros. */
function Numero({ icone: Icone, valor, label, cor }: { icone: typeof BellRing; valor: number | string; label: string; cor?: string }) {
  return (
    <div className="mon-num" style={{ background: 'var(--recuo)', boxShadow: 'none' }}>
      <dt><Icone className="icone" style={cor ? { color: cor } : undefined} aria-hidden="true" focusable="false" />{label}</dt>
      <dd style={cor ? { color: cor } : undefined}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</dd>
    </div>
  )
}
