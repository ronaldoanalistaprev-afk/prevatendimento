'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  UserCog,
  BarChart3,
  Radar,
  ShieldAlert,
  BellRing,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import UsuarioLogado from '@/components/UsuarioLogado'
import type { UsuarioRole } from '@/lib/tipos'

const itensMenu: { chave: string; href: string; label: string; icone: typeof Radar }[] = [
  // '/dashboard' é prefixo de todas as rotas; o cálculo de item ativo (mais abaixo)
  // já trata esse caso com match exato, senão "Início" ficaria aceso em toda tela.
  { chave: 'inicio', href: '/dashboard', label: 'Início', icone: LayoutDashboard },
  { chave: 'monitor', href: '/dashboard/monitor', label: 'Monitor', icone: Radar },
  { chave: 'cobrancas', href: '/dashboard/cobrancas', label: 'Cobranças', icone: BellRing },
  { chave: 'auditoria', href: '/dashboard/auditoria', label: 'Auditoria', icone: ShieldAlert },
  { chave: 'desempenho', href: '/dashboard/desempenho', label: 'Desempenho', icone: BarChart3 },
  { chave: 'colaboradores', href: '/dashboard/colaboradores', label: 'Colaboradores', icone: UserCog },
  { chave: 'configuracoes', href: '/dashboard/configuracoes', label: 'Configurações', icone: Settings },
]

export default function Sidebar({
  role = 'COLABORADOR',
  telasPermitidas = [],
  nome = null,
  email = null,
  rotulo = 'Colaborador',
  atendente = null,
  entrouEm = null,
}: {
  role?: UsuarioRole
  telasPermitidas?: string[]
  nome?: string | null
  email?: string | null
  rotulo?: string
  atendente?: string | null
  entrouEm?: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [recolhido, setRecolhido] = useState(false)
  // Em telas pequenas (tablet/celular) o menu recolhe sozinho, sobrando espaço p/ o conteúdo.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)')
    const aplicar = () => setRecolhido(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])
  const permitido = new Set(telasPermitidas)
  const itens = itensMenu.filter((i) => permitido.has(i.chave))

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      style={{
        width: recolhido ? '72px' : '240px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f2236 0%, #1A3C5A 100%)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: recolhido ? '20px 0' : '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: recolhido ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #16A34A, #1A3C5A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>PA</span>
        </div>
        {!recolhido && (
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              PrevAtendimento
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Aposentar · SIAP</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {itens.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={recolhido ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: recolhido ? '10px 0' : '10px 12px',
                borderRadius: '10px',
                justifyContent: recolhido ? 'center' : 'flex-start',
                background: ativo ? 'rgba(22,163,74,0.25)' : 'transparent',
                borderLeft: ativo ? '3px solid #16A34A' : '3px solid transparent',
                color: ativo ? 'white' : 'rgba(255,255,255,0.78)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: ativo ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <Icone size={18} style={{ flexShrink: 0 }} />
              {!recolhido && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <UsuarioLogado
          nome={nome}
          email={email}
          rotulo={rotulo}
          role={role}
          atendente={atendente}
          entrouEm={entrouEm}
          recolhido={recolhido}
        />
      </div>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleSair}
          title={recolhido ? 'Sair' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: recolhido ? '10px 0' : '10px 12px',
            justifyContent: recolhido ? 'center' : 'flex-start',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.68)',
            fontSize: '13.5px',
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!recolhido && <span>Sair</span>}
        </button>
      </div>

      <button
        onClick={() => setRecolhido(!recolhido)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '-12px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#16A34A',
          border: '2px solid #0f2236',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {recolhido ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
