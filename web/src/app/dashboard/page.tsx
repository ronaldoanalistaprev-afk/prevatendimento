import { redirect } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getDadosInicio } from '@/lib/inicio'
import PainelInicio from '@/components/PainelInicio'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import BannerConfig from '@/components/BannerConfig'

export const dynamic = 'force-dynamic'

/**
 * Tela inicial.
 * Quem enxerga tudo (gestor/supervisor/admin) abre o PAINEL: a situação do
 * escritório e o que exige decisão. Quem só vê as próprias conversas (atendente)
 * vai direto para o Monitor — "tempo médio da equipe" não é algo sobre o que ele
 * possa agir.
 */
export default async function DashboardHome() {
  const papel = await getPapelAtual()
  if (!papel.verTudo) redirect('/dashboard/monitor')

  const dados = await getDadosInicio()
  const primeiroNome = papel.nome?.trim().split(/\s+/)[0] ?? null

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutDashboard size={22} style={{ color: '#16A34A' }} />
            {primeiroNome ? `Olá, ${primeiroNome}.` : 'Painel'}
          </h1>
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 4 }}>A situação do escritório, e o que precisa de decisão.</p>
      </div>

      {dados.erro && <BannerConfig erro={dados.erro} />}

      <PainelInicio dados={dados} nome={papel.nome} />
    </div>
  )
}
