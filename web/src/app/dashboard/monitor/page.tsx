import Link from 'next/link'
import { getMonitorProtocolos } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import AutoRefresh from '@/components/AutoRefresh'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { formatarTelefone, formatarDataHora, formatarDuracao, formatarNome } from '@/lib/utils'
import { Radar, Clock, Inbox, AlarmClock, ChevronRight, Paperclip, X } from 'lucide-react'
import FiltroAtendente from '@/components/FiltroAtendente'
import FiltroCompetencia from '@/components/FiltroCompetencia'
import FiltroSetor from '@/components/FiltroSetor'
import FiltroOrdem from '@/components/FiltroOrdem'
import BuscaMonitor from '@/components/BuscaMonitor'
import LembrarPeriodo from '@/components/LembrarPeriodo'
import { getPapelAtual } from '@/lib/papel'

export const dynamic = 'force-dynamic'

const PERIODOS = [
  { chave: 'hoje', label: 'Hoje' },
  { chave: '7', label: '7 dias' },
  { chave: '30', label: '30 dias' },
  { chave: 'tudo', label: 'Tudo' },
]

const SITUACOES = [
  { chave: 'abertas', label: 'Abertas' },
  { chave: 'finalizadas', label: 'Finalizadas' },
  { chave: 'todas', label: 'Todas' },
]

