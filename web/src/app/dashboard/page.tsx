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
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutDashboard className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" />
            {primeiroNome ? `Olá, ${primeiroNome}.` : 'Painel'}
          </h1>
          <p className="subtitulo">A situação do escritório, e o que precisa de decisão.</p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {dados.erro && <BannerConfig erro={dados.erro} />}

      <PainelInicio dados={dados} nome={papel.nome} />
    </main>
  )
}
