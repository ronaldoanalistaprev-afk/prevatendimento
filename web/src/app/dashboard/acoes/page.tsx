import Link from 'next/link'
import { AlertTriangle, UserX, ChevronRight, CheckCircle2, ChevronDown, Check } from 'lucide-react'
import { getAcoes, type SecaoAcao } from '@/lib/acoes'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import SeloAtualizacao from '@/components/SeloAtualizacao'

export const dynamic = 'force-dynamic'

// Ícones por chave (cada ação escolhe o seu em lib/acoes.ts).
const ICONES: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  'user-x': UserX,
}

export default async function AcoesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const [{ tipo }, papel, mapa] = await Promise.all([searchParams, getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'acoes', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Você não tem acesso a esta tela.
        </div>
      </div>
    )
  }

  const secoes = await getAcoes()
  const selecionada = tipo ? secoes.find((s) => s.chave === tipo) ?? null : null
  const restrito = !papel.verTudo
  const totalPendencias = secoes.reduce((n, s) => n + s.itens.length, 0)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={22} style={{ color: '#C2410C' }} /> Ações necessárias
          </h1>
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Situações que o sistema encontrou nas conversas abertas e que a equipe precisa corrigir. Clique num card para ver os detalhes.
          {restrito ? ' Mostrando apenas as suas conversas.' : ''}
        </p>
      </div>

      {/* Painel de cards (um por tipo de ação) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
        {secoes.map((s) => (
          <Card key={s.chave} secao={s} aberto={selecionada?.chave === s.chave} />
        ))}
      </div>

      {/* Detalhe da ação aberta */}
      {selecionada && <Detalhe secao={selecionada} />}

      {!selecionada && totalPendencias === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '36px 20px', textAlign: 'center', color: '#15803D', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={28} /> Tudo em dia. Nenhuma ação necessária no momento.
        </div>
      )}
    </div>
  )
}

function Card({ secao, aberto }: { secao: SecaoAcao; aberto: boolean }) {
  const Icone = ICONES[secao.icone] ?? AlertTriangle
  const n = secao.itens.length
  const temPendencia = n > 0
  // Clicar abre; clicar de novo fecha (toggle via ?tipo).
  const href = aberto ? '/dashboard/acoes' : `/dashboard/acoes?tipo=${secao.chave}`
  return (
    <Link
      href={href}
      style={{
        display: 'block', textDecoration: 'none',
        background: '#fff', borderRadius: 14, padding: '14px 16px',
        border: aberto ? '2px solid #1A3C5A' : '1px solid #EEF2F7',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Icone size={18} style={{ color: temPendencia ? '#C2410C' : '#15803D' }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '2px 10px',
          background: temPendencia ? '#FEF3C7' : '#DCFCE7', color: temPendencia ? '#C2410C' : '#15803D',
        }}>
          {temPendencia ? n : <Check size={13} aria-label="tudo certo" />}
        </span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A3C5A', marginTop: 8 }}>{secao.titulo}</div>
      <div style={{ fontSize: 12, color: temPendencia ? '#B45309' : '#15803D', fontWeight: 600, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {temPendencia ? (
          <>
            {aberto ? 'vendo abaixo' : `${n} para corrigir`}
            <ChevronDown size={14} style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
          </>
        ) : (
          'tudo certo'
        )}
      </div>
    </Link>
  )
}

function Detalhe({ secao }: { secao: SecaoAcao }) {
  const Icone = ICONES[secao.icone] ?? AlertTriangle
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Icone size={18} style={{ color: '#C2410C' }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A' }}>{secao.titulo}</h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: secao.itens.length > 0 ? '#C2410C' : '#15803D', background: secao.itens.length > 0 ? '#FEF3C7' : '#DCFCE7', borderRadius: 999, padding: '2px 10px' }}>
          {secao.itens.length}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 12 }}>{secao.descricao}</p>

      {secao.itens.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontSize: 13.5, padding: '8px 0' }}>
          <CheckCircle2 size={16} /> Nada a corrigir aqui.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {secao.itens.map((it) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 12, border: '1px solid #EEF2F7', background: '#fff' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: it.alerta ? '#C2410C' : '#1A3C5A' }}>{it.titulo}</div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>{it.subtitulo}</div>
              </div>
              {it.protocolo_id && (
                <Link
                  href={`/dashboard/monitor/${it.protocolo_id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 9, background: '#1A3C5A', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Ver conversa <ChevronRight size={15} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
