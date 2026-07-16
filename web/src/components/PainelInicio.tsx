import Link from 'next/link'
import { AlarmClock, Clock, Archive, ChevronRight, TrendingDown, TrendingUp, Minus, UserPlus, BellRing, Users } from 'lucide-react'
import type { DadosInicio, MesMetrica } from '@/lib/inicio'
import { formatarNome, formatarDataHora, formatarDuracao } from '@/lib/utils'

/** Mês "07/2026" a partir de "2026-07-01". */
function rotuloMes(competencia: string): string {
  const [ano, mes] = competencia.split('-')
  return `${mes}/${ano}`
}

/** "07/26" — cabe embaixo da barra quando são 12 meses. */
function rotuloMesCurto(competencia: string): string {
  const [ano, mes] = competencia.split('-')
  return `${mes}/${ano.slice(2)}`
}

/** 20.3 -> "20 min" ; 95 -> "1h 35min" */
function minutosLegivel(min: number | null): string {
  if (min === null) return '—'
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const r = Math.round(min % 60)
  return r ? `${h}h ${r}min` : `${h}h`
}

const CARTAO: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #EEF2F7',
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px',
}

export default function Painel({ dados, nome }: { dados: DadosInicio; nome: string | null }) {
  const { uso, meses } = dados

  // O mês corrente ainda está correndo: ele aparece no gráfico, mas não serve
  // de conclusão. A comparação usa o último mês FECHADO contra o mês mais antigo
  // do próprio gráfico — assim a frase e as barras contam a MESMA história
  // (escolher outra janela é escolher a conclusão).
  const mesCorrente = rotuloMes(new Date().toISOString().slice(0, 10))
  const fechados = meses.filter((m) => rotuloMes(m.competencia) !== mesCorrente)
  const atual = fechados[fechados.length - 1] ?? null
  const anterior = fechados.length > 1 ? fechados[0] : null
  const delta = atual?.pct_resposta_24h != null && anterior?.pct_resposta_24h != null
    ? Number(atual.pct_resposta_24h) - Number(anterior.pct_resposta_24h)
    : null

  const pendentes: { chave: string; titulo: string; texto: string; acao: string; href: string }[] = []
  if (uso.pessoasComAcesso === 0) {
    pendentes.push({
      chave: 'acessos',
      titulo: 'A equipe ainda não entrou no sistema',
      texto: 'Você é o único com acesso. Os atendentes aparecem pelo nome porque vêm do Multi360 — mas nenhum deles tem login.',
      acao: 'Criar acesso para a equipe',
      href: '/dashboard/colaboradores',
    })
  }
  if (!uso.temSupervisorOuGestor) {
    pendentes.push({
      chave: 'papeis',
      titulo: 'Sem supervisor nem gestor cadastrados',
      texto: 'Não há ninguém com esses papéis além de você. A pergunta "eles estão resolvendo o que foi apontado?" só tem resposta depois disso.',
      acao: 'Cadastrar pessoas',
      href: '/dashboard/colaboradores',
    })
  }
  if (uso.cobrancasCriadas === 0) {
    pendentes.push({
      chave: 'cobrancas',
      titulo: 'Ninguém foi cobrado ainda',
      texto: 'Nenhuma cobrança foi criada. Sem cobrança, não dá para saber se apontar o problema faz o atendente responder.',
      acao: 'Ver quem está esperando',
      href: '/dashboard/auditoria',
    })
  }

  return (
    <>
      {/* ===== A) Precisa de você agora ===== */}
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A' }}>Precisa de você agora</h2>
        <p style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>
          De {dados.conversasAbertas} conversas abertas, estas exigem uma decisão.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
        <CartaoAcao
          icone={AlarmClock}
          cor="#C2410C"
          valor={dados.paraResolverAgora}
          titulo="Sem resposta há +24h"
          texto="clientes dos últimos 60 dias — clique para resolver"
          href="/dashboard/auditoria"
        />
        <CartaoAcao
          icone={Clock}
          cor="#B45309"
          valor={dados.aguardando1oAtendimento}
          titulo="Aguardando 1º atendimento"
          texto="cliente na fila que ninguém pegou"
          href="/dashboard/monitor?so=pendentes"
        />
        <CartaoAcao
          icone={Archive}
          cor="#64748B"
          valor={dados.filaAntiga}
          titulo="Fila antiga (esquecidos)"
          texto="parados há mais de 60 dias"
          href="/dashboard/auditoria?antigos=1"
        />
      </div>

      {dados.maisAntigos.length > 0 && (
        <div style={{ ...CARTAO, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5A', marginBottom: 10 }}>Quem espera há mais tempo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dados.maisAntigos.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/monitor/${a.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10,
                  textDecoration: 'none', borderTop: '1px solid #F8FAFC',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1A3C5A', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.cliente_nome ? formatarNome(a.cliente_nome) : 'Cliente'}
                    {a.departamento && <span style={{ color: '#9CA3AF', fontWeight: 400 }}> · {a.departamento}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>
                    Cliente falou em <b style={{ color: '#1A3C5A' }}>{formatarDataHora(a.cliente_respondeu_em)}</b>
                    {a.atendente_nome ? ` · ${formatarNome(a.atendente_nome)}` : ' · sem atendente'}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap' }}>
                  parado há {formatarDuracao(a.cliente_respondeu_em)}
                </span>
                <ChevronRight size={15} style={{ color: '#CBD5E1', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Link href="/dashboard/auditoria" style={{ fontSize: 12.5, color: '#4B7BA6', textDecoration: 'none', fontWeight: 600 }}>
              Ver os {dados.paraResolverAgora} na Auditoria →
            </Link>
          </div>
        </div>
      )}

      {/* ===== B) Estamos respondendo? ===== */}
      {meses.length > 0 && (
        <div style={{ ...CARTAO, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5A', marginBottom: 6 }}>Estamos respondendo os clientes?</div>
          <Veredito delta={delta} atual={atual} anterior={anterior} />
          <Barras meses={meses} />
          <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 10, lineHeight: 1.5 }}>
            Cada barra é um mês. A parte <b style={{ color: '#6B7280' }}>colorida</b> é a fatia dos clientes que falaram e
            tiveram resposta em até 24 horas; a parte <b style={{ color: '#94A3B8' }}>cinza</b> em cima é o cliente que
            ficou sem resposta. A barra cheia seria 100%. O último mês ainda está correndo.
            <br />
            Quando sua equipe responde, ela responde rápido — o tempo mais comum é de{' '}
            <b>{minutosLegivel(atual?.mediana_min != null ? Number(atual.mediana_min) : null)}</b>. O problema não é
            demora: é o cliente que nunca recebe resposta.
          </div>
        </div>
      )}

      {/* ===== C) O sistema está sendo usado? ===== */}
      {pendentes.length > 0 && (
        <div style={CARTAO}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5A' }}>O sistema está sendo usado?</div>
          <p style={{ fontSize: 12.5, color: '#9CA3AF', margin: '4px 0 12px' }}>
            Estas medidas só existem quando a equipe usar o sistema. Hoje elas ainda não podem ser respondidas — e é isso
            que a tela está te dizendo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendentes.map((p) => (
              <div key={p.chave} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #CBD5E1', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: '#475569', fontSize: 13.5 }}>{p.titulo}</div>
                  <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2, lineHeight: 1.5 }}>{p.texto}</div>
                </div>
                <Link
                  href={p.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 10,
                    border: '1px solid #DCE6EF', background: '#fff', color: '#1A3C5A', fontWeight: 700, fontSize: 12.5, textDecoration: 'none',
                  }}
                >
                  {p.chave === 'cobrancas' ? <BellRing size={14} /> : p.chave === 'papeis' ? <Users size={14} /> : <UserPlus size={14} />}
                  {p.acao}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendentes.length === 0 && (
        <div style={CARTAO}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A3C5A', marginBottom: 8 }}>O sistema está sendo usado</div>
          <div style={{ fontSize: 13, color: '#374151' }}>
            {uso.pessoasComAcesso} pessoas com acesso · {uso.cobrancasCriadas} cobranças criadas ·{' '}
            {uso.cobrancasResolvidas} resolvidas.{' '}
            <Link href="/dashboard/cobrancas" style={{ color: '#4B7BA6', fontWeight: 600, textDecoration: 'none' }}>
              Ver o painel de cobrança →
            </Link>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 14, textAlign: 'center' }}>
        {dados.conversasAbertas} conversas abertas espelhadas do Multi360.
      </div>
      {nome && <span style={{ display: 'none' }}>{nome}</span>}
    </>
  )
}

/**
 * A frase vem antes do gráfico: é ela que se lê em 2 segundos.
 * Primeiro o TAMANHO do problema (quantos clientes ficam sem resposta), depois a
 * comparação — porque "estável" em 65% não é boa notícia, e um veredito de
 * tendência sozinho esconderia isso.
 */
function Veredito({ delta, atual, anterior }: { delta: number | null; atual: MesMetrica | null; anterior: MesMetrica | null }) {
  if (!atual || atual.pct_resposta_24h == null) {
    return <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>Ainda não há meses fechados para comparar.</div>
  }
  const pct = Number(atual.pct_resposta_24h)
  const semResposta = 100 - pct
  // "1 em cada 3" é mais concreto que "34%" para quem lê rápido.
  const emCada = semResposta > 0 ? Math.max(2, Math.round(100 / semResposta)) : 0
  const grave = pct < 75

  const melhorou = delta !== null && delta > 2
  const piorou = delta !== null && delta < -2
  const Icone = melhorou ? TrendingUp : piorou ? TrendingDown : Minus
  const corTend = melhorou ? '#15803D' : piorou ? '#B91C1C' : '#B45309'

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: grave ? '#B91C1C' : '#15803D', fontWeight: 700, fontSize: 16 }}>
        {emCada > 0 ? `1 em cada ${emCada} clientes fica sem resposta em 24 horas.` : 'Todos os clientes tiveram resposta em 24 horas.'}
      </div>
      <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
        Em <b>{rotuloMes(atual.competencia)}</b> (último mês fechado), <b>{pct.toFixed(0)}%</b> dos clientes que falaram
        tiveram resposta em até 24 horas.
        {delta !== null && anterior && (
          <>
            {' '}
            <span style={{ color: corTend, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icone size={14} />
              {melhorou ? 'Melhorou' : piorou ? 'Piorou' : 'Praticamente igual a'} {Math.abs(delta) >= 1 ? `${Math.abs(delta).toFixed(0)} pontos` : ''} desde{' '}
              {rotuloMes(anterior.competencia)}
            </span>
            {' '}(quando eram {Number(anterior.pct_resposta_24h ?? 0).toFixed(0)}%).
          </>
        )}
      </div>
    </div>
  )
}

/** Barras em CSS puro: maior = melhor (fatia respondida em 24h). */
function Barras({ meses }: { meses: MesMetrica[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110, padding: '0 2px' }}>
      {meses.map((m) => {
        const pct = m.pct_resposta_24h != null ? Number(m.pct_resposta_24h) : 0
        const bom = pct >= 75
        const ruim = pct < 65
        return (
          <div key={m.competencia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 9.5, color: '#6B7280', fontWeight: 700 }}>{pct.toFixed(0)}</div>
            <div style={{ width: '100%', height: 70, background: '#F1F5F9', borderRadius: 6, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              <div
                title={`${rotuloMes(m.competencia)}: ${pct.toFixed(0)}% respondidos em 24h · ${m.rodadas} clientes falaram · ${m.rodadas_sem_resposta} nunca tiveram resposta`}
                style={{
                  width: '100%',
                  height: `${Math.max(3, pct)}%`,
                  background: bom ? '#16A34A' : ruim ? '#DC2626' : '#F59E0B',
                  borderRadius: 6,
                }}
              />
            </div>
            <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>{rotuloMesCurto(m.competencia)}</div>
          </div>
        )
      })}
    </div>
  )
}

function CartaoAcao({
  icone: Icone,
  cor,
  valor,
  titulo,
  texto,
  href,
}: {
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  cor: string
  valor: number
  titulo: string
  texto: string
  href: string
}) {
  return (
    <Link href={href} style={{ ...CARTAO, borderLeft: `4px solid ${cor}`, textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: cor, fontSize: 12.5, fontWeight: 700 }}>
        <Icone size={15} /> {titulo}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: cor, lineHeight: 1.15, marginTop: 4 }}>{valor}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{texto}</div>
    </Link>
  )
}
