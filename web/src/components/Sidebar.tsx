'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, UserCog, BarChart3, Radar, Flag, ShieldAlert, BellRing,
  Settings, LogOut, Menu, X, AlertTriangle, Smartphone, CircleUser, Loader2,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarNome } from '@/lib/utils'
import { useAvisoPe } from '@/components/AvisoPe'
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

/** Nome da tela atual, para o topo do celular responder "onde estou?" (skill §16). */
function nomeDaTela(pathname: string): string {
  if (pathname.startsWith('/dashboard/conta')) return 'Minha conta'
  const item = [...itensMenu]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))
  return item?.label ?? 'PrevAtendimento'
}

/* ---------- Física da gaveta (a mesma de docs/apple-design/comportamento.js) ---------- */
// Mola com dois parâmetros, como a Apple: resposta (s) e amortecimento (1 = sem quique).
function mola({ de, para, velocidade = 0, resposta = 0.32, aoMudar, aoFim }: {
  de: number; para: number; velocidade?: number; resposta?: number; aoMudar: (x: number) => void; aoFim?: () => void
}) {
  const k = Math.pow((2 * Math.PI) / resposta, 2)
  const c = (4 * Math.PI) / resposta
  let x = de, v = velocidade, ultimo = performance.now(), id = 0, parado = false
  const passo = (agora: number) => {
    if (parado) return
    const dt = Math.min((agora - ultimo) / 1000, 1 / 30)
    ultimo = agora
    for (let i = 0; i < 4; i++) { const h = dt / 4; const a = -k * (x - para) - c * v; v += a * h; x += v * h }
    if (Math.abs(x - para) < 0.5 && Math.abs(v) < 3) { x = para; v = 0; aoMudar(x); aoFim?.(); return }
    aoMudar(x)
    id = requestAnimationFrame(passo)
  }
  id = requestAnimationFrame(passo)
  return { parar() { parado = true; cancelAnimationFrame(id); return x } }
}
// Projeção do impulso: para onde o gesto está indo.
const projetar = (v: number, taxa = 0.998) => ((v / 1000) * taxa) / (1 - taxa)
// Borda elástica: quanto mais passa do limite, menos acompanha.
const elastico = (excesso: number, dimensao: number, c = 0.55) => (excesso * dimensao * c) / (dimensao + c * Math.abs(excesso))
const reduzMovimento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const semMenuFixo = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches

