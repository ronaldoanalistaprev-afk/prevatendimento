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

export default function Painel({ dados, nome }: { dados: DadosInicio; nome: string | null }) {
  const { uso, meses } = dados

  // O mês corrente ainda está correndo: aparece no gráfico, mas não serve de
  // conclusão. A comparação usa o último mês FECHADO contra o mais antigo do
  // próprio gráfico — assim a frase e as barras contam a MESMA história.
  const mesCorrente = rotuloMes(new Date().toISOString().slice(0, 10))
  const fechados = meses.filter((m) => rotuloMes(m.competencia) !== mesCorrente)
  const atual = fechados[fechados.length - 1] ?? null
  const anterior = fechados.length > 1 ? fechados[0] : null
  const delta = atual?.pct_resposta_24h != null && anterior?.pct_resposta_24h != null
    ? Number(atual.pct_resposta_24h) - Number(anterior.pct_resposta_24h)
    : null

  const pendentes: { chave: string; titulo: string; texto: string; acao: string; href: string }[] = []
  if (uso.pessoasComAcesso === 0) {
    pendentes.push({ chave: 'acessos', titulo: 'A equipe ainda não entrou no sistema', texto: 'Você é o único com acesso. Os atendentes aparecem pelo nome porque vêm do Multi360 — mas nenhum deles tem login.', acao: 'Criar acesso para a equipe', href: '/dashboard/colaboradores' })
  }
  if (!uso.temSupervisorOuGestor) {
    pendentes.push({ chave: 'papeis', titulo: 'Sem supervisor nem gestor cadastrados', texto: 'Não há ninguém com esses papéis além de você. A pergunta "eles estão resolvendo o que foi apontado?" só tem resposta depois disso.', acao: 'Cadastrar pessoas', href: '/dashboard/colaboradores' })
  }
  if (uso.cobrancasCriadas === 0) {
    pendentes.push({ chave: 'cobrancas', titulo: 'Ninguém foi cobrado ainda', texto: 'Nenhuma cobrança foi criada. Sem cobrança, não dá para saber se apontar o problema faz o atendente responder.', acao: 'Ver quem está esperando', href: '/dashboard/auditoria' })
  }

  return (
    <>
      {/* ===== A) Precisa de você agora ===== */}
      <div>
        <h2 className="ini-secao-titulo">Precisa de você agora</h2>
        <p className="ini-secao-sub">De {dados.conversasAbertas.toLocaleString('pt-BR')} conversas abertas, estas exigem uma decisão.</p>
      </div>

      <div className="ini-acoes">
        <CartaoAcao variante="perigo" icone={AlarmClock} valor={dados.paraResolverAgora} titulo="Sem resposta há +24h" texto="clientes dos últimos 60 dias — clique para resolver" href="/dashboard/auditoria" />
        <CartaoAcao variante="atencao" icone={Clock} valor={dados.escritorioPrecisaResponder} titulo="Escritório precisa responder" texto="todas em que o cliente falou por último" href="/dashboard/monitor?so=esperando&periodo=tudo" />
        <CartaoAcao variante="neutro" icone={Archive} valor={dados.filaAntiga} titulo="Fila antiga (esquecidos)" texto="parados há mais de 60 dias" href="/dashboard/auditoria?antigos=1" />
      </div>

      {dados.maisAntigos.length > 0 && (
        <section className="cartao" style={{ marginBottom: 18 }}>
          <div className="cartao-cabeca"><h2 className="cartao-titulo">Quem espera há mais tempo</h2></div>
          <div className="cartao-corpo">
            <ul className="ini-espera">
              {dados.maisAntigos.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/monitor/${a.id}`}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="nome" style={{ display: 'block' }}>
                        {a.cliente_nome ? formatarNome(a.cliente_nome) : 'Cliente'}
                        {a.departamento && <span style={{ color: 'var(--tinta-3)', fontWeight: 400 }}> · {a.departamento}</span>}
                      </span>
                      <span className="meta" style={{ display: 'block' }}>
                        Cliente falou em <b style={{ color: 'var(--tinta-2)' }}>{formatarDataHora(a.cliente_respondeu_em)}</b>
                        {a.atendente_nome ? ` · ${formatarNome(a.atendente_nome)}` : ' · sem atendente'}
                      </span>
                    </span>
                    <span className="selo selo-perigo">parado há {formatarDuracao(a.cliente_respondeu_em)}</span>
                    <ChevronRight className="icone icone-p" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
                  </Link>
                </li>
              ))}
            </ul>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link href="/dashboard/auditoria" style={{ fontSize: 14, fontWeight: 600 }}>Ver os {dados.paraResolverAgora} na Auditoria →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== B) Estamos respondendo? ===== */}
      {meses.length > 0 && (
        <section className="cartao" style={{ marginBottom: 18 }}>
          <div className="cartao-cabeca"><h2 className="cartao-titulo">Estamos respondendo os clientes?</h2></div>
          <div className="cartao-corpo">
            <Veredito delta={delta} atual={atual} anterior={anterior} />
            <Barras meses={meses} />
            <p style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-3)', marginTop: 10, lineHeight: 1.5 }}>
              Cada barra é um mês. A barra cheia seria 100% dos clientes que falaram e tiveram resposta em até 24 horas. O último mês ainda está correndo.
              {' '}Quando sua equipe responde, ela responde rápido — o tempo mais comum é de <b>{minutosLegivel(atual?.mediana_min != null ? Number(atual.mediana_min) : null)}</b>. O problema não é demora: é o cliente que nunca recebe resposta.
            </p>
          </div>
        </section>
      )}

      {/* ===== C) O sistema está sendo usado? ===== */}
      {pendentes.length > 0 ? (
        <section className="cartao">
          <div className="cartao-cabeca"><div><h2 className="cartao-titulo">O sistema está sendo usado?</h2><p className="cartao-sub">Estas medidas só existem quando a equipe usar o sistema. Hoje ainda não podem ser respondidas — e é isso que a tela está dizendo.</p></div></div>
          <div className="cartao-corpo" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendentes.map((p) => (
              <div key={p.chave} className="ini-pend">
                <span className="bolinha" aria-hidden="true" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 14 }}>{p.titulo}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--tinta-2)', marginTop: 2, lineHeight: 1.5 }}>{p.texto}</div>
                </div>
                <Link href={p.href} className="botao botao-secundario">
                  {p.chave === 'cobrancas' ? <BellRing className="icone icone-p" aria-hidden="true" focusable="false" /> : p.chave === 'papeis' ? <Users className="icone icone-p" aria-hidden="true" focusable="false" /> : <UserPlus className="icone icone-p" aria-hidden="true" focusable="false" />}
                  {p.acao}
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="cartao">
          <div className="cartao-cabeca"><h2 className="cartao-titulo">O sistema está sendo usado</h2></div>
          <div className="cartao-corpo" style={{ fontSize: 14, color: 'var(--tinta-2)' }}>
            {uso.pessoasComAcesso} pessoas com acesso · {uso.cobrancasCriadas} cobranças criadas · {uso.cobrancasResolvidas} resolvidas.{' '}
            <Link href="/dashboard/cobrancas" style={{ fontWeight: 600 }}>Ver o painel de cobrança →</Link>
          </div>
        </section>
      )}

      <p style={{ fontSize: 'var(--t-pequeno)', color: 'var(--tinta-3)', marginTop: 14, textAlign: 'center' }}>
        {dados.conversasAbertas.toLocaleString('pt-BR')} conversas abertas espelhadas do Multi360.
      </p>
      {nome && <span style={{ display: 'none' }}>{nome}</span>}
    </>
  )
}

function Veredito({ delta, atual, anterior }: { delta: number | null; atual: MesMetrica | null; anterior: MesMetrica | null }) {
  if (!atual || atual.pct_resposta_24h == null) {
    return <div style={{ fontSize: 14, color: 'var(--tinta-2)', marginBottom: 10 }}>Ainda não há meses fechados para comparar.</div>
  }
  const pct = Number(atual.pct_resposta_24h)
  const semResposta = 100 - pct
  const emCada = semResposta > 0 ? Math.max(2, Math.round(100 / semResposta)) : 0
  const grave = pct < 75
  const melhorou = delta !== null && delta > 2
  const piorou = delta !== null && delta < -2
  const Icone = melhorou ? TrendingUp : piorou ? TrendingDown : Minus
  const corTend = melhorou ? 'var(--sucesso)' : piorou ? 'var(--perigo)' : 'var(--atencao)'

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: grave ? 'var(--perigo)' : 'var(--sucesso)', fontWeight: 650, fontSize: 17, letterSpacing: '-.01em' }}>
        {emCada > 0 ? `1 em cada ${emCada} clientes fica sem resposta em 24 horas.` : 'Todos os clientes tiveram resposta em 24 horas.'}
      </div>
      <div style={{ fontSize: 14, color: 'var(--tinta-2)', marginTop: 4 }}>
        Em <b style={{ color: 'var(--tinta)' }}>{rotuloMes(atual.competencia)}</b> (último mês fechado), <b style={{ color: 'var(--tinta)' }}>{pct.toFixed(0)}%</b> dos clientes que falaram tiveram resposta em até 24 horas.
        {delta !== null && anterior && (
          <>
            {' '}
            <span style={{ color: corTend, fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icone className="icone icone-p" aria-hidden="true" focusable="false" />
              {melhorou ? 'Melhorou' : piorou ? 'Piorou' : 'Praticamente igual a'} {Math.abs(delta) >= 1 ? `${Math.abs(delta).toFixed(0)} pontos percentuais` : ''} desde {rotuloMes(anterior.competencia)}
            </span>
            {' '}(quando eram {Number(anterior.pct_resposta_24h ?? 0).toFixed(0)}%).
          </>
        )}
      </div>
    </div>
  )
}

function Barras({ meses }: { meses: MesMetrica[] }) {
  return (
    <div className="ini-barras">
      {meses.map((m) => {
        const pct = m.pct_resposta_24h != null ? Number(m.pct_resposta_24h) : 0
        const bom = pct >= 75
        const ruim = pct < 65
        const cor = bom ? 'var(--sucesso)' : ruim ? 'var(--perigo)' : 'var(--atencao)'
        return (
          <div key={m.competencia} className="ini-barra-col">
            <div style={{ fontSize: 10, color: 'var(--tinta-2)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}</div>
            <div className="ini-barra-trilho">
              <div title={`${rotuloMes(m.competencia)}: ${pct.toFixed(0)}% respondidos em 24h · ${m.rodadas} clientes falaram · ${m.rodadas_sem_resposta} nunca tiveram resposta`} style={{ width: '100%', height: `${Math.max(3, pct)}%`, background: cor, borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--tinta-3)' }}>{rotuloMesCurto(m.competencia)}</div>
          </div>
        )
      })}
    </div>
  )
}

function CartaoAcao({ icone: Icone, variante, valor, titulo, texto, href }: {
  icone: typeof AlarmClock
  variante: 'perigo' | 'atencao' | 'neutro'
  valor: number
  titulo: string
  texto: string
  href: string
}) {
  return (
    <Link href={href} className={`ini-acao ${variante}`}>
      <div className="rot"><Icone className="icone" aria-hidden={true} focusable="false" /> {titulo}</div>
      <div className="n">{valor.toLocaleString('pt-BR')}</div>
      <div className="leg">{texto}</div>
    </Link>
  )
}
