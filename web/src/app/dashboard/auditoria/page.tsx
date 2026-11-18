import Link from 'next/link'
import { getAuditoria, MARCOS_AUDITORIA, getDepartamentosAbertos } from '@/lib/dados'
import { getPainelGestor } from '@/lib/gestao'
import SeletorMultiplo from '@/components/SeletorMultiplo'
import FiltroOrdem from '@/components/FiltroOrdem'
import BannerConfig from '@/components/BannerConfig'
import AutoRefresh from '@/components/AutoRefresh'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import SemPermissao from '@/components/SemPermissao'
import { formatarTelefone, formatarDataHora, formatarDuracao, formatarNome } from '@/lib/utils'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { ShieldAlert, Archive, X, ChevronRight, ChevronLeft, ChevronDown, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

const POR_PAGINA = 50

/**
 * Faixa do "% parado" — sempre dita por TEXTO num selo, além da cor (Regra 46: nada só por cor).
 * As faixas (20%, 10%, 5%) são as mesmas de antes; só a forma de mostrar mudou.
 */
function faixaTaxa(taxa: number | null): { texto: string; selo: string; cor: string } {
  if (taxa == null) return { texto: 'Sem dados', selo: 'selo-neutro', cor: 'var(--tinta-3)' }
  if (taxa >= 20) return { texto: 'Crítico', selo: 'selo-perigo', cor: 'var(--perigo)' }
  if (taxa >= 10) return { texto: 'Alto', selo: 'selo-atencao', cor: 'var(--atencao)' }
  if (taxa >= 5) return { texto: 'Atenção', selo: 'selo-atencao', cor: 'var(--atencao)' }
  return { texto: 'Em dia', selo: 'selo-sucesso', cor: 'var(--sucesso)' }
}

function rotuloMarco(h: number): string {
  return h < 24 ? `${h}h` : `${h / 24}d`
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ marco?: string; dep?: string | string[]; atendente?: string | string[]; antigos?: string; ordem?: string; pagina?: string }> }) {
  const { marco: marcoRaw, dep, atendente, antigos: antigosRaw, ordem, pagina: paginaRaw } = await searchParams
  const marco = MARCOS_AUDITORIA.includes(Number(marcoRaw)) ? Number(marcoRaw) : 24
  const verAntigos = antigosRaw === '1'
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'auditoria', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cabeca"><div className="cabeca-texto"><h1 className="titulo">Auditoria</h1></div></div>
        <SemPermissao tela="a Auditoria" />
      </main>
    )
  }
  // Setor e atendente aceitam VÁRIOS valores (Regra 57).
  const emLista = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)
  const deps = emLista(dep)
  const atendentes = emLista(atendente)
  const [{ recentes, antigos, backlogCount, totalCount, faixas, estado }, painel, departamentos] = await Promise.all([
    getAuditoria(marco, deps, atendentes, ordem),
    getPainelGestor(),
    getDepartamentosAbertos(),
  ])
  const listaToda = verAntigos ? antigos : recentes
  const totalPaginas = Math.max(1, Math.ceil(listaToda.length / POR_PAGINA))
  const pagina = Math.min(Math.max(1, Number(paginaRaw) || 1), totalPaginas)
  const lista = listaToda.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const primeiro = listaToda.length ? (pagina - 1) * POR_PAGINA + 1 : 0
  const ultimo = (pagina - 1) * POR_PAGINA + lista.length

  // Base dos links: todos os filtros ligados viram parâmetros (setor/atendente repetidos),
  // com opção de trocar o marco/antigos/página e de TIRAR um valor de setor ou atendente.
  // Trocar qualquer filtro volta para a página 1.
  const construir = (op: { marco?: number; antigos?: boolean; tiraDep?: string; tiraAtendente?: string; pagina?: number } = {}) => {
    const p = new URLSearchParams()
    const m = 'marco' in op ? op.marco! : marco
    if (m !== 24) p.set('marco', String(m))
    for (const d of deps) if (d !== op.tiraDep) p.append('dep', d)
    for (const a of atendentes) if (a !== op.tiraAtendente) p.append('atendente', a)
    if (ordem) p.set('ordem', ordem)
    const antigosFinal = 'antigos' in op ? op.antigos : verAntigos
    if (antigosFinal) p.set('antigos', '1')
    if (op.pagina && op.pagina > 1) p.set('pagina', String(op.pagina))
    const s = p.toString()
    return `/dashboard/auditoria${s ? '?' + s : ''}`
  }
  const alternarAntigos = (ligar: boolean) => construir({ antigos: ligar })
  const atendentesComConversa = painel.ranking.filter((r) => r.abertas > 0).map((r) => r.atendente)
  const atendentesSemConversa = painel.ranking.filter((r) => r.abertas === 0).map((r) => r.atendente)
  const temFiltro = Boolean(deps.length || atendentes.length || marco !== 24)
  // Etiquetas de filtro ligado (Regra 1): um X por valor de setor/atendente (o tempo
  // "marco" já aparece escolhido nos chips acima).
  const etiquetas: { label: string; href: string }[] = []
  for (const d of deps) etiquetas.push({ label: `Setor: ${d}`, href: construir({ tiraDep: d }) })
  for (const a of atendentes) etiquetas.push({ label: `Atendente: ${formatarNome(a)}`, href: construir({ tiraAtendente: a }) })
  const marcoHref = (h: number) => construir({ marco: h })
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
          <h1 className="titulo">Auditoria</h1>
          <p className="subtitulo">Clientes que <b>falaram por último e ficaram sem resposta</b> há mais de <b style={{ color: 'var(--perigo)' }}>{rotuloMarco(marco)}</b>.</p>
          <p className="texto-apoio" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AutoRefresh /><SeloAtualizacao />
          </p>
        </div>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      {/* Manual recolhido: o caminho comum primeiro, a explicação um nível abaixo (skill §16). */}
      <details className="aviso aviso-info" style={{ marginBottom: 16, display: 'block', lineHeight: 1.6 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 650, minHeight: 'var(--alvo)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info className="icone" aria-hidden="true" focusable="false" /> Para que serve e como usar esta tela
          <ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" />
        </summary>
        <div style={{ marginTop: 6 }}>
          <b>Para que serve:</b> o Monitor mostra <i>todas</i> as conversas. Esta tela mostra <b>só o problema</b>: o cliente mandou a última mensagem, a bola ficou com o escritório e ninguém respondeu há mais de <b>{rotuloMarco(marco)}</b>.
          <br />
          <b>Como usar:</b> escolha o tempo nos botões abaixo, veja a <b>lista</b> (quem espera há mais tempo vem primeiro), <b>abra a conversa</b> para ler e decidir — inclusive <b>cobrar o atendente</b>. No fim da página, o quadro mostra como cada atendente está nesse quesito.
        </div>
      </details>

      {/* Marcos de tempo + filtros */}
      <section className="cartao" style={{ marginBottom: 14 }} aria-label="Filtros">
        <div className="mon-barra">
          <span className="mon-rot" id="aud-marco-rot">Sem resposta há mais de</span>
          <nav className="chips" aria-labelledby="aud-marco-rot">
            {faixas.map((f) => (
              <Link key={f.horas} className="chip" aria-current={marco === f.horas ? 'true' : undefined} href={marcoHref(f.horas)}>
                {rotuloMarco(f.horas)} <span className="chip-conta">({f.total.toLocaleString('pt-BR')})</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mon-barra">
          <SeletorMultiplo nome="dep" rotulo="Setor" rotuloVazio="todos" opcoes={departamentos.map((d) => ({ valor: d }))} />
          <SeletorMultiplo
            nome="atendente"
            rotulo="Atendente"
            rotuloVazio="todos"
            opcoes={[
              ...atendentesComConversa.map((a) => ({ valor: a, grupo: 'Com conversa aberta' })),
              ...atendentesSemConversa.map((a) => ({ valor: a, grupo: 'Sem conversa aberta' })),
            ]}
          />
          <FiltroOrdem />
          {temFiltro && (
            <Link href="/dashboard/auditoria" className="botao botao-discreto" style={{ marginLeft: 'auto' }}>
              <X className="icone icone-p" aria-hidden="true" focusable="false" /> Limpar filtros
            </Link>
          )}
        </div>
        {etiquetas.length > 0 && (
          <div className="mon-barra">
            <span className="mon-rot">Filtros</span>
            <div className="etiquetas-filtro">
              {etiquetas.map((e) => (
                <Link key={e.label} className="etiqueta-filtro" href={e.href} aria-label={`Tirar filtro ${e.label}`} title={`Tirar filtro ${e.label}`}>
                  {e.label} <span className="x" aria-hidden="true"><X className="icone" focusable="false" /></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Cartões de número — clicáveis, escolhem qual lista aparece abaixo */}
      <div className="grade-numeros" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <Link href={alternarAntigos(false)} className={`mon-num perigo${!verAntigos ? ' ativo' : ''}`} aria-current={!verAntigos ? 'true' : undefined}>
          <dl style={{ margin: 0 }}>
            <dt><ShieldAlert className="icone" aria-hidden="true" focusable="false" />Para resolver agora</dt>
            <dd>{recentes.length.toLocaleString('pt-BR')}</dd>
          </dl>
          <div className="pista">sem resposta há mais de {rotuloMarco(marco)}, nos últimos 60 dias{!verAntigos ? ' — é a lista abaixo' : ' — clique para ver'}</div>
        </Link>
        <Link href={alternarAntigos(true)} className={`mon-num${verAntigos ? ' ativo' : ''}`} aria-current={verAntigos ? 'true' : undefined}>
          <dl style={{ margin: 0 }}>
            <dt><Archive className="icone" aria-hidden="true" focusable="false" />Fila antiga (esquecidos)</dt>
            <dd style={{ color: 'var(--tinta-2)' }}>{backlogCount.toLocaleString('pt-BR')}</dd>
          </dl>
          <div className="pista">parados há mais de 60 dias{verAntigos ? ' — é a lista abaixo' : ' — clique para ver quem são'}</div>
        </Link>
      </div>

      {/* Lista acionável */}
      <h2 className="ini-secao-titulo" style={{ margin: '0 0 12px' }}>
        {verAntigos ? 'Fila antiga — parados há mais de 60 dias' : 'Clientes esperando resposta'}{' '}
        <span className="texto-apoio" style={{ fontWeight: 500 }}>({listaToda.length.toLocaleString('pt-BR')})</span>
      </h2>
      <section className="cartao" aria-label={verAntigos ? 'Fila antiga' : 'Clientes esperando resposta'}>
        {lista.length === 0 ? (
          <div className="vazio">
            <p className="vazio-titulo">
              {totalCount === 0 ? 'Ninguém esperando resposta.' : verAntigos ? 'Nenhum caso na fila antiga com este filtro.' : 'Nada recente com este filtro.'}
            </p>
            <p className="vazio-texto">
              {totalCount === 0
                ? 'Quando um cliente falar por último e ficar sem resposta além do tempo escolhido, ele aparece aqui.'
                : verAntigos ? 'Troque o tempo ou tire os filtros para ver mais casos.' : 'Veja a “Fila antiga” no cartão acima, ou troque o tempo e os filtros.'}
            </p>
            {temFiltro && <Link className="botao botao-secundario" href="/dashboard/auditoria">Limpar filtros</Link>}
          </div>
        ) : (
          <>
            <ul className="mon-lista">
              {lista.map((a) => (
                <li key={a.id} className="mon-item">
                  <div>
                    <div className="mon-nome-linha">
                      <Link className="mon-nome" href={`/dashboard/monitor/${a.id}`}>{formatarNome(a.cliente_nome)}</Link>
                      {a.departamento && <span className="mon-dep">{a.departamento}</span>}
                    </div>
                    <div className="mon-meta">
                      {formatarTelefone(a.cliente_telefone)}{' · '}Responsável: {a.atendente_nome ? formatarNome(a.atendente_nome) : <span className="semat">sem atendente</span>}
                    </div>
                    <div className="mon-previa">
                      {a.ultima_texto ? <><b className="cli">Cliente: </b>{a.ultima_texto}</> : <span style={{ color: 'var(--tinta-3)' }}>(mensagem sem texto)</span>}
                    </div>
                    <div className="mon-quando">Cliente falou em {formatarDataHora(a.cliente_respondeu_em)}</div>
                  </div>
                  <div className="mon-dir">
                    <span className="selo selo-perigo">Parado há {formatarDuracao(a.cliente_respondeu_em)}</span>
                    <Link className="mon-abrir" style={{ minHeight: 'var(--alvo)' }} href={`/dashboard/monitor/${a.id}`}>
                      Abrir<span className="so-leitor"> a conversa de {formatarNome(a.cliente_nome)}</span> <ChevronRight className="icone" aria-hidden="true" focusable="false" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <div className="tabela-pe">
              <span>
                Mostrando <strong>{primeiro.toLocaleString('pt-BR')}–{ultimo.toLocaleString('pt-BR')}</strong> de <strong>{listaToda.length.toLocaleString('pt-BR')}</strong>
                {totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}
              </span>
              {totalPaginas > 1 && (
                <nav className="botoes" aria-label="Páginas">
                  {pagina > 1
                    ? <Link className="botao botao-secundario" href={construir({ pagina: pagina - 1 })}><ChevronLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Anterior</Link>
                    : <span className="botao botao-secundario" aria-disabled="true"><ChevronLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Anterior</span>}
                  {pagina < totalPaginas
                    ? <Link className="botao botao-secundario" href={construir({ pagina: pagina + 1 })}>Próxima <ChevronRight className="icone icone-p" aria-hidden="true" focusable="false" /></Link>
                    : <span className="botao botao-secundario" aria-disabled="true">Próxima <ChevronRight className="icone icone-p" aria-hidden="true" focusable="false" /></span>}
                </nav>
              )}
            </div>
          </>
        )}
      </section>

      {/* Como está cada atendente */}
      <h2 className="ini-secao-titulo" style={{ margin: '28px 0 6px' }}>Como está cada atendente</h2>
      <p className="ini-secao-sub" style={{ marginBottom: 12 }}>
        Só conversas <b>abertas</b> (finalizadas não entram). A barra compara com o atendente que tem mais casos. O <b>% parado</b> = sem resposta há mais de 24h ÷ conversas abertas.
      </p>
      <section className="cartao">
        {placar.length === 0 ? (
          <div className="vazio"><p className="vazio-texto">Nenhum atendente com conversa aberta no momento.</p></div>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela tabela-cartoes">
              <caption className="so-leitor">Como está cada atendente</caption>
              <thead>
                <tr>
                  <th scope="col">Atendente</th>
                  <th scope="col">Conversas abertas</th>
                  <th scope="col">Sem resposta há mais de 24h</th>
                  <th scope="col">Sem resposta (total)</th>
                  <th scope="col">% parado</th>
                </tr>
              </thead>
              <tbody>
                {placar.map((p) => {
                  const fx = faixaTaxa(p.taxa)
                  return (
                    <tr key={p.colaborador}>
                      <td className="nome" data-rotulo="Atendente" style={{ color: 'var(--tinta)' }}>{formatarNome(p.colaborador)}</td>
                      <td data-rotulo="Conversas abertas" style={{ color: 'var(--tinta-2)', fontVariantNumeric: 'tabular-nums' }}>{p.abertas.toLocaleString('pt-BR')}</td>
                      <td data-rotulo="Sem resposta há mais de 24h">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span aria-hidden="true" style={{ width: 90, height: 8, background: 'var(--recuo-2)', borderRadius: 4, overflow: 'hidden', display: 'inline-block' }}>
                            <span style={{ display: 'block', width: `${(p.esperando_mais_24h / maxEsperando) * 100}%`, height: '100%', background: fx.cor }} />
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--tinta)', fontVariantNumeric: 'tabular-nums' }}>{p.esperando_mais_24h.toLocaleString('pt-BR')}</span>
                        </span>
                      </td>
                      <td data-rotulo="Sem resposta (total)" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.esperando_recente.toLocaleString('pt-BR')}</td>
                      <td className="situacao" data-rotulo="% parado">
                        <span className={`selo ${fx.selo}`}>{p.taxa ?? 0}% · {fx.texto}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
