import Sidebar from '@/components/Sidebar'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { TELAS } from '@/lib/telas'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  const telasPermitidas = TELAS.filter((t) => podeAcessar(mapa, t.chave, papel.role)).map((t) => t.chave)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar
        role={papel.role}
        telasPermitidas={telasPermitidas}
        nome={papel.nome}
        email={papel.email}
        rotulo={papel.rotulo}
        atendente={papel.colaboradorNome}
        entrouEm={papel.entrouEm}
      />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
