import Link from 'next/link'
import { getAuditoria, MARCOS_AUDITORIA, getDepartamentosAbertos } from '@/lib/dados'
import { getPainelGestor } from '@/lib/gestao'
import FiltroSetor from '@/components/FiltroSetor'
import FiltroAtendente from '@/components/FiltroAtendente'
import FiltroOrdem from '@/components/FiltroOrdem'
import BannerConfig from '@/components/BannerConfig'
import AutoRefresh from '@/components/AutoRefresh'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { formatarTelefone, formatarDataHora, formatarDuracao, formatarNome } from '@/lib/utils'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { ShieldAlert, Archive, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

/** Cor da taxa de "% parado" — sempre acompanhada do número (Regra 46). */
function corTaxa(taxa: number | null): string {
  if (taxa == null) return 'var(--tinta-3)'
  if (taxa >= 20) return 'var(--perigo)'
  if (taxa >= 10) return '#C2410C'
  if (taxa >= 5) return 'var(--atencao)'
  return 'var(--sucesso)'
}

function rotuloMarco(h: number): string {
  return h < 24 ? `${h}h` : `${h / 24}d`
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ marco?: string; dep?: string; atendente?: string; antigos?: string; ordem?: string }> }) {
  const { marco: marcoRaw, dep, atendente, antigos: antigosRaw, ordem } = await searchParams
  const marco = MARCOS_AUDITORIA.includes(Number(marcoRaw)) ? Number(marcoRaw) : 24
  const verAntigos = antigosRaw === '1'
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'auditoria', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }
  const [{ recentes, antigos, backlogCount, totalCount, faixas, estado }, painel, departamentos] = await Promise.all([
    getAuditoria(marco, dep, atendente, ordem),
    getPainelGestor(),
    getDepartamentosAbertos(),
  ])
  const lista = verAntigos ? antigos : recentes
  const alternarAntigos = (ligar: boolean) => {
    const p = new URLSearchParams()
    if (marco !== 24) p.set('marco', String(marco))
    if (dep) p.set('dep', dep)
    if (atendente) p.set('atendente', atendente)
    if (ordem) p.set('ordem', ordem)
    if (ligar) p.set('antigos', '1')
    const s = p.toString()
    return `/dashboard/auditoria${s ? '?' + s : ''}`
  }
  const atendentesComConversa = painel.ranking.filter((r) => r.abertas > 0).map((r) => r.atendente)
  const atendentesSemConversa = painel.ranking.filter((r) => r.abertas === 0).map((r) => r.atendente)
  const temFiltro = Boolean(dep || atendente || marco !== 24)
  const marcoHref = (h: number) => {
    const p = new URLSearchParams()
    if (h !== 24) p.set('marco', String(h))
    if (dep) p.set('dep', dep)
    if (atendente) p.set('atendente', atendente)
    if (ordem) p.set('ordem', ordem)
    if (verAntigos) p.set('antigos', '1')
    const s = p.toString()
    return `/dashboard/auditoria${s ? '?' + s : ''}`
  }
  const placar = painel.ranking
    .filter((p) => p.abertas > 0)
    .map((p) => ({
      colaborador: p.atendente,
      abertas: p.abertas,
      esperando_mais_24h: p.esperando24,
      esperando_recente: p.esperando,
      taxa: p.abertas > 0 ? Math.round((p.esperando24 / p.abertas) * 100) : 0,
    }))
  const maxEsperando = Math.max(1, ...placar.map((p) => p.esperando_mais_24h))

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert className="icone icone-g" style={{ color: 'var(--perigo)' }} aria-hidden="true" focusable="false" /> Auditoria
          </h1>
          <p className="subtitulo">Clientes que <b>falaram por último e ficaram sem resposta</b> há mais de <b style={{ color: 'var(--perigo)' }}>{rotuloMarco(marco)}</b>.</p>
          <p className="texto-apoio" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AutoRefresh /><SeloAtualizacao />
          </p>
        </div>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      <div className="aviso aviso-info" style={{ marginBottom: 16, lineHeight: 1.6 }}>
        <div>
          <b>Para que serve:</b> o Monitor mostra <i>todas</i> as conversas. Esta tela mostra <b>só o problema</b>: o cliente mandou a última mensagem, a bola ficou com o escritório e ninguém respondeu há mais de <b>{rotuloMarco(marco)}</b>.
          <br />
          <b>Como usar:</b> escolha o tempo nos botões abaixo, veja a <b>lista</b> (quem espera há mais tempo vem primeiro), <b>clique no cliente</b> para ler a conversa e decidir — inclusive <b>cobrar o atendente</b>. No fim da página, o quadro mostra como cada atendente está nesse quesito.
        </div>
      </div>

      {/* Marcos de tempo + filtros */}
      <section className="cartao" style={{ marginBottom: 14 }}>
        <div className="mon-barra">
          <span className="mon-rot">Sem resposta há mais de</span>
          <div className="abas">
            {faixas.map((f) => (
              <Link key={f.horas} className="aba" aria-selected={marco === f.horas} href={marcoHref(f.horas)}>
                {rotuloMarco(f.horas)} <span className="selo selo-neutro" style={{ minHeight: 20, padding: '0 7px', fontSize: 12 }}>{f.total}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="mon-barra">
          <FiltroSetor departamentos={departamentos} />
          <FiltroAtendente comConversa={atendentesComConversa} semConversa={atendentesSemConversa} />
          <FiltroOrdem />
          {temFiltro && (
            <Link href="/dashboard/auditoria" className="botao botao-discreto" style={{ marginLeft: 'auto', color: 'var(--perigo)' }}>
              <X className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar filtros
            </Link>
          )}
        </div>
      </section>

      {/* Cards — clicáveis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Link href={alternarAntigos(false)} title="Clientes sem resposta nos últimos 60 dias — os acionáveis." className="cartao" style={{ display: 'block', padding: '16px 18px', textDecoration: 'none', boxShadow: !verAntigos ? '0 0 0 1.5px var(--perigo)' : 'var(--sombra-cartao)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="texto-apoio" style={{ fontWeight: 600 }}>Para resolver agora</span>
            <ShieldAlert className="icone" style={{ color: 'var(--perigo)' }} aria-hidden="true" focusable="false" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 650, color: 'var(--perigo)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{recentes.length.toLocaleString('pt-BR')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', fontWeight: !verAntigos ? 650 : 400 }}>sem resposta há +{rotuloMarco(marco)} (últimos 60 dias){!verAntigos ? ' — é a lista abaixo' : ' — clique para ver'}</div>
        </Link>
        <Link href={alternarAntigos(true)} title="Clientes parados há mais de 60 dias — a fila esquecida." className="cartao" style={{ display: 'block', padding: '16px 18px', textDecoration: 'none', boxShadow: verAntigos ? '0 0 0 1.5px var(--contorno)' : 'var(--sombra-cartao)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="texto-apoio" style={{ fontWeight: 600 }}>Fila antiga (esquecidos)</span>
            <Archive className="icone" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 650, color: 'var(--tinta-2)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{backlogCount.toLocaleString('pt-BR')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', fontWeight: verAntigos ? 650 : 400 }}>parados há mais de 60 dias{verAntigos ? ' — é a lista abaixo' : ' — clique para ver quem são'}</div>
        </Link>
      </div>

      {/* Lista acionável */}
      <h2 className="ini-secao-titulo" style={{ margin: '0 0 12px' }}>
        {verAntigos ? 'Fila antiga — parados há mais de 60 dias' : 'Clientes esperando resposta'}{' '}
        <span style={{ fontSize: 13, color: 'var(--tinta-3)', fontWeight: 500 }}>({lista.length})</span>
      </h2>
      <section className="cartao">
        {lista.length === 0 ? (
          <div className="vazio"><p className="vazio-texto">
            {totalCount === 0 ? 'Ninguém esperando resposta.' : verAntigos ? 'Nenhum caso na fila antiga com este filtro.' : 'Nada recente — veja a “Fila antiga” no cartão acima.'}
          </p></div>
        ) : (
          <ul className="mon-lista">
            {lista.map((a) => (
              <li key={a.id} className="mon-item">
                <div>
                  <div className="mon-nome-linha">
                    <Link className="mon-nome" href={`/dashboard/monitor/${a.id}`}>{formatarNome(a.cliente_nome)}</Link>
                    <span style={{ fontSize: 13, color: 'var(--tinta-3)' }}>{formatarTelefone(a.cliente_telefone)}</span>
                    {a.departamento && <span className="mon-dep">{a.departamento}</span>}
                  </div>
                  <div className="mon-previa">
                    {a.ultima_texto ? <><b className="cli">Cliente: </b>{a.ultima_texto}</> : <span style={{ color: 'var(--tinta-3)' }}>(mensagem sem texto)</span>}
                  </div>
                  <div className="mon-meta">Cliente falou em <b style={{ color: 'var(--tinta-2)' }}>{formatarDataHora(a.cliente_respondeu_em)}</b> · Responsável: {a.atendente_nome ? formatarNome(a.atendente_nome) : '—'}</div>
                </div>
                <div className="mon-dir"><span className="selo selo-perigo">parado há {formatarDuracao(a.cliente_respondeu_em)}</span></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Como está cada atendente */}
      <h2 className="ini-secao-titulo" style={{ margin: '28px 0 6px' }}>Como está cada atendente</h2>
      <p className="ini-secao-sub" style={{ marginBottom: 12 }}>
        Só conversas <b>abertas</b> (finalizadas não entram). A barra compara com o atendente que tem mais casos. O <b>% parado</b> = sem resposta há +24h ÷ conversas abertas.
      </p>
      <section className="cartao">
        <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
          <table className="tabela" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th>Atendente</th>
                <th>Conversas abertas</th>
                <th>Sem resposta há +24h</th>
                <th>Sem resposta (total)</th>
                <th style={{ width: 120 }}>% parado</th>
              </tr>
            </thead>
            <tbody>
              {placar.map((p) => (
                <tr key={p.colaborador}>
                  <td className="nome" style={{ color: 'var(--tinta)' }}>{formatarNome(p.colaborador)}</td>
                  <td style={{ color: 'var(--tinta-2)' }}>{p.abertas}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 90, height: 8, background: 'var(--recuo-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(p.esperando_mais_24h / maxEsperando) * 100}%`, height: '100%', background: corTaxa(p.taxa) }} />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--tinta)', fontVariantNumeric: 'tabular-nums' }}>{p.esperando_mais_24h}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--atencao)', fontWeight: 600 }}>{p.esperando_recente}</td>
                  <td><span style={{ fontWeight: 700, color: corTaxa(p.taxa) }}>{p.taxa ?? 0}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
