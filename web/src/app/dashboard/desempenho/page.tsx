import Link from 'next/link'
import { getPainelGestor } from '@/lib/gestao'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { formatarNome } from '@/lib/utils'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import SemPermissao from '@/components/SemPermissao'
import BannerConfig from '@/components/BannerConfig'
import { Users, AlarmClock, CheckCircle2, BellRing, Clock, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DesempenhoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'desempenho', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Desempenho da equipe</h1></div></div>
        <SemPermissao tela="o Desempenho da equipe" />
      </main>
    )
  }

  const { resumo, ranking, estado } = await getPainelGestor()

  // Cada cartão diz para onde leva (D2: legendas diretas, não "clique para ver" repetido).
  const cards: { label: string; valor: number; icone: typeof Users; variante: string; href: string; leg: string }[] = [
    { label: 'Conversas abertas', valor: resumo.conversasAbertas, icone: Users, variante: 'neutro', href: '/dashboard/monitor', leg: 'abrir no Monitor' },
    { label: 'Sem resposta', valor: resumo.esperando, icone: AlarmClock, variante: 'atencao', href: '/dashboard/monitor?so=esperando&periodo=tudo', leg: 'ver quem está esperando' },
    { label: 'Sem resposta há mais de 24h', valor: resumo.esperando24, icone: Clock, variante: 'perigo', href: '/dashboard/auditoria', leg: 'abrir na Auditoria' },
    { label: 'Finalizadas', valor: resumo.finalizadas, icone: CheckCircle2, variante: 'neutro', href: '/dashboard/monitor?situacao=finalizadas&periodo=tudo', leg: 'ver as conversas encerradas' },
    { label: 'Cobranças a resolver', valor: resumo.cobrancasAbertas, icone: BellRing, variante: 'atencao', href: '/dashboard/cobrancas', leg: 'abrir as cobranças' },
    { label: 'Cobranças vencidas', valor: resumo.cobrancasVencidas, icone: BellRing, variante: 'perigo', href: '/dashboard/cobrancas', leg: 'prazo passou — abrir as cobranças' },
  ]

  const maxEsperando = Math.max(1, ...ranking.map((r) => r.esperando))

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Desempenho da equipe</h1>
          <p className="subtitulo">Visão do gestor: quem está com gente esperando, o volume de cada atendente e as cobranças.</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      {/* Cards de resumo */}
      <div className="ini-acoes" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {cards.map((c) => {
          const Icone = c.icone
          return (
            <Link key={c.label} href={c.href} className={`ini-acao ${c.variante}`}>
              <div className="rot"><Icone className="icone" aria-hidden="true" focusable="false" /> {c.label}</div>
              <div className="n">{c.valor.toLocaleString('pt-BR')}</div>
              <div className="leg">{c.leg}</div>
            </Link>
          )
        })}
      </div>

      {/* Ranking por atendente */}
      <section className="cartao">
        <div className="cartao-cabeca"><h2 className="cartao-titulo">Por atendente</h2></div>
        {ranking.length === 0 ? (
          <div className="vazio">
            <p className="vazio-titulo">Ainda não há dados para mostrar.</p>
            <p className="vazio-texto">Assim que o leitor do Multi360 trouxer conversas com atendente, cada pessoa da equipe aparece aqui com os seus números.</p>
          </div>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela tabela-cartoes">
              <caption className="so-leitor">Desempenho por atendente</caption>
              <thead>
                <tr>
                  <th scope="col">Atendente</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Conversas abertas</th>
                  <th scope="col">Sem resposta</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Sem resposta há mais de 24h</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Cobranças</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Finalizadas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => {
                  const grave = r.esperando24 > 0
                  return (
                    <tr key={r.atendente}>
                      <td className="nome" data-rotulo="Atendente" style={{ color: 'var(--tinta)' }}>{formatarNome(r.atendente)}</td>
                      <td data-rotulo="Conversas abertas" style={{ textAlign: 'center', color: 'var(--tinta-2)', fontVariantNumeric: 'tabular-nums' }}>{r.abertas.toLocaleString('pt-BR')}</td>
                      <td data-rotulo="Sem resposta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                          <span aria-hidden="true" style={{ flex: 1, height: 8, background: 'var(--recuo-2)', borderRadius: 999, overflow: 'hidden', minWidth: 80, display: 'block' }}>
                            <span style={{ display: 'block', width: `${(r.esperando / maxEsperando) * 100}%`, height: '100%', background: grave ? 'var(--perigo)' : 'var(--atencao)', borderRadius: 999 }} />
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: grave ? 'var(--perigo)' : 'var(--atencao)', minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>
                            {grave && <AlertTriangle className="icone icone-p" aria-hidden="true" focusable="false" />}
                            {r.esperando.toLocaleString('pt-BR')}
                            {grave && <span className="so-leitor">, com cliente esperando há mais de 24 horas</span>}
                          </span>
                        </span>
                      </td>
                      <td data-rotulo="Sem resposta há mais de 24h" style={{ textAlign: 'center', fontWeight: 700, color: grave ? 'var(--perigo)' : 'var(--tinta-3)', fontVariantNumeric: 'tabular-nums' }}>{r.esperando24.toLocaleString('pt-BR')}</td>
                      <td data-rotulo="Cobranças" style={{ textAlign: 'center' }}>
                        {r.cobrancasAbertas > 0 ? (
                          <span className={`selo ${r.cobrancasVencidas > 0 ? 'selo-perigo' : 'selo-atencao'}`}>
                            {r.cobrancasAbertas} aberta{r.cobrancasAbertas > 1 ? 's' : ''}{r.cobrancasVencidas > 0 ? ` · ${r.cobrancasVencidas} vencida${r.cobrancasVencidas > 1 ? 's' : ''}` : ''}
                          </span>
                        ) : <span style={{ color: 'var(--tinta-3)' }}>—</span>}
                      </td>
                      <td data-rotulo="Finalizadas" style={{ textAlign: 'center', color: 'var(--tinta-3)', fontVariantNumeric: 'tabular-nums' }}>{r.finalizadas.toLocaleString('pt-BR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="texto-apoio" style={{ marginTop: 14 }}>
        &quot;Sem resposta&quot; = o cliente falou por último e ninguém respondeu. A barra vermelha com o sinal de alerta indica quem tem cliente sem resposta há mais de 24 horas. A barra compara com o atendente que tem mais casos.
      </p>
    </main>
  )
}
