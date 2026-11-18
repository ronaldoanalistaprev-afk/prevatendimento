import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { contarConversas } from '@/lib/dados'
import { contarAcoes } from '@/lib/acoes'
import { TELAS } from '@/lib/telas'
import { AvisoPeProvider } from '@/components/AvisoPe'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [papel, mapa, conversas, acoes] = await Promise.all([
    getPapelAtual(),
    getPermissoesMapa(),
    contarConversas(),
    contarAcoes(),
  ])

  // Login desativado perde o acesso na hora — não basta bloquear o próximo login,
  // a sessão que já estava aberta tem que cair.
  if (papel.id && !papel.ativo) redirect('/auth/sair?motivo=inativo')

  const telasPermitidas = TELAS.filter((t) => podeAcessar(mapa, t.chave, papel.role)).map((t) => t.chave)
  const contadores = { acoes, abertas: conversas.abertas, finalizadas: conversas.finalizadas }
  return (
    <AvisoPeProvider>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>
      <div className="casca">
        <Suspense fallback={<div className="lateral" aria-hidden="true" />}>
          <Sidebar
            role={papel.role}
            telasPermitidas={telasPermitidas}
            contadores={contadores}
            nome={papel.nome}
            email={papel.email}
            rotulo={papel.rotulo}
            atendente={papel.colaboradorNome}
            entrouEm={papel.entrouEm}
          />
        </Suspense>
        <div className="principal">{children}</div>
      </div>
    </AvisoPeProvider>
  )
}
