import Link from 'next/link'
import { Settings, Server, ShieldCheck, BookMarked, Users, MessageSquareText } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'

export const dynamic = 'force-dynamic'

interface Card {
  href: string
  titulo: string
  descricao: string
  icone: typeof Server
  /** 'admin' = só o Administrador; ou a chave da tela na matriz de permissões. */
  exige?: 'admin' | string
}

const CARDS: Card[] = [
  { href: '/dashboard/configuracoes/situacao', titulo: 'Situação do sistema', descricao: 'Banco de dados, cadastro de logins e leitor do Multi360.', icone: Server },
  { href: '/dashboard/configuracoes/permissoes', titulo: 'Permissões', descricao: 'Quem vê cada tela. Marque por papel e salve.', icone: ShieldCheck },
  { href: '/dashboard/configuracoes/papeis', titulo: 'Papéis', descricao: 'Os cargos do sistema e o que cada um pode fazer. Crie, edite ou exclua.', icone: Users, exige: 'admin' },
  { href: '/dashboard/configuracoes/modelos', titulo: 'Modelos de cobrança', descricao: 'Textos prontos para as cobranças que se repetem.', icone: MessageSquareText, exige: 'modelos' },
  { href: '/dashboard/catalogo', titulo: 'Catálogo Previdenciário', descricao: 'Benefícios, serviços e fases, separados por RGPS e RPPS.', icone: BookMarked },
]

export default async function ConfiguracoesPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }

  const visiveis = CARDS.filter((c) => {
    if (!c.exige) return true
    if (c.exige === 'admin') return papel.role === 'ADMIN'
    return podeAcessar(mapa, c.exige, papel.role)
  })

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Configurações
          </h1>
          <p className="subtitulo">Escolha o que deseja configurar.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {visiveis.map((c) => {
          const Icone = c.icone
          return (
            <Link key={c.href} href={c.href} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, textDecoration: 'none', minHeight: 150 }}>
              <div className="vazio-icone"><Icone className="icone icone-g" aria-hidden="true" focusable="false" /></div>
              <div className="sub-titulo" style={{ fontSize: 15.5 }}>{c.titulo}</div>
              <div className="texto-apoio" style={{ lineHeight: 1.5 }}>{c.descricao}</div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
