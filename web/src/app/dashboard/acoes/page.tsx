import Link from 'next/link'
import { AlertTriangle, UserX, ChevronRight, CheckCircle2, ChevronDown, Check } from 'lucide-react'
import { getAcoes, type SecaoAcao } from '@/lib/acoes'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import SeloAtualizacao from '@/components/SeloAtualizacao'

export const dynamic = 'force-dynamic'

// Ícones por chave (cada ação escolhe o seu em lib/acoes.ts).
const ICONES: Record<string, typeof UserX> = {
  'user-x': UserX,
}

export default async function AcoesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const [{ tipo }, papel, mapa] = await Promise.all([searchParams, getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'acoes', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }

  const secoes = await getAcoes()
  const selecionada = tipo ? secoes.find((s) => s.chave === tipo) ?? null : null
  const restrito = !papel.verTudo
  const totalPendencias = secoes.reduce((n, s) => n + s.itens.length, 0)

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle className="icone icone-g" style={{ color: 'var(--atencao)' }} aria-hidden="true" focusable="false" /> Ações necessárias
          </h1>
          <p className="subtitulo">
            Situações que o sistema encontrou nas conversas abertas e que a equipe precisa corrigir. Clique num cartão para ver os detalhes.
            {restrito ? ' Mostrando apenas as suas conversas.' : ''}
          </p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {/* Cartões (um por tipo de ação) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
        {secoes.map((s) => (<Card key={s.chave} secao={s} aberto={selecionada?.chave === s.chave} />))}
      </div>

      {selecionada && <Detalhe secao={selecionada} />}

      {!selecionada && totalPendencias === 0 && (
        <div className="aviso aviso-info" style={{ fontSize: 'var(--t-corpo)' }}>
          <CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> Tudo em dia. Nenhuma ação necessária no momento.
        </div>
      )}
    </main>
  )
}

function Card({ secao, aberto }: { secao: SecaoAcao; aberto: boolean }) {
  const Icone = ICONES[secao.icone] ?? AlertTriangle
  const n = secao.itens.length
  const temPendencia = n > 0
  const href = aberto ? '/dashboard/acoes' : `/dashboard/acoes?tipo=${secao.chave}`
  return (
    <Link href={href} className="cartao" style={{ display: 'block', textDecoration: 'none', padding: '14px 16px', boxShadow: aberto ? '0 0 0 1.5px var(--acao)' : 'var(--sombra-cartao)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Icone className="icone" style={{ color: temPendencia ? 'var(--atencao)' : 'var(--sucesso)' }} aria-hidden="true" focusable="false" />
        <span className={`selo ${temPendencia ? 'selo-atencao' : 'selo-sucesso'}`}>
          {temPendencia ? n : <Check className="icone" aria-label="tudo certo" />}
        </span>
      </div>
      <div className="sub-titulo" style={{ marginTop: 8 }}>{secao.titulo}</div>
      <div style={{ fontSize: 13, color: temPendencia ? 'var(--atencao)' : 'var(--sucesso)', fontWeight: 600, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {temPendencia ? (
          <>{aberto ? 'vendo abaixo' : `${n} para corrigir`}<ChevronDown className="icone icone-p" style={{ transform: aberto ? 'rotate(180deg)' : 'none', color: 'inherit' }} aria-hidden="true" focusable="false" /></>
        ) : 'tudo certo'}
      </div>
    </Link>
  )
}

function Detalhe({ secao }: { secao: SecaoAcao }) {
  const Icone = ICONES[secao.icone] ?? AlertTriangle
  return (
    <section className="cartao">
      <div className="cartao-cabeca">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icone className="icone" style={{ color: 'var(--atencao)' }} aria-hidden="true" focusable="false" />
          <h2 className="cartao-titulo">{secao.titulo}</h2>
          <span className={`selo ${secao.itens.length > 0 ? 'selo-atencao' : 'selo-sucesso'}`}>{secao.itens.length}</span>
        </div>
      </div>
      <div className="cartao-corpo">
        <p className="texto-apoio" style={{ marginBottom: 12 }}>{secao.descricao}</p>
        {secao.itens.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sucesso)', fontSize: 14 }}>
            <CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> Nada a corrigir aqui.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {secao.itens.map((it) => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 12, boxShadow: 'inset 0 0 0 1px var(--linha)' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 650, fontSize: 14, color: it.alerta ? 'var(--atencao)' : 'var(--tinta)' }}>{it.titulo}</div>
                  <div className="texto-apoio" style={{ marginTop: 2 }}>{it.subtitulo}</div>
                </div>
                {it.protocolo_id && (
                  <Link href={`/dashboard/monitor/${it.protocolo_id}`} className="botao botao-secundario">Ver conversa <ChevronRight className="icone icone-p" aria-hidden="true" focusable="false" /></Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
