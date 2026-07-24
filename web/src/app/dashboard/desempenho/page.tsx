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
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
        Você não tem acesso a esta tela.
      </div>
    </div>
  )
}

export default async function DesempenhoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'desempenho', papel.role)) return <SemAcesso />

  const { resumo, ranking, estado } = await getPainelGestor()

  // Cartões clicáveis: cada número leva para a tela que resolve aquilo.
  const cards: { label: string; valor: number; icone: typeof Users; cor: string; href?: string }[] = [
    { label: 'Conversas abertas', valor: resumo.conversasAbertas, icone: Users, cor: '#1A3C5A', href: '/dashboard/monitor' },
    { label: 'Sem resposta', valor: resumo.esperando, icone: AlarmClock, cor: '#C2410C', href: '/dashboard/monitor?so=esperando' },
    { label: 'Sem resposta há +24h', valor: resumo.esperando24, icone: Clock, cor: '#B91C1C', href: '/dashboard/auditoria' },
    { label: 'Finalizadas', valor: resumo.finalizadas, icone: CheckCircle2, cor: '#15803D', href: '/dashboard/monitor?situacao=finalizadas&periodo=tudo' },
    { label: 'Cobranças a resolver', valor: resumo.cobrancasAbertas, icone: BellRing, cor: '#B45309', href: '/dashboard/cobrancas' },
    { label: 'Cobranças vencidas', valor: resumo.cobrancasVencidas, icone: BellRing, cor: '#DC2626', href: '/dashboard/cobrancas' },
  ]

  const maxEsperando = Math.max(1, ...ranking.map((r) => r.esperando))

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: '#16A34A' }} /> Desempenho da equipe
          </h1>
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Visão do gestor: quem está com gente esperando, o volume de cada atendente e as cobranças.
        </p>
      </div>

      {estado.erro && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, marginBottom: 16 }}>
          {estado.erro}
        </div>
      )}

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 22 }}>
        {cards.map((c) => {
          const Icone = c.icone
          return (
            <Link
              key={c.label}
              href={c.href ?? '#'}
              title="Clique para abrir a lista"
              style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #EEF2F7', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{c.label}</span>
                <Icone size={16} style={{ color: c.cor }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.cor, marginTop: 4 }}>{c.valor}</div>
              <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 2 }}>clique para ver</div>
            </Link>
          )
        })}
      </div>

      {/* Ranking por atendente */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', fontWeight: 700, color: '#1A3C5A', fontSize: 15 }}>
          Por atendente
        </div>
        {ranking.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Ainda não há dados para mostrar.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 780 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                  <th style={{ padding: '11px 20px', fontWeight: 600 }}>Atendente</th>
                  <th style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'center' }}>Conversas abertas</th>
                  <th style={{ padding: '11px 14px', fontWeight: 600, minWidth: 180 }}>Sem resposta</th>
                  <th style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'center' }}>Sem resposta há +24h</th>
                  <th style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'center' }}>Cobranças</th>
                  <th style={{ padding: '11px 14px', fontWeight: 600, textAlign: 'center' }}>Finalizadas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.atendente} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1A3C5A' }}>{formatarNome(r.atendente)}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#374151' }}>{r.abertas}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', minWidth: 80 }}>
                          <div style={{ width: `${(r.esperando / maxEsperando) * 100}%`, height: '100%', background: r.esperando24 > 0 ? '#DC2626' : '#F59E0B', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: r.esperando24 > 0 ? '#B91C1C' : '#A16207', minWidth: 20 }}>{r.esperando}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700, color: r.esperando24 > 0 ? '#B91C1C' : '#9CA3AF' }}>{r.esperando24}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      {r.cobrancasAbertas > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: r.cobrancasVencidas > 0 ? '#DC2626' : '#B45309' }}>
                          {r.cobrancasAbertas} aberta{r.cobrancasAbertas > 1 ? 's' : ''}{r.cobrancasVencidas > 0 ? ` (${r.cobrancasVencidas} vencida${r.cobrancasVencidas > 1 ? 's' : ''})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', color: '#9CA3AF' }}>{r.finalizadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14 }}>
        &quot;Sem resposta&quot; = o cliente falou por último e ninguém respondeu. Barras vermelhas indicam quem tem cliente sem resposta há mais de 24 horas. A barra compara com o atendente que tem mais casos.
      </p>
    </div>
  )
}
