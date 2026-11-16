'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, UserCog, BarChart3, Radar, Flag, ShieldAlert, BellRing,
  Settings, LogOut, Menu, X, AlertTriangle, Smartphone, CircleUser,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarNome } from '@/lib/utils'
import type { UsuarioRole } from '@/lib/tipos'

const itensMenu: { chave: string; href: string; label: string; icone: typeof Radar }[] = [
  // '/dashboard' é prefixo de todas as rotas; o item ativo usa match exato nele.
  { chave: 'inicio', href: '/dashboard', label: 'Início', icone: LayoutDashboard },
  { chave: 'monitor', href: '/dashboard/monitor', label: 'Monitor Diário', icone: Radar },
  { chave: 'acoes', href: '/dashboard/acoes', label: 'Ações necessárias', icone: AlertTriangle },
  { chave: 'marcozero', href: '/dashboard/marco-zero', label: 'Marco Zero', icone: Flag },
  { chave: 'cobrancas', href: '/dashboard/cobrancas', label: 'Cobranças', icone: BellRing },
  { chave: 'auditoria', href: '/dashboard/auditoria', label: 'Auditoria', icone: ShieldAlert },
  { chave: 'desempenho', href: '/dashboard/desempenho', label: 'Desempenho', icone: BarChart3 },
  { chave: 'colaboradores', href: '/dashboard/colaboradores', label: 'Colaboradores', icone: UserCog },
  { chave: 'configuracoes', href: '/dashboard/configuracoes', label: 'Configurações', icone: Settings },
  { chave: 'laboratorio', href: '/dashboard/conversas', label: 'Laboratório WhatsApp', icone: Smartphone },
]

export default function Sidebar({
  role = 'COLABORADOR',
  telasPermitidas = [],
  contadores = {},
  nome = null,
}: {
  role?: UsuarioRole
  telasPermitidas?: string[]
  contadores?: { acoes?: number; abertas?: number; finalizadas?: number }
  nome?: string | null
  email?: string | null
  rotulo?: string
  atendente?: string | null
  entrouEm?: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [gavetaAberta, setGavetaAberta] = useState(false)

  // Trocar de tela fecha a gaveta do celular.
  useEffect(() => { setGavetaAberta(false) }, [pathname])

  // A classe no <body> liga a gaveta e o véu (o estilo.css cuida da animação).
  useEffect(() => {
    document.body.classList.toggle('menu-aberto', gavetaAberta)
    return () => { document.body.classList.remove('menu-aberto') }
  }, [gavetaAberta])

  // Esc fecha a gaveta (Regra 55 / Regra 43 item 7).
  useEffect(() => {
    if (!gavetaAberta) return
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setGavetaAberta(false) }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [gavetaAberta])

  const permitido = new Set(telasPermitidas)
  const itens = itensMenu.filter((i) => permitido.has(i.chave))

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const acoesN = contadores.acoes ?? 0

  return (
    <>
      <header className="topo">
        <button className="botao-menu" type="button" aria-controls="menu" aria-expanded={gavetaAberta} onClick={() => setGavetaAberta(true)}>
          <Menu className="icone" aria-hidden="true" focusable="false" />
          Menu
          {acoesN > 0 && <span className="contador"><span className="so-leitor">pendências: </span>{acoesN.toLocaleString('pt-BR')}</span>}
        </button>
        <span className="topo-nome">PrevAtendimento</span>
      </header>

      <div className="veu-menu" aria-hidden="true" onClick={() => setGavetaAberta(false)} />

      <div className="lateral" id="menu">
        <div className="lateral-marca">
          <span className="marca-p" aria-hidden="true">A</span>
          <span><span className="marca-nome">PrevAtendimento</span><span className="marca-sub">Central de Atendimento</span></span>
          <button className="lateral-fechar" type="button" aria-label="Fechar o menu" title="Fechar o menu" onClick={() => setGavetaAberta(false)}>
            <X className="icone" aria-hidden="true" focusable="false" />
          </button>
        </div>

        <nav className="lateral-nav" aria-label="Menu principal">
          <div className="grupo"><ul>
            {itens.map((item) => {
              const { href, label, icone: Icone, chave } = item
              const ativo = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <li key={chave}>
                  <Link className="item" href={href} aria-current={ativo ? 'page' : undefined}>
                    <Icone className="icone" aria-hidden="true" focusable="false" />
                    <span>{label}</span>
                    {chave === 'acoes' && acoesN > 0 && (
                      <span className="contador"><span className="so-leitor">pendências: </span>{acoesN.toLocaleString('pt-BR')}</span>
                    )}
                  </Link>
                </li>
              )
            })}
            <li>
              <Link className="item" href="/dashboard/conta" aria-current={pathname.startsWith('/dashboard/conta') ? 'page' : undefined}>
                <CircleUser className="icone" aria-hidden="true" focusable="false" />
                <span>Minha conta</span>
              </Link>
            </li>
          </ul></div>
        </nav>

        <div className="lateral-pe">
          <span className="usuario-nome">{nome ? formatarNome(nome) : 'Minha conta'}</span>
          <button className="botao-sair" type="button" onClick={handleSair}>
            <LogOut className="icone icone-p" aria-hidden="true" focusable="false" />Sair da conta
          </button>
        </div>
      </div>
    </>
  )
}