export default async function MonitorPage({ searchParams }: { searchParams: Promise<{ dep?: string; periodo?: string; atendente?: string; situacao?: string; pagina?: string; busca?: string; competencia?: string; so?: string; ordem?: string }> }) {
  const { dep, periodo: periodoRaw, atendente, situacao: situacaoRaw, pagina: paginaRaw, busca, competencia, so, ordem } = await searchParams
  const periodo = competencia ? 'tudo' : periodoRaw || 'hoje'
  const situacao = situacaoRaw || 'abertas'
  const paginaPedida = Math.max(1, Number(paginaRaw) || 1)

  // Colaborador só enxerga as próprias conversas (filtro travado no seu nome do Multi360).
  const papel = await getPapelAtual()
  const restrito = !papel.verTudo
  const atendenteEfetivo = restrito ? (papel.colaboradorNome ?? 'sem-vinculo') : atendente

  const { itens, resumo, departamentos, atendentesComConversa, atendentesSemConversa, pagina, totalPaginas, estado } = await getMonitorProtocolos(dep, periodo, atendenteEfetivo, situacao, busca, competencia, paginaPedida, so, ordem)
  const temAtendentes = atendentesComConversa.length + atendentesSemConversa.length > 0
  const temFiltro = Boolean(dep || busca || competencia || atendente || so || situacao !== 'abertas' || periodo !== 'hoje')
  // Atalho dos cartões (liga/desliga "só sem resposta" / "só aguardando")
  const soHref = (v: string) => {
    const p = new URLSearchParams()
    if (dep) p.set('dep', dep)
    if (competencia) p.set('competencia', competencia)
    else if (periodo !== 'hoje') p.set('periodo', periodo)
    if (atendente) p.set('atendente', atendente)
    if (busca) p.set('busca', busca)
    if (ordem) p.set('ordem', ordem)
    if (so !== v) p.set('so', v)
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  }
  const primeiro = itens.length === 0 ? 0 : (pagina - 1) * 50 + 1
  const ultimo = (pagina - 1) * 50 + itens.length
  const paginaHref = (n: number) => {
    const p = new URLSearchParams()
    if (dep) p.set('dep', dep)
    if (!competencia && periodo !== 'hoje') p.set('periodo', periodo)
    if (competencia) p.set('competencia', competencia)
    if (situacao !== 'abertas') p.set('situacao', situacao)
    if (atendente) p.set('atendente', atendente)
    if (busca) p.set('busca', busca)
    if (ordem) p.set('ordem', ordem)
    if (so) p.set('so', so)
    if (n > 1) p.set('pagina', String(n))
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  }
  const qs = (over: { dep?: string; periodo?: string; situacao?: string }) => {
    const p = new URLSearchParams()
    const d = 'dep' in over ? over.dep : dep
    const pe = 'periodo' in over ? over.periodo : periodo
    const si = 'situacao' in over ? over.situacao : situacao
    if (d) p.set('dep', d)
    if ('periodo' in over) {
      if (pe) p.set('periodo', pe)
    } else {
      if (competencia) p.set('competencia', competencia)
      else if (pe && pe !== 'hoje') p.set('periodo', pe)
    }
    if (si && si !== 'abertas') p.set('situacao', si)
    if (atendente) p.set('atendente', atendente)
    if (busca) p.set('busca', busca)
    if (ordem) p.set('ordem', ordem)
    if (so) p.set('so', so)
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  }

  const finalizadas = situacao === 'finalizadas'

  // Etiquetas de filtro ligado (Regra 1): cada filtro ativo vira uma etiqueta com X
  // que remove SÓ aquele filtro. "Limpar filtros" (ao lado) continua limpando tudo.
  const filtrosAtuais: Record<string, string> = {}
  if (busca) filtrosAtuais.busca = busca
  if (dep) filtrosAtuais.dep = dep
  if (competencia) filtrosAtuais.competencia = competencia
  else if (periodo !== 'hoje') filtrosAtuais.periodo = periodo
  if (atendente && !restrito) filtrosAtuais.atendente = atendente
  if (situacao !== 'abertas') filtrosAtuais.situacao = situacao
  if (so) filtrosAtuais.so = so
  if (ordem) filtrosAtuais.ordem = ordem // vai na URL, mas não vira etiqueta (é ordenação, não filtro)
  const hrefSem = (drop: string) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(filtrosAtuais)) if (k !== drop) p.set(k, v)
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  }
  const competenciaLabel = (c: string) => { const [a, m] = c.split('-'); return m && a ? `${m}/${a}` : c }
  const etiquetas: { chave: string; label: string }[] = []
  if (filtrosAtuais.busca) etiquetas.push({ chave: 'busca', label: `Busca: "${busca}"` })
  if (filtrosAtuais.dep) etiquetas.push({ chave: 'dep', label: `Setor: ${dep}` })
  if (filtrosAtuais.competencia) etiquetas.push({ chave: 'competencia', label: `Competência: ${competenciaLabel(competencia!)}` })
  if (filtrosAtuais.periodo) etiquetas.push({ chave: 'periodo', label: `Período: ${PERIODOS.find((x) => x.chave === periodo)?.label ?? periodo}` })
  if (filtrosAtuais.atendente) etiquetas.push({ chave: 'atendente', label: `Atendente: ${formatarNome(atendente!)}` })
  if (filtrosAtuais.situacao) etiquetas.push({ chave: 'situacao', label: `Situação: ${SITUACOES.find((x) => x.chave === situacao)?.label ?? situacao}` })
  if (filtrosAtuais.so) etiquetas.push({ chave: 'so', label: so === 'esperando' ? 'Só: escritório precisa responder' : 'Só: aguardando o cliente' })

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1}>
      <LembrarPeriodo />
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radar className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Monitor Diário
          </h1>
          <p className="subtitulo">Conversas do Multi360. Quem está esperando aparece primeiro, de quem espera há mais tempo.</p>
          <p className="texto-apoio" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AutoRefresh />
            <SeloAtualizacao em={resumo.atualizadoEm} />
          </p>
        </div>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      {/* Resumo */}
      <dl className="mon-resumo">
        {finalizadas ? (
          <div className="mon-num"><dt><Inbox className="icone" aria-hidden="true" focusable="false" />Conversas finalizadas</dt><dd>{resumo.total.toLocaleString('pt-BR')}</dd><div className="pista">conversas já encerradas no Multi360</div></div>
        ) : (
          <>
            <div className="mon-num"><dt><Inbox className="icone" aria-hidden="true" focusable="false" />Conversas</dt><dd>{resumo.total.toLocaleString('pt-BR')}</dd><div className="pista">total neste filtro</div></div>
            <Link className={`mon-num perigo${so === 'esperando' ? ' ativo' : ''}`} href={soHref('esperando')} title="O cliente falou por último — a bola está com o escritório.">
              <dt><AlarmClock className="icone" aria-hidden="true" focusable="false" />Escritório precisa responder</dt><dd>{resumo.esperando.toLocaleString('pt-BR')}</dd>
              <div className="pista">{so === 'esperando' ? 'vendo só estas — clique p/ tirar' : 'clique para ver só estas'}</div>
            </Link>
            <Link className={`mon-num acao${so === 'aguardacliente' ? ' ativo' : ''}`} href={soHref('aguardacliente')} title="A equipe respondeu por último — a bola está com o cliente.">
              <dt><Clock className="icone" aria-hidden="true" focusable="false" />Aguardando o cliente</dt><dd>{resumo.aguardandoCliente.toLocaleString('pt-BR')}</dd>
              <div className="pista">{so === 'aguardacliente' ? 'vendo só estas — clique p/ tirar' : 'clique para ver só estas'}</div>
            </Link>
          </>
        )}
      </dl>

      <section className="cartao" aria-label="Conversas">
        <div className="mon-barra">
          <BuscaMonitor />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <span className="mon-rot">Situação</span>
            <div className="abas">
              {SITUACOES.map((si) => (
                <Link key={si.chave} className="aba" aria-selected={situacao === si.chave} href={qs({ situacao: si.chave })}>{si.label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mon-barra">
          <span className="mon-rot">Período</span>
          <div className="abas">
            {PERIODOS.map((pe) => (
              <Link key={pe.chave} className="aba" aria-selected={!competencia && periodo === pe.chave} href={qs({ periodo: pe.chave })}>{pe.label}</Link>
            ))}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--tinta-3)' }}>ou</span>
          <FiltroCompetencia />
          <span style={{ width: 1, height: 22, background: 'var(--linha)', margin: '0 4px' }} />
          <FiltroSetor departamentos={departamentos} />
          {!restrito && temAtendentes && <FiltroAtendente comConversa={atendentesComConversa} semConversa={atendentesSemConversa} />}
          <span style={{ marginLeft: 'auto' }}><FiltroOrdem /></span>
        </div>

        {restrito && (
          <div className="mon-barra"><span className="aviso aviso-neutro" style={{ padding: '6px 12px' }}>Mostrando apenas as suas conversas{papel.colaboradorNome ? ` (${formatarNome(papel.colaboradorNome)})` : ''}.</span></div>
        )}

        {/* Etiquetas de filtro ligado (Regra 1) */}
        {etiquetas.length > 0 && (
          <div className="mon-barra">
            <span className="mon-rot">Filtros</span>
            <div className="etiquetas-filtro">
              {etiquetas.map((e) => (
                <Link key={e.chave} className="etiqueta-filtro" href={hrefSem(e.chave)} aria-label={`Tirar filtro ${e.label}`} title={`Tirar filtro ${e.label}`}>
                  {e.label} <span className="x" aria-hidden="true"><X className="icone" focusable="false" /></span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contagem */}
        <div className="tabela-pe">
          {itens.length > 0 ? (
            <span>Mostrando <strong>{primeiro}–{ultimo}</strong> de <strong>{resumo.total.toLocaleString('pt-BR')}</strong> conversas{totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}</span>
          ) : <span />}
          {temFiltro && <Link className="botao botao-discreto" href="/dashboard/monitor">Limpar filtros</Link>}
        </div>

        {itens.length === 0 ? (
          <div className="mon-vazio">
            <Radar className="icone" aria-hidden="true" focusable="false" />
            {temFiltro ? (
              <>
                <p className="vazio-titulo">Nenhuma conversa com estes filtros.</p>
                <Link className="botao botao-secundario" href="/dashboard/monitor">Limpar filtros</Link>
              </>
            ) : (
              <p className="vazio-texto">Ainda não há conversas sincronizadas do Multi360. Assim que o leitor do Multi360 rodar, as conversas aparecem aqui.</p>
            )}
          </div>
        ) : (
          <ul className="mon-lista">
            {itens.map((p) => {
              const encerrada = p.status_multi360 === 'FINALIZADO'
              const esperando = !encerrada && p.ultima_mensagem_direcao === 'cliente'
              return (
                <li key={p.id} className="mon-item">
                  <div>
                    <div className="mon-nome-linha">
                      <Link className="mon-nome" href={`/dashboard/monitor/${p.id}`}>{formatarNome(p.cliente_nome)}</Link>
                      {p.departamento && <span className="mon-dep">{p.departamento}</span>}
                    </div>
                    <div className="mon-meta">
                      {formatarTelefone(p.cliente_telefone)}
                      {p.possui_anexo && <Paperclip className="icone" aria-label="tem anexo" />}
                      {' · '}Atendente: {p.atendente_nome ? formatarNome(p.atendente_nome) : <span className="semat">sem atendente</span>}
                    </div>
                    <div className="mon-previa">
                      {p.ultima_texto ? (
                        <><b className={esperando ? 'cli' : 'eq'}>{p.ultima_mensagem_direcao === 'cliente' ? 'Cliente: ' : 'Equipe: '}</b>{p.ultima_texto}</>
                      ) : <span style={{ color: 'var(--tinta-3)' }}>(mensagem sem texto)</span>}
                    </div>
                    <div className="mon-quando">{formatarDataHora(p.ultima_mensagem_em)}</div>
                  </div>
                  <div className="mon-dir">
                    {encerrada ? (
                      <span className="selo selo-neutro">Finalizada</span>
                    ) : esperando ? (
                      <span className="selo selo-atencao">Aguardando · {formatarDuracao(p.ultima_mensagem_em)}</span>
                    ) : (
                      <span className="selo selo-sucesso">Respondido</span>
                    )}
                    <Link className="mon-abrir" href={`/dashboard/monitor/${p.id}`} title="Abrir conversa">Abrir <ChevronRight className="icone" aria-hidden="true" focusable="false" /></Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          {pagina > 1 ? <Link className="botao botao-secundario" href={paginaHref(pagina - 1)}>← Anterior</Link> : <span className="botao botao-secundario" aria-disabled="true">← Anterior</span>}
          <span style={{ fontSize: 14, color: 'var(--tinta-2)' }}>Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas ? <Link className="botao botao-secundario" href={paginaHref(pagina + 1)}>Próxima →</Link> : <span className="botao botao-secundario" aria-disabled="true">Próxima →</span>}
        </div>
      )}
    </main>
  )
}
