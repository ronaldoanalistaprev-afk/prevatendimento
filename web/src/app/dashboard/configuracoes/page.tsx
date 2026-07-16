import Link from 'next/link'
import { Settings, Server, ShieldCheck, BookMarked, Users, MessageSquareText } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'

export const dynamic = 'force-dynamic'

interface Card {
  href: string
  titulo: string
  descricao: string
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  cor: string
  bg: string
  /** 'admin' = só o Administrador; ou a chave da tela na matriz de permissões. */
  exige?: 'admin' | string
}

const CARDS: Card[] = [
  { href: '/dashboard/configuracoes/situacao', titulo: 'Situação do sistema', descricao: 'Banco de dados, cadastro de logins e leitor do Multi360.', icone: Server, cor: '#16A34A', bg: '#DCFCE7' },
  { href: '/dashboard/configuracoes/permissoes', titulo: 'Permissões', descricao: 'Quem vê cada tela. Marque por papel e salve.', icone: ShieldCheck, cor: '#4B7BA6', bg: '#DBEAFE' },
  { href: '/dashboard/configuracoes/papeis', titulo: 'Papéis', descricao: 'Os cargos do sistema e o que cada um pode fazer. Crie, edite ou exclua.', icone: Users, cor: '#1D4ED8', bg: '#EFF6FF', exige: 'admin' },
  { href: '/dashboard/configuracoes/modelos', titulo: 'Modelos de cobrança', descricao: 'Textos prontos para as cobranças que se repetem.', icone: MessageSquareText, cor: '#C2410C', bg: '#FFEDD5', exige: 'modelos' },
  { href: '/dashboard/catalogo', titulo: 'Catálogo Previdenciário', descricao: 'Benefícios, serviços e fases, separados por RGPS e RPPS.', icone: BookMarked, cor: '#7E22CE', bg: '#F3E8FF' },
]

export default async function ConfiguracoesPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Você não tem acesso a esta tela.</div>
      </div>
    )
  }

  const visiveis = CARDS.filter((c) => {
    if (!c.exige) return true
    if (c.exige === 'admin') return papel.role === 'ADMIN'
    return podeAcessar(mapa, c.exige, papel.role)
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} style={{ color: '#16A34A' }} /> Configurações
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Escolha o que deseja configurar.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {visiveis.map((c) => {
          const Icone = c.icone
          return (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #EEF2F7',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                padding: '20px',
                textDecoration: 'none',
                minHeight: 150,
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icone size={22} style={{ color: c.cor }} />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#1A3C5A' }}>{c.titulo}</div>
              <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>{c.descricao}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
