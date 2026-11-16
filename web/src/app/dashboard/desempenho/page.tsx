import Link from 'next/link'
import { getPainelGestor } from '@/lib/gestao'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { formatarNome } from '@/lib/utils'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { BarChart3, Users, AlarmClock, CheckCircle2, BellRing, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function SemAcesso() {
  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
    </main>
  )
}

export default async function DesempenhoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'desempenho', papel.role)) return <SemAcesso />

  const { resumo, ranking, estado } = await getPainelGestor()

  const cards: { label: string; valor: number; icone: typeof Users; variante: string; href: string }[] = [
    { label: 'Conversas abertas', valor: resumo.conversasAbertas, icone: Users, variante: 'neutro', href: '/dashboard/monitor' },
    { label: 'Sem resposta', valor: resumo.esperando, icone: AlarmClock, variante: 'atencao', href: '/dashboard/monitor?so=esperando&periodo=tudo' },
    { label: 'Sem resposta há +24h', valor: resumo.esperando24, icone: Clock, variante: 'perigo', href: '/dashboard/auditoria' },
    { label: 'Finalizadas', valor: resumo.finalizadas, icone: CheckCircle2, variante: 'neutro', href: '/dashboard/monitor?situacao=finalizadas&periodo=tudo' },
    { label: 'Cobranças a resolver', valor: resumo.cobrancasAbertas, icone: BellRing, variante: 'atencao', href: '/dashboard/cobrancas' },
    { label: 'Cobranças vencidas', valor: resumo.cobrancasVencidas, icone: BellRing, variante: 'perigo', href: '/dashboard/cobrancas' },
  ]

  const maxEsperando = Math.max(1, ...ranking.map((r) => r.esperando))

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Desempenho da equipe
          </h1>
          <p className="subtitulo">Visão do gestor: quem está com gente esperando, o volume de cada atendente e as cobranças.</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {estado.erro && <div className="aviso aviso-perigo" style={{ marginBottom: 16 }}>{estado.erro}</div>}

      {/* Cards de resumo */}
      <div className="ini-acoes" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {cards.map((c) => {
          const Icone = c.icone
          return (
            <Link key={c.label} href={c.href} className={`ini-acao ${c.variante}`} title="Clique para abrir a lista">
              <div className="rot"><Icone className="icone" aria-hidden="true" focusable="false" /> {c.label}</div>
              <div className="n">{c.valor.toLocaleString('pt-BR')}</div>
              <div className="leg">clique para ver</div>
            </Link>
          )
        })}
      </div>

      {/* Ranking por atendente */}
      <section className="cartao">
        <div className="cartao-cabeca"><h2 className="cartao-titulo">Por atendente</h2></div>
        {ranking.length === 0 ? (
          <div className="vazio"><p className="vazio-texto">Ainda não há dados para mostrar.</p></div>
        ) : (
          <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
            <table className="tabela" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Atendente</th>
                  <th style={{ textAlign: 'center' }}>Conversas abertas</th>
                  <th style={{ minWidth: 180 }}>Sem resposta</th>
                  <th style={{ textAlign: 'center' }}>Sem resposta há +24h</th>
                  <th style={{ textAlign: 'center' }}>Cobranças</th>
                  <th style={{ textAlign: 'center' }}>Finalizadas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.atendente}>
                    <td className="nome" style={{ color: 'var(--tinta)' }}>{formatarNome(r.atendente)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--tinta-2)' }}>{r.abertas.toLocaleString('pt-BR')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: 'var(--recuo-2)', borderRadius: 999, overflow: 'hidden', minWidth: 80 }}>
                          <div style={{ width: `${(r.esperando / maxEsperando) * 100}%`, height: '100%', background: r.esperando24 > 0 ? 'var(--perigo)' : 'var(--atencao)', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: r.esperando24 > 0 ? 'var(--perigo)' : 'var(--atencao)', minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>{r.esperando}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: r.esperando24 > 0 ? 'var(--perigo)' : 'var(--tinta-3)', fontVariantNumeric: 'tabular-nums' }}>{r.esperando24}</td>
                    <td style={{ textAlign: 'center' }}>
                      {r.cobrancasAbertas > 0 ? (
                        <span style={{ fontSize: 13, fontWeight: 700, color: r.cobrancasVencidas > 0 ? 'var(--perigo)' : 'var(--atencao)' }}>
                          {r.cobrancasAbertas} aberta{r.cobrancasAbertas > 1 ? 's' : ''}{r.cobrancasVencidas > 0 ? ` (${r.cobrancasVencidas} vencida${r.cobrancasVencidas > 1 ? 's' : ''})` : ''}
                        </span>
                      ) : <span style={{ color: 'var(--tinta-3)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--tinta-3)' }}>{r.finalizadas.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="texto-apoio" style={{ marginTop: 14 }}>
        &quot;Sem resposta&quot; = o cliente falou por último e ninguém respondeu. Barras vermelhas indicam quem tem cliente sem resposta há mais de 24 horas. A barra compara com o atendente que tem mais casos.
      </p>
    </main>
  )
}
