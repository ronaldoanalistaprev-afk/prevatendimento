import Link from 'next/link'
import { getCatalogoPrevidenciario } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import Expansivel from '@/components/Expansivel'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { BookMarked, ArrowLeft } from 'lucide-react'
import type { RefTipoBeneficio, RefTipoServico } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

// Uma linha padronizada (mesmo formato para benefícios e serviços).
function LinhaItem({ esquerda, nome, direita }: { esquerda?: React.ReactNode; nome: string; direita?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: '1px solid #F1F5F9' }}>
      <div style={{ width: 64, flexShrink: 0 }}>{esquerda}</div>
      <span style={{ flex: 1, color: '#374151', fontSize: 13.5 }}>{nome}</span>
      {direita}
    </div>
  )
}

function SubSecao({ titulo, n, children }: { titulo: string; n: number; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B7280', padding: '12px 20px 2px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {titulo} <span style={{ color: '#CBD5E1' }}>({n})</span>
      </div>
      {n === 0 ? (
        <div style={{ padding: '6px 20px 12px', color: '#9CA3AF', fontSize: 13 }}>Nenhum neste regime.</div>
      ) : (
        children
      )}
    </div>
  )
}

function ChipCodigo({ codigo }: { codigo: string | null }) {
  return (
    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, color: '#1A3C5A', background: '#F1F5F9', padding: '2px 6px', borderRadius: 6 }}>
      {codigo ?? '—'}
    </span>
  )
}

function Bloco({ regime, cor, beneficios, servicos }: { regime: 'RGPS' | 'RPPS'; cor: string; beneficios: RefTipoBeneficio[]; servicos: RefTipoServico[] }) {
  const info = regime === 'RGPS'
    ? { titulo: 'RGPS — Regime Geral', sub: 'Trabalhadores da iniciativa privada (INSS)' }
    : { titulo: 'RPPS — Regime Próprio', sub: 'Servidores públicos (regimes próprios)' }
  return (
    <Expansivel titulo={info.titulo} subtitulo={`${info.sub} · ${beneficios.length} benefícios, ${servicos.length} serviços`} corBorda={cor} corTitulo={cor} inicialAberto={false}>
      <SubSecao titulo="Benefícios" n={beneficios.length}>
        {beneficios.map((b) => (
          <LinhaItem
            key={b.id}
            esquerda={regime === 'RGPS' ? <ChipCodigo codigo={b.codigo} /> : null}
            nome={b.nome}
            direita={b.exige_modalidade ? <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>exige subtipo</span> : null}
          />
        ))}
      </SubSecao>
      <SubSecao titulo="Serviços" n={servicos.length}>
        {servicos.map((s) => (
          <LinhaItem key={s.id} nome={s.nome} />
        ))}
      </SubSecao>
      <div style={{ height: 8 }} />
    </Expansivel>
  )
}

export default async function CatalogoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Você não tem acesso a esta tela.</div>
      </div>
    )
  }

  const { beneficios, servicos, fases } = await getCatalogoPrevidenciario()
  const configurado = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const bRgps = beneficios.filter((b) => b.regime === 'RGPS')
  const bRpps = beneficios.filter((b) => b.regime === 'RPPS')
  const sRgps = servicos.filter((s) => s.regime === 'RGPS')
  const sRpps = servicos.filter((s) => s.regime === 'RPPS')
  const sAmbos = servicos.filter((s) => s.regime === 'RGPS_RPPS')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/dashboard/configuracoes" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Configurações
      </Link>
      <div style={{ margin: '12px 0 22px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookMarked size={22} style={{ color: '#16A34A' }} /> Catálogo Previdenciário
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Separado por regime. Clique num bloco para expandir ou retrair. <b>&quot;exige subtipo&quot;</b> = benefício com modalidade (ex.: Aposentadoria por idade, por tempo, especial…).
        </p>
      </div>

      {!configurado && <BannerConfig />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Bloco regime="RGPS" cor="#1D4ED8" beneficios={bRgps} servicos={sRgps} />
        <Bloco regime="RPPS" cor="#7E22CE" beneficios={bRpps} servicos={sRpps} />

        <Expansivel titulo="Serviços dos dois regimes" subtitulo={`Valem para RGPS e RPPS · ${sAmbos.length} serviços`} corBorda="#15803D" corTitulo="#15803D" inicialAberto={false}>
          {sAmbos.map((s) => (
            <LinhaItem key={s.id} nome={s.nome} />
          ))}
          <div style={{ height: 8 }} />
        </Expansivel>

        <Expansivel titulo="Fases do processo" subtitulo={`${fases.length} fases`} corBorda="#64748B" corTitulo="#1A3C5A" inicialAberto={false}>
          {fases.map((f) => (
            <LinhaItem
              key={f.id}
              esquerda={<span style={{ fontFamily: 'ui-monospace, monospace', color: '#9CA3AF', fontSize: 12.5 }}>{f.ordem}</span>}
              nome={f.nome}
              direita={<span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{f.orgao}</span>}
            />
          ))}
          <div style={{ height: 8 }} />
        </Expansivel>
      </div>
    </div>
  )
}