const SELETOR_FOCO = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
  void role
  const pathname = usePathname()
  const sp = useSearchParams()
  const router = useRouter()
  const { avisar } = useAvisoPe()
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSair, setErroSair] = useState<string | null>(null)
  const [carregandoTela, setCarregandoTela] = useState(false)

  const lateralRef = useRef<HTMLDivElement>(null)
  const botaoMenuRef = useRef<HTMLButtonElement>(null)
  const fecharRef = useRef<HTMLButtonElement>(null)
  const molaRef = useRef<{ parar: () => number } | null>(null)
  const dxRef = useRef(0)

  const larguraMenu = () => (lateralRef.current ? lateralRef.current.getBoundingClientRect().width + 24 : 340)

  const pintar = useCallback((x: number) => {
    dxRef.current = x
    lateralRef.current?.style.setProperty('--dx', `${x}px`)
    const larg = lateralRef.current ? lateralRef.current.getBoundingClientRect().width + 24 : 340
    document.body.style.setProperty('--veu-opacidade', String(Math.max(0, Math.min(1, 1 + x / larg))))
  }, [])

  const mover = useCallback((para: number, velocidade = 0, aoFim?: () => void) => {
    if (molaRef.current) dxRef.current = molaRef.current.parar()
    molaRef.current = null
    if (reduzMovimento()) { pintar(para); aoFim?.(); return }
    molaRef.current = mola({ de: dxRef.current, para, velocidade, aoMudar: pintar, aoFim: () => { molaRef.current = null; aoFim?.() } })
  }, [pintar])

  // Abre: a gaveta nasce fora da tela, à esquerda, e vem pela mola; o cursor vai para "Fechar o menu".
  const abrir = useCallback(() => {
    if (!document.body.classList.contains('menu-aberto')) {
      pintar(-larguraMenu())
      document.body.classList.add('menu-aberto')
    }
    setGavetaAberta(true)
    mover(0)
    requestAnimationFrame(() => fecharRef.current?.focus())
  }, [mover, pintar])

  // Fecha pelo mesmo caminho por onde veio (skill §7); o cursor volta ao botão Menu.
  const fechar = useCallback((velocidade = 0, devolverFoco = true) => {
    if (!document.body.classList.contains('menu-aberto')) { setGavetaAberta(false); return }
    setGavetaAberta(false)
    mover(-larguraMenu(), velocidade, () => {
      document.body.classList.remove('menu-aberto')
      lateralRef.current?.style.removeProperty('--dx')
      document.body.style.removeProperty('--veu-opacidade')
      if (devolverFoco && semMenuFixo()) botaoMenuRef.current?.focus()
    })
  }, [mover])

  // Trocar de tela fecha a gaveta e encerra a faixa de carregamento.
  const busca = sp.toString()
  useEffect(() => {
    setCarregandoTela(false)
    if (document.body.classList.contains('menu-aberto')) fechar(0, false)
  }, [pathname, busca, fechar])

  // A faixa avança devagar enquanto a tela nova não chega; some sozinha se algo der errado (15 s).
  const [progresso, setProgresso] = useState(0)
  useEffect(() => {
    if (!carregandoTela) { setProgresso(0); return }
    const a = requestAnimationFrame(() => setProgresso(85))
    const t = setTimeout(() => setCarregandoTela(false), 15000)
    return () => { cancelAnimationFrame(a); clearTimeout(t) }
  }, [carregandoTela])

  useEffect(() => () => {
    document.body.classList.remove('menu-aberto')
    document.body.style.removeProperty('--veu-opacidade')
    molaRef.current?.parar()
  }, [])

  // Teclado com a gaveta aberta: Esc fecha, Tab fica preso nela (Regra 43 item 7; DECISOES peça 13).
  useEffect(() => {
    if (!gavetaAberta) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (!semMenuFixo()) return
      if (e.key === 'Escape') { e.preventDefault(); fechar(); return }
      if (e.key !== 'Tab' || !lateralRef.current) return
      const f = [...lateralRef.current.querySelectorAll<HTMLElement>(SELETOR_FOCO)].filter((el) => el.getClientRects().length > 0)
      if (!f.length) return
      const primeiro = f[0], ultimo = f[f.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      else if (!lateralRef.current.contains(document.activeElement)) { e.preventDefault(); primeiro.focus() }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [gavetaAberta, fechar])

  // Arrasto 1:1 da gaveta, com limiar de 10 px antes de decidir a direção, e projeção do impulso na soltura.
  useEffect(() => {
    const lateral = lateralRef.current
    if (!lateral) return
    let inicio: { x: number; y: number } | null = null
    let decidido = false, horizontal = false, base = 0
    const pts: { p: number; t: number }[] = []
    const add = (p: number) => { pts.push({ p, t: performance.now() }); if (pts.length > 6) pts.shift() }
    const velocidade = () => {
      if (pts.length < 2) return 0
      const a = pts[0], b = pts[pts.length - 1]
      const dt = (b.t - a.t) / 1000
      return dt > 0 ? (b.p - a.p) / dt : 0
    }
    const baixo = (e: PointerEvent) => {
      if (!document.body.classList.contains('menu-aberto') || e.button !== 0 || !semMenuFixo()) return
      if (molaRef.current) { dxRef.current = molaRef.current.parar(); molaRef.current = null }
      inicio = { x: e.clientX, y: e.clientY }; decidido = false; horizontal = false; base = dxRef.current
      pts.length = 0; add(e.clientX)
    }
    const move = (e: PointerEvent) => {
      if (!inicio) return
      const mx = e.clientX - inicio.x, my = e.clientY - inicio.y
      if (!decidido) {
        if (Math.hypot(mx, my) < 10) return
        decidido = true; horizontal = Math.abs(mx) > Math.abs(my)
        if (horizontal) lateral.setPointerCapture(e.pointerId); else { inicio = null; return }
      }
      add(e.clientX)
      let alvo = base + mx
      if (alvo > 0) alvo = elastico(alvo, larguraMenu())
      pintar(alvo)
    }
    const soltar = () => {
      if (!inicio) return
      const foiArrasto = decidido && horizontal
      inicio = null
      if (!foiArrasto) return
      const v = velocidade()
      const destino = dxRef.current + projetar(v)
      if (destino < -larguraMenu() / 2) fechar(v); else mover(0, v)
    }
    lateral.addEventListener('pointerdown', baixo)
    lateral.addEventListener('pointermove', move)
    lateral.addEventListener('pointerup', soltar)
    lateral.addEventListener('pointercancel', soltar)
    return () => {
      lateral.removeEventListener('pointerdown', baixo)
      lateral.removeEventListener('pointermove', move)
      lateral.removeEventListener('pointerup', soltar)
      lateral.removeEventListener('pointercancel', soltar)
    }
  }, [fechar, mover, pintar])

  // Faixa fina de carregamento na troca de tela (Regra 43 item 1): liga no clique de um link
  // interno ou quando um filtro avisa que vai mudar o endereço; desliga quando a tela nova chega.
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest('a')
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      setCarregandoTela(true)
    }
    const aoNavegar = () => setCarregandoTela(true)
    document.addEventListener('click', aoClicar)
    window.addEventListener('prevatendimento:navegando', aoNavegar)
    return () => {
      document.removeEventListener('click', aoClicar)
      window.removeEventListener('prevatendimento:navegando', aoNavegar)
    }
  }, [])

  // Aviso do pé deixado por uma tela que fica fora do painel (ex.: Nova senha) antes de trazer a pessoa para cá.
  useEffect(() => {
    try {
      const texto = sessionStorage.getItem('avisoPePendente')
      if (texto) { sessionStorage.removeItem('avisoPePendente'); avisar({ texto }) }
    } catch { /* sem armazenamento: segue sem o aviso */ }
  }, [pathname, avisar])

  const permitido = new Set(telasPermitidas)
  const itens = itensMenu.filter((i) => permitido.has(i.chave))

  async function handleSair() {
    setSaindo(true); setErroSair(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch {
      setSaindo(false)
      setErroSair('Não foi possível sair agora. Confira a internet e tente de novo.')
    }
  }

  const acoesN = contadores.acoes ?? 0
  const telaAtual = nomeDaTela(pathname)

  return (
    <>
      {carregandoTela && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 120, background: 'var(--acao-suave)', overflow: 'hidden' }}
        >
          <div style={{ height: '100%', width: `${Math.max(12, progresso)}%`, background: 'var(--acao)', borderRadius: '0 3px 3px 0', transition: 'width 8s cubic-bezier(.1,.7,.2,1)' }} />
        </div>
      )}

      <header className="topo">
        <button ref={botaoMenuRef} className="botao-menu" type="button" aria-controls="menu" aria-expanded={gavetaAberta} onClick={abrir}>
          <Menu className="icone" aria-hidden="true" focusable="false" />
          Menu
          {acoesN > 0 && <span className="contador"><span className="so-leitor">pendências: </span>{acoesN.toLocaleString('pt-BR')}</span>}
        </button>
        <span className="topo-nome">{telaAtual}</span>
      </header>

      <div className="veu-menu" aria-hidden="true" onClick={() => fechar()} />

      <div
        ref={lateralRef}
        className="lateral"
        id="menu"
        role={gavetaAberta ? 'dialog' : undefined}
        aria-modal={gavetaAberta ? true : undefined}
        aria-label={gavetaAberta ? 'Menu' : undefined}
      >
        <div className="lateral-marca">
          <span className="marca-p" aria-hidden="true">A</span>
          <span><span className="marca-nome">PrevAtendimento</span><span className="marca-sub">Central de Atendimento</span></span>
          <button ref={fecharRef} className="lateral-fechar" type="button" aria-label="Fechar o menu" title="Fechar o menu" onClick={() => fechar()}>
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
          <button className="botao-sair" type="button" onClick={handleSair} disabled={saindo} aria-busy={saindo || undefined}>
            {saindo
              ? <><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" />Saindo…</>
              : <><LogOut className="icone icone-p" aria-hidden="true" focusable="false" />Sair da conta</>}
          </button>
          {erroSair && <p className="erro-campo" role="alert" style={{ width: '100%' }}>{erroSair}</p>}
        </div>
      </div>
    </>
  )
}
