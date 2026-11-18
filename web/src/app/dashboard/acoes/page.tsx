import Link from 'next/link'
import { AlertTriangle, UserX, ChevronRight, CheckCircle2, ChevronDown } from 'lucide-react'
import { getAcoes, type SecaoAcao } from '@/lib/acoes'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import SemPermissao from '@/components/SemPermissao'

export const dynamic = 'force-dynamic'

// Ícones por chave (cada ação escolhe o seu em lib/acoes.ts).
const ICONES: Record<string, typeof UserX> = {
  'user-x': UserX,
}

// Âncora do detalhe: o cartão escolhido leva a tela até o detalhe, que abre logo abaixo dele (A1).
const ANCORA = 'detalhe-acao'

export default async function AcoesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const [{ tipo }, papel, mapa] = await Promise.all([searchParams, getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'acoes', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Ações necessárias</h1></div></div>
        <SemPermissao tela="Ações necessárias" />
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
          <h1 className="titulo">Ações necessárias</h1>
          <p className="subtitulo">
            Situações que o sistema encontrou nas conversas abertas e que a equipe precisa corrigir. Clique num cartão para ver os detalhes.
            {restrito ? ' Mostrando apenas as suas conversas.' : ''}
          </p>
          <p className="texto-apoio" style={{ marginTop: 4 }}><SeloAtualizacao /></p>
        </div>
      </div>

      {!selecionada && totalPendencias === 0 && (
        <div className="cartao" style={{ marginBottom: 14 }}>
          <p className="pend-nada" style={{ paddingTop: 13 }}>
            <CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> Tudo em dia. Nenhuma ação necessária no momento.
          </p>
        </div>
      )}

      {/* Cartões (um por tipo de ação). O detalhe abre logo abaixo do cartão escolhido, ocupando a linha toda. */}
      <div className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {secoes.map((s) => (
          <Bloco key={s.chave} secao={s} aberto={selecionada?.chave === s.chave} />
        ))}
      </div>
    </main>
  )
}

function Bloco({ secao, aberto }: { secao: SecaoAcao; aberto: boolean }) {
  return (
    <>
      <Card secao={secao} aberto={aberto} />
      {aberto && (
        <div style={{ gridColumn: '1 / -1' }}>
          <Detalhe secao={secao} />
        </div>
      )}
    </>
  )
}

function Card({ secao, aberto }: { secao: SecaoAcao; aberto: boolean }) {
  const Icone = ICONES[secao.icone] ?? AlertTriangle
  const n = secao.itens.length
  const temPendencia = n > 0
  const href = aberto ? '/dashboard/acoes' : `/dashboard/acoes?tipo=${secao.chave}#${ANCORA}`
  return (
    <Link href={href} className={`mon-num${aberto ? ' ativo' : ''}`} aria-current={aberto ? 'true' : undefined}>
      <dl style={{ margin: 0 }}>
        <dt><Icone className="icone" aria-hidden="true" focusable="false" />{secao.titulo}</dt>
        <dd style={{ color: temPendencia ? 'var(--atencao)' : 'var(--tinta-3)' }}>{n.toLocaleString('pt-BR')}</dd>
      </dl>
      <div className="pista" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--t-pequeno)' }}>
        {temPendencia ? (
          <>
            {aberto ? 'Fechar os detalhes' : `${n === 1 ? '1 para corrigir' : `${n.toLocaleString('pt-BR')} para corrigir`} · ver detalhes`}
            <ChevronDown className="icone icone-p" style={{ transform: aberto ? 'rotate(180deg)' : 'none' }} aria-hidden="true" focusable="false" />
          </>
        ) : (
          <><CheckCircle2 className="icone icone-p" style={{ color: 'var(--sucesso)' }} aria-hidden="true" focusable="false" /> Tudo certo</>
        )}
      </div>
    </Link>
  )
}

function Detalhe({ secao }: { secao: SecaoAcao }) {
  const n = secao.itens.length
  return (
    <section className="cartao" id={ANCORA} tabIndex={-1} aria-labelledby={`${ANCORA}-titulo`} style={{ scrollMarginTop: 16 }}>
      <div className="cartao-cabeca">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 className="cartao-titulo" id={`${ANCORA}-titulo`}>{secao.titulo}</h2>
          <span className={`selo ${n > 0 ? 'selo-atencao' : 'selo-sucesso'}`}>{n === 0 ? 'Tudo certo' : n === 1 ? '1 para corrigir' : `${n.toLocaleString('pt-BR')} para corrigir`}</span>
        </div>
        <Link href="/dashboard/acoes" className="botao botao-discreto">Fechar os detalhes</Link>
      </div>
      <p className="texto-apoio" style={{ padding: '0 16px 10px' }}>{secao.descricao}</p>
      {n === 0 ? (
        <p className="pend-nada"><CheckCircle2 className="icone" aria-hidden="true" focusable="false" /> Nada a corrigir aqui.</p>
      ) : (
        <ul className="mon-lista">
          {secao.itens.map((it) => (
            <li key={it.id} className="mon-item">
              <div>
                <div className="mon-nome-linha">
                  <span className="mon-nome">{it.titulo}</span>
                  {it.alerta && <span className="selo selo-atencao">Cadastro sem nome</span>}
                </div>
                <div className="mon-meta">{it.subtitulo}</div>
              </div>
              {it.protocolo_id && (
                <div className="mon-dir">
                  <Link href={`/dashboard/monitor/${it.protocolo_id}`} className="mon-abrir" style={{ minHeight: 'var(--alvo)' }}>
                    Ver conversa <ChevronRight className="icone" aria-hidden="true" focusable="false" />
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
