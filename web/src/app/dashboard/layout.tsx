import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { TELAS } from '@/lib/telas'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])

  // Login desativado perde o acesso na hora — não basta bloquear o próximo login,
  // a sessão que já estava aberta tem que cair.
  if (papel.id && !papel.ativo) redirect('/auth/sair?motivo=inativo')

  const telasPermitidas = TELAS.filter((t) => podeAcessar(mapa, t.chave, papel.role)).map((t) => t.chave)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* No celular a barra do topo do menu é fixa (52px); o conteúdo desce para não ficar embaixo dela. */}
      <style>{`@media (max-width: 820px){ .dash-main{ padding-top: 52px; } }`}</style>
      <Sidebar
        role={papel.role}
        telasPermitidas={telasPermitidas}
        nome={papel.nome}
        email={papel.email}
        rotulo={papel.rotulo}
        atendente={papel.colaboradorNome}
        entrouEm={papel.entrouEm}
      />
      <main className="dash-main" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</main>
    </div>
  )
}
