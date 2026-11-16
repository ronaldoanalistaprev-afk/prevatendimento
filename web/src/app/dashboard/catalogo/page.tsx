import Link from 'next/link'
import { getCatalogoPrevidenciario } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import Expansivel from '@/components/Expansivel'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { BookMarked, ArrowLeft } from 'lucide-react'
import type { RefTipoBeneficio, RefTipoServico } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

function LinhaItem({ esquerda, nome, direita }: { esquerda?: React.ReactNode; nome: string; direita?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: '1px solid var(--linha)' }}>
      <div style={{ width: 64, flexShrink: 0 }}>{esquerda}</div>
      <span style={{ flex: 1, color: 'var(--tinta-2)', fontSize: 14 }}>{nome}</span>
      {direita}
    </div>
  )
}

function SubSecao({ titulo, n, children }: { titulo: string; n: number; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tinta-3)', padding: '12px 20px 2px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {titulo} <span style={{ color: 'var(--tinta-3)' }}>({n})</span>
      </div>
      {n === 0 ? <div style={{ padding: '6px 20px 12px', color: 'var(--tinta-3)', fontSize: 13 }}>Nenhum neste regime.</div> : children}
    </div>
  )
}

function ChipCodigo({ codigo }: { codigo: string | null }) {
  return <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--tinta)', background: 'var(--recuo-2)', padding: '2px 6px', borderRadius: 6 }}>{codigo ?? '—'}</span>
}

function Bloco({ regime, beneficios, servicos }: { regime: 'RGPS' | 'RPPS'; beneficios: RefTipoBeneficio[]; servicos: RefTipoServico[] }) {
  const info = regime === 'RGPS'
    ? { titulo: 'RGPS — Regime Geral', sub: 'Trabalhadores da iniciativa privada (INSS)' }
    : { titulo: 'RPPS — Regime Próprio', sub: 'Servidores públicos (regimes próprios)' }
  return (
    <Expansivel titulo={info.titulo} subtitulo={`${info.sub} · ${beneficios.length} benefícios, ${servicos.length} serviços`} inicialAberto={false}>
      <SubSecao titulo="Benefícios" n={beneficios.length}>
        {beneficios.map((b) => (
          <LinhaItem key={b.id} esquerda={regime === 'RGPS' ? <ChipCodigo codigo={b.codigo} /> : null} nome={b.nome} direita={b.exige_modalidade ? <span className="selo selo-atencao">exige subtipo</span> : null} />
        ))}
      </SubSecao>
      <SubSecao titulo="Serviços" n={servicos.length}>
        {servicos.map((s) => (<LinhaItem key={s.id} nome={s.nome} />))}
      </SubSecao>
      <div style={{ height: 8 }} />
    </Expansivel>
  )
}

export default async function CatalogoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
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
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1000 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <div style={{ margin: '12px 0 22px' }}>
        <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookMarked className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Catálogo Previdenciário
        </h1>
        <p className="subtitulo">Separado por regime. Clique num bloco para expandir ou retrair. <b>&quot;exige subtipo&quot;</b> = benefício com modalidade (ex.: Aposentadoria por idade, por tempo, especial…).</p>
      </div>

      {!configurado && <BannerConfig />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Bloco regime="RGPS" beneficios={bRgps} servicos={sRgps} />
        <Bloco regime="RPPS" beneficios={bRpps} servicos={sRpps} />

        <Expansivel titulo="Serviços dos dois regimes" subtitulo={`Valem para RGPS e RPPS · ${sAmbos.length} serviços`} inicialAberto={false}>
          {sAmbos.map((s) => (<LinhaItem key={s.id} nome={s.nome} />))}
          <div style={{ height: 8 }} />
        </Expansivel>

        <Expansivel titulo="Fases do processo" subtitulo={`${fases.length} fases`} inicialAberto={false}>
          {fases.map((f) => (
            <LinhaItem key={f.id} esquerda={<span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--tinta-3)', fontSize: 12.5 }}>{f.ordem}</span>} nome={f.nome} direita={<span style={{ fontSize: 12.5, color: 'var(--tinta-2)', whiteSpace: 'nowrap' }}>{f.orgao}</span>} />
          ))}
          <div style={{ height: 8 }} />
        </Expansivel>
      </div>
    </main>
  )
}
