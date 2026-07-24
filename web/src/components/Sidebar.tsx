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
  Menu,
  KeyRound,
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
  rotulo = 'Atendente',
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
  // No celular o menu vira uma gaveta que abre por um botão, em vez de comer
  // a largura da tela. `celular` decide qual dos dois comportamentos vale.
  const [celular, setCelular] = useState(false)
  const [gavetaAberta, setGavetaAberta] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)')
    const aplicar = () => setCelular(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])
  // Trocar de tela fecha a gaveta (senão ela fica por cima do conteúdo novo).
  useEffect(() => {
    setGavetaAberta(false)
  }, [pathname])

  const permitido = new Set(telasPermitidas)
  const itens = itensMenu.filter((i) => permitido.has(i.chave))

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // No celular a gaveta nunca fica no modo "recolhido" (mostra tudo por extenso).
  const compacto = recolhido && !celular

  const menu = (
    <aside
      style={{
        width: compacto ? '72px' : '240px',
        height: celular ? '100dvh' : undefined,
        minHeight: celular ? undefined : '100vh',
        background: 'linear-gradient(180deg, #0f2236 0%, #1A3C5A 100%)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: celular ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        transform: celular ? (gavetaAberta ? 'translateX(0)' : 'translateX(-100%)') : undefined,
        transitionProperty: 'width, transform',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: compacto ? '20px 0' : '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: compacto ? 'center' : 'flex-start',
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
        {!compacto && (
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              PrevAtendimento
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Aposentar · SIAP</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {itens.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={compacto ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: compacto ? '10px 0' : '10px 12px',
                borderRadius: '10px',
                justifyContent: compacto ? 'center' : 'flex-start',
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
              {!compacto && <span>{label}</span>}
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
          recolhido={compacto}
        />
      </div>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link
          href="/dashboard/conta"
          title={compacto ? 'Minha conta' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: compacto ? '10px 0' : '10px 12px',
            justifyContent: compacto ? 'center' : 'flex-start',
            borderRadius: '10px',
            background: pathname.startsWith('/dashboard/conta') ? 'rgba(22,163,74,0.25)' : 'transparent',
            color: 'rgba(255,255,255,0.78)',
            textDecoration: 'none',
            fontSize: '13.5px',
          }}
        >
          <KeyRound size={18} style={{ flexShrink: 0 }} />
          {!compacto && <span>Minha conta</span>}
        </Link>
        <button
          onClick={handleSair}
          title={compacto ? 'Sair' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: compacto ? '10px 0' : '10px 12px',
            justifyContent: compacto ? 'center' : 'flex-start',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.68)',
            fontSize: '13.5px',
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!compacto && <span>Sair</span>}
        </button>
      </div>

      {/* No desktop: botão redondo que recolhe/expande. No celular a gaveta não usa isto. */}
      {!celular && (
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
      )}
    </aside>
  )

  // Desktop: menu fixo na lateral, como sempre.
  if (!celular) return menu

  // Celular: barra no topo com o botão que abre a gaveta; a gaveta desliza por cima.
  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px',
          background: 'linear-gradient(90deg, #0f2236, #1A3C5A)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => setGavetaAberta(true)}
          aria-label="Abrir menu"
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #16A34A, #1A3C5A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>PA</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>PrevAtendimento</span>
        </div>
      </header>

      {gavetaAberta && (
        <div
          onClick={() => setGavetaAberta(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {menu}
    </>
  )
}
