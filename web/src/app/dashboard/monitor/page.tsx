import Link from 'next/link'
import { getMonitorProtocolos } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import AutoRefresh from '@/components/AutoRefresh'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { formatarTelefone, formatarDataHora, formatarDuracao, formatarNome } from '@/lib/utils'
import { Radar, Clock, Users, AlarmClock, ChevronRight } from 'lucide-react'
import FiltroAtendente from '@/components/FiltroAtendente'
import FiltroCompetencia from '@/components/FiltroCompetencia'
import FiltroSetor from '@/components/FiltroSetor'
import FiltroOrdem from '@/components/FiltroOrdem'
import BuscaMonitor from '@/components/BuscaMonitor'
import { getPapelAtual } from '@/lib/papel'

export const dynamic = 'force-dynamic'

const CoresDep: Record<string, string> = {
  'Benefícios': '#1D4ED8',
  'Financeiro': '#15803D',
  'Gestão com o cliente': '#7E22CE',
  'Judicial': '#B91C1C',
  'Restituição': '#C2410C',
  'Análise Inicial de Direitos - Benefícios': '#0891B2',
}

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
  const periodo = competencia ? 'tudo' : periodoRaw || '30'
  const situacao = situacaoRaw || 'abertas'
  const paginaPedida = Math.max(1, Number(paginaRaw) || 1)

  // Colaborador só enxerga as próprias conversas (filtro travado no seu nome do Multi360).
  const papel = await getPapelAtual()
  const restrito = !papel.verTudo
  const atendenteEfetivo = restrito ? (papel.colaboradorNome ?? 'sem-vinculo') : atendente

  const { itens, resumo, departamentos, atendentesComConversa, atendentesSemConversa, pagina, totalPaginas, estado } = await getMonitorProtocolos(dep, periodo, atendenteEfetivo, situacao, busca, competencia, paginaPedida, so, ordem)
  const temAtendentes = atendentesComConversa.length + atendentesSemConversa.length > 0
  // Algum filtro fora do padrão? (habilita o "Limpar filtros")
  const temFiltro = Boolean(dep || busca || competencia || atendente || so || situacao !== 'abertas' || periodo !== '30')
  // Atalho dos cartões (liga/desliga "só sem resposta" / "só aguardando 1º atendimento")
  const soHref = (v: string) => {
    const p = new URLSearchParams()
    if (dep) p.set('dep', dep)
    if (competencia) p.set('competencia', competencia)
    else if (periodo !== '30') p.set('periodo', periodo)
    if (atendente) p.set('atendente', atendente)
    if (busca) p.set('busca', busca)
    if (ordem) p.set('ordem', ordem)
    if (so !== v) p.set('so', v) // clicar de novo no cartão ativo remove o filtro
    const s = p.toString()
    return `/dashboard/monitor${s ? '?' + s : ''}`
  }
  const primeiro = itens.length === 0 ? 0 : (pagina - 1) * 50 + 1
  const ultimo = (pagina - 1) * 50 + itens.length
  // Muda de página, preservando todos os filtros.
  const paginaHref = (n: number) => {
    const p = new URLSearchParams()
    if (dep) p.set('dep', dep)
    if (!competencia && periodo !== '30') p.set('periodo', periodo)
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
    // ao clicar num período, a competência é substituída
    if ('periodo' in over) {
      if (pe && pe !== '30') p.set('periodo', pe)
    } else {
      if (competencia) p.set('competencia', competencia)
      else if (pe && pe !== '30') p.set('periodo', pe)
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
  // Cartões clicáveis: cada um abre a lista já filtrada (href undefined = não navega).
  const cards: { label: string; valor: number; icone: typeof Users; cor: string; href?: string; dica: string }[] = finalizadas
    ? [{ label: 'Conversas finalizadas', valor: resumo.total, icone: Users, cor: '#1A3C5A', dica: 'Conversas já encerradas no Multi360.' }]
    : [
        { label: 'Conversas', valor: resumo.total, icone: Users, cor: '#1A3C5A', dica: 'Total de conversas neste filtro.' },
        { label: 'Sem resposta', valor: resumo.esperando, icone: AlarmClock, cor: '#C2410C', href: soHref('esperando'), dica: 'O cliente falou por último e ninguém respondeu. Clique para ver só estas.' },
        { label: 'Aguardando 1º atendimento', valor: resumo.pendentes, icone: Clock, cor: '#B45309', href: soHref('pendentes'), dica: 'Cliente na fila que ainda não foi atendido por ninguém. Clique para ver só estas.' },
      ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radar size={22} style={{ color: '#16A34A' }} /> Monitor Diário
          </h1>
          <AutoRefresh />
          <SeloAtualizacao em={resumo.atualizadoEm} />
        </div>
        <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 4 }}>
          Conversas do Multi360. Quem está esperando aparece primeiro, de quem espera há mais tempo.
        </p>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        {cards.map((c) => {
          const Icone = c.icone
          const ativo = Boolean(c.href && ((so === 'esperando' && c.label === 'Sem resposta') || (so === 'pendentes' && c.label === 'Aguardando 1º atendimento')))
          const conteudo = (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>{c.label}</span>
                <Icone size={16} style={{ color: c.cor }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.cor, marginTop: 4 }}>{c.valor}</div>
              {c.href && (
                <div style={{ fontSize: 11, color: ativo ? c.cor : '#9CA3AF', marginTop: 2, fontWeight: ativo ? 700 : 400 }}>
                  {ativo ? '✓ vendo só estas — clique p/ tirar' : 'clique para ver só estas'}
                </div>
              )}
            </>
          )
          const estilo: React.CSSProperties = {
            background: '#fff', borderRadius: 14, padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            border: ativo ? `2px solid ${c.cor}` : '1px solid #EEF2F7',
            textDecoration: 'none', display: 'block',
          }
          return c.href ? (
            <Link key={c.label} href={c.href} title={c.dica} style={estilo}>{conteudo}</Link>
          ) : (
            <div key={c.label} title={c.dica} style={estilo}>{conteudo}</div>
          )
        })}
      </div>

      {/* Painel único de filtros (busca + situação em cima; período/setor/colaborador embaixo) */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF2F7', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', padding: '12px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <BuscaMonitor />
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>Situação</span>
            {SITUACOES.map((si) => (
              <FiltroChip key={si.chave} label={si.label} href={qs({ situacao: si.chave })} ativo={situacao === si.chave} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>Período</span>
          {PERIODOS.map((pe) => (
            <FiltroChip key={pe.chave} label={pe.label} href={qs({ periodo: pe.chave })} ativo={!competencia && periodo === pe.chave} />
          ))}
          <span style={{ fontSize: 11.5, color: '#CBD5E1' }}>ou</span>
          <FiltroCompetencia />
          <span style={{ width: 1, height: 22, background: '#EEF2F7', margin: '0 6px' }} />
          <FiltroSetor departamentos={departamentos} cores={CoresDep} />
          {!restrito && temAtendentes && <FiltroAtendente comConversa={atendentesComConversa} semConversa={atendentesSemConversa} />}
          <span style={{ marginLeft: 'auto' }}>
            <FiltroOrdem />
          </span>
        </div>
      </div>

      {restrito && (
        <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 12, background: '#F1F5F9', borderRadius: 10, padding: '8px 12px', display: 'inline-block' }}>
          Mostrando apenas as suas conversas{papel.colaboradorNome ? ` (${papel.colaboradorNome})` : ''}.
        </div>
      )}

      {/* Contagem do resultado + limpar filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8, minHeight: 20 }}>
        {itens.length > 0 && (
          <span style={{ fontSize: 12.5, color: '#6B7280' }}>
            Mostrando <b>{primeiro}–{ultimo}</b> de <b>{resumo.total}</b> conversas
            {totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}
          </span>
        )}
        {temFiltro && (
          <Link href="/dashboard/monitor" style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C', textDecoration: 'none', marginLeft: 'auto' }}>
            ✕ Limpar filtros
          </Link>
        )}
      </div>

      {itens.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
          <Radar size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          Nenhuma conversa neste filtro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {itens.map((p) => {
            const encerrada = p.status_multi360 === 'FINALIZADO'
            const esperando = !encerrada && p.ultima_mensagem_direcao === 'cliente'
            const corDep = p.departamento ? CoresDep[p.departamento] ?? '#475569' : '#94A3B8'
            return (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #EEF2F7',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                  borderLeft: `4px solid ${esperando ? '#F59E0B' : encerrada ? '#CBD5E1' : '#16A34A'}`,
                  padding: '14px 18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                {/* Coluna principal (nome inteiro + infos) */}
                <div style={{ flex: 1, minWidth: 250 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link href={`/dashboard/monitor/${p.id}`} style={{ fontWeight: 700, fontSize: 15, color: '#1A3C5A', textDecoration: 'none' }}>
                      {formatarNome(p.cliente_nome)}
                    </Link>
                    {p.departamento && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: corDep, background: `${corDep}18`, padding: '2px 8px', borderRadius: 6 }}>{p.departamento}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>
                    {formatarTelefone(p.cliente_telefone)}
                    {p.possui_anexo && <span title="tem anexo" style={{ marginLeft: 6, opacity: 0.6 }}>📎</span>}
                    {' · '}Atendente: {p.atendente_nome ? formatarNome(p.atendente_nome) : <span style={{ color: '#C2410C', fontWeight: 600 }}>sem atendente</span>}
                  </div>
                  <div style={{ marginTop: 9 }}>
                    <div style={{ color: '#374151', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.ultima_texto ? (
                        <>
                          <b style={{ color: esperando ? '#A16207' : '#15803D', fontWeight: 700 }}>
                            {p.ultima_mensagem_direcao === 'cliente' ? 'Cliente: ' : 'Equipe: '}
                          </b>
                          {p.ultima_texto}
                        </>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>(mensagem sem texto)</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#1A3C5A', fontWeight: 700, marginTop: 2 }}>{formatarDataHora(p.ultima_mensagem_em)}</div>
                  </div>
                </div>

                {/* Situação + botão abrir */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginLeft: 'auto' }}>
                  {encerrada ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: '#EEF2F7', color: '#64748B', whiteSpace: 'nowrap' }}>Finalizada</span>
                  ) : esperando ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: '#FEF9C3', color: '#A16207', whiteSpace: 'nowrap' }}>Aguardando · {formatarDuracao(p.ultima_mensagem_em)}</span>
                  ) : (
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', whiteSpace: 'nowrap' }}>Respondido</span>
                  )}
                  <Link
                    href={`/dashboard/monitor/${p.id}`}
                    title="Abrir conversa"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 34, padding: '0 12px 0 14px', borderRadius: 9, background: '#1A3C5A', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Abrir <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          {pagina > 1 ? (
            <Link href={paginaHref(pagina - 1)} style={pagBtn(false)}>← Anterior</Link>
          ) : (
            <span style={pagBtn(true)}>← Anterior</span>
          )}
          <span style={{ fontSize: 13, color: '#6B7280' }}>Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas ? (
            <Link href={paginaHref(pagina + 1)} style={pagBtn(false)}>Próxima →</Link>
          ) : (
            <span style={pagBtn(true)}>Próxima →</span>
          )}
        </div>
      )}
    </div>
  )
}

function pagBtn(desabilitado: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 10,
    textDecoration: 'none',
    border: '1px solid #DCE6EF',
    background: desabilitado ? '#F8FAFC' : '#fff',
    color: desabilitado ? '#CBD5E1' : '#1A3C5A',
    cursor: desabilitado ? 'default' : 'pointer',
  }
}

function FiltroChip({ label, href, ativo, cor }: { label: string; href: string; ativo: boolean; cor?: string }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 999,
        textDecoration: 'none',
        border: '1px solid',
        borderColor: ativo ? (cor ?? '#1A3C5A') : '#DCE6EF',
        background: ativo ? (cor ?? '#1A3C5A') : '#fff',
        color: ativo ? '#fff' : cor ?? '#475569',
      }}
    >
      {label}
    </Link>
  )
}
