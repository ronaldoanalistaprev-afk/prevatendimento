import Link from 'next/link'
import { Server, ShieldCheck, BookMarked, Users, MessageSquareText, ChevronRight, Plug } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import SemPermissao from '@/components/SemPermissao'

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
  { href: '/dashboard/configuracoes/integracao', titulo: 'Integração Multi360', descricao: 'O token de acesso que lê as conversas. Renove aqui quando a leitura parar.', icone: Plug, exige: 'admin' },
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
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Configurações</h1></div></div>
        <SemPermissao tela="Configurações" />
      </main>
    )
  }

  const visiveis = CARDS.filter((c) => {
    if (!c.exige) return true
    if (c.exige === 'admin') return papel.role === 'ADMIN'
    return podeAcessar(mapa, c.exige, papel.role)
  })

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 900 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Configurações</h1>
          <p className="subtitulo">Escolha o que deseja configurar.</p>
        </div>
      </div>

      {/* Linhas clicáveis da referência (.pend-item), como em Pendências (auditoria G1). */}
      <nav className="cartao" aria-label="Áreas de configuração">
        <ul className="pend-lista" style={{ paddingTop: 6 }}>
          {visiveis.map((c) => {
            const Icone = c.icone
            return (
              <li key={c.href}>
                <Link href={c.href} className="pend-item" style={{ gridTemplateColumns: 'auto minmax(0, 1fr) auto', minHeight: 56 }}>
                  <span className="avatar p" aria-hidden="true"><Icone className="icone icone-p" style={{ color: 'var(--acao-forte)' }} aria-hidden="true" focusable="false" /></span>
                  <span style={{ minWidth: 0 }}>
                    <span className="pend-nome" style={{ display: 'block' }}>{c.titulo}</span>
                    <span className="texto-apoio" style={{ display: 'block' }}>{c.descricao}</span>
                  </span>
                  <ChevronRight className="icone" aria-hidden="true" focusable="false" />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </main>
  )
}
