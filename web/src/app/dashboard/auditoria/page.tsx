import Link from 'next/link'
import { getAuditoria, MARCOS_AUDITORIA, DEPARTAMENTOS_MULTI360 } from '@/lib/dados'
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
import { ShieldAlert, Archive } from 'lucide-react'

export const dynamic = 'force-dynamic'

function corTaxa(taxa: number | null): string {
  if (taxa == null) return '#64748B'
  if (taxa >= 20) return '#B91C1C'
  if (taxa >= 10) return '#C2410C'
  if (taxa >= 5) return '#A16207'
  return '#15803D'
}

const CoresDep: Record<string, string> = {
  'Benefícios': '#1D4ED8',
  'Financeiro': '#15803D',
  'Gestão com o cliente': '#7E22CE',
  'Judicial': '#B91C1C',
  'Restituição': '#C2410C',
  'Análise Inicial de Direitos - Benefícios': '#0891B2',
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
      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Você não tem acesso a esta tela.
        </div>
      </div>
    )
  }
  const [{ recentes, antigos, backlogCount, totalCount, faixas, estado }, painel] = await Promise.all([
    getAuditoria(marco, dep, atendente, ordem),
    getPainelGestor(),
  ])
  // A lista mostra os recentes (padrão) ou a fila antiga (+60 dias), conforme o cartão clicado.
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
  // Atendentes p/ o filtro (com conversa aberta x só histórico)
  const atendentesComConversa = painel.ranking.filter((r) => r.abertas > 0).map((r) => r.atendente)
  const atendentesSemConversa = painel.ranking.filter((r) => r.abertas === 0).map((r) => r.atendente)
  const temFiltro = Boolean(dep || atendente || marco !== 24)
  // Muda o marco preservando os demais filtros
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
  // Placar só com quem tem conversa aberta; taxa = % das abertas que estão paradas +24h.
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
    <div style={{ padding: '28px 32px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={22} style={{ color: '#B91C1C' }} /> Auditoria
          </h1>
          <AutoRefresh />
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Clientes que <b>falaram por último e ficaram sem resposta</b> há mais de <b style={{ color: '#B91C1C' }}>{rotuloMarco(marco)}</b>.
        </p>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      {/* Como usar — em linguagem simples */}
      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14, padding: '14px 18px', marginBottom: 18, fontSize: 13.5, color: '#0C4A6E', lineHeight: 1.6 }}>
        <b>Para que serve:</b> o Monitor mostra <i>todas</i> as conversas. Esta tela mostra <b>só o problema</b>: o cliente
        mandou a última mensagem, a bola ficou com o escritório e ninguém respondeu há mais de <b>{rotuloMarco(marco)}</b>.
        <br />
        <b>Como usar:</b> escolha o tempo nos botões abaixo, veja a <b>lista</b> (quem espera há mais tempo vem primeiro),
        <b> clique no cliente</b> para ler a conversa e decidir o que fazer — inclusive <b>cobrar o atendente</b>. No fim da
        página, o quadro mostra como cada atendente está nesse quesito.
      </div>

      {/* Marcos de tempo + filtros */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF2F7', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', padding: '12px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>Sem resposta há mais de</span>
          {faixas.map((f) => {
            const sel = marco === f.horas
            return (
              <Link
                key={f.horas}
                href={marcoHref(f.horas)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700,
                  padding: '6px 12px', borderRadius: 999, textDecoration: 'none',
                  border: '1px solid', borderColor: sel ? '#1A3C5A' : '#DCE6EF',
                  background: sel ? '#1A3C5A' : '#fff', color: sel ? '#fff' : '#475569',
                }}
              >
                {rotuloMarco(f.horas)}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: sel ? 'rgba(255,255,255,0.25)' : '#F1F5F9', color: sel ? '#fff' : '#6B7280' }}>{f.total}</span>
              </Link>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
          <FiltroSetor departamentos={DEPARTAMENTOS_MULTI360} cores={CoresDep} />
          <FiltroAtendente comConversa={atendentesComConversa} semConversa={atendentesSemConversa} />
          <FiltroOrdem />
          {temFiltro && (
            <Link href="/dashboard/auditoria" style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C', textDecoration: 'none', marginLeft: 'auto' }}>
              ✕ Limpar filtros
            </Link>
          )}
        </div>
      </div>

      {/* Cards — clicáveis: escolhem qual lista aparece abaixo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Link
          href={alternarAntigos(false)}
          title="Clientes sem resposta nos últimos 60 dias — os acionáveis."
          style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: !verAntigos ? '2px solid #C2410C' : '1px solid #EEF2F7', textDecoration: 'none', display: 'block' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>Para resolver agora</span>
            <ShieldAlert size={16} style={{ color: '#C2410C' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#C2410C', marginTop: 4 }}>{recentes.length}</div>
          <div style={{ fontSize: 11.5, color: !verAntigos ? '#C2410C' : '#9CA3AF', fontWeight: !verAntigos ? 700 : 400 }}>
            sem resposta há +{rotuloMarco(marco)} (últimos 60 dias){!verAntigos ? ' — ✓ é a lista abaixo' : ' — clique para ver'}
          </div>
        </Link>
        <Link
          href={alternarAntigos(true)}
          title="Clientes parados há mais de 60 dias — a fila esquecida."
          style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: verAntigos ? '2px solid #64748B' : '1px solid #EEF2F7', textDecoration: 'none', display: 'block' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>Fila antiga (esquecidos)</span>
            <Archive size={16} style={{ color: '#64748B' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#64748B', marginTop: 4 }}>{backlogCount}</div>
          <div style={{ fontSize: 11.5, color: verAntigos ? '#64748B' : '#9CA3AF', fontWeight: verAntigos ? 700 : 400 }}>
            parados há mais de 60 dias{verAntigos ? ' — ✓ é a lista abaixo' : ' — clique para ver quem são'}
          </div>
        </Link>
      </div>

      {/* Lista acionável — vem PRIMEIRO: é o objetivo da tela */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A', margin: '0 0 12px' }}>
        {verAntigos ? 'Fila antiga — parados há mais de 60 dias' : 'Clientes esperando resposta'}{' '}
        <span style={{ fontSize: 12.5, color: '#9CA3AF', fontWeight: 500 }}>({lista.length})</span>
      </h2>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            {totalCount === 0
              ? 'Ninguém esperando resposta. 👏'
              : verAntigos
                ? 'Nenhum caso na fila antiga com este filtro.'
                : 'Nada recente — veja a “Fila antiga” no cartão acima.'}
          </div>
        ) : (
          lista.map((a) => (
            <Link key={a.id} href={`/dashboard/monitor/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: '1px solid #F1F5F9', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#1A3C5A' }}>{formatarNome(a.cliente_nome)}</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{formatarTelefone(a.cliente_telefone)}</span>
                  {a.departamento && <span style={{ fontSize: 11.5, color: '#94A3B8' }}>· {a.departamento}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 2, maxWidth: 620, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.ultima_texto ? (
                    <>
                      <b style={{ color: '#A16207', fontWeight: 700 }}>Cliente: </b>
                      {a.ultima_texto}
                    </>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>(mensagem sem texto)</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                  Cliente falou em <b style={{ color: '#1A3C5A', fontWeight: 700, fontSize: 12.5 }}>{formatarDataHora(a.cliente_respondeu_em)}</b>
                  {' · '}Responsável: {a.atendente_nome ? formatarNome(a.atendente_nome) : '—'}
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#FEE2E2', color: '#B91C1C', whiteSpace: 'nowrap' }}>
parado há {formatarDuracao(a.cliente_respondeu_em)}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Como está cada atendente — apoio, depois da lista */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A3C5A', margin: '28px 0 6px' }}>Como está cada atendente</h2>
      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>
        Só conversas <b>abertas</b> (finalizadas não entram). A barra compara com o atendente que tem mais casos.
        O <b>% parado</b> = sem resposta há +24h ÷ conversas abertas — compara de forma justa quem atende volumes diferentes.
      </p>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                <th style={{ padding: '11px 18px', fontWeight: 600 }}>Atendente</th>
                <th style={{ padding: '11px 18px', fontWeight: 600 }}>Conversas abertas</th>
                <th style={{ padding: '11px 18px', fontWeight: 600 }}>Sem resposta há +24h</th>
                <th style={{ padding: '11px 18px', fontWeight: 600 }}>Sem resposta (total)</th>
                <th style={{ padding: '11px 18px', fontWeight: 600, width: 120 }}>% parado</th>
              </tr>
            </thead>
            <tbody>
              {placar.map((p) => (
                <tr key={p.colaborador} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '11px 18px', fontWeight: 600, color: '#1A3C5A' }}>{formatarNome(p.colaborador)}</td>
                  <td style={{ padding: '11px 18px', color: '#374151' }}>{p.abertas}</td>
                  <td style={{ padding: '11px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 90, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(p.esperando_mais_24h / maxEsperando) * 100}%`, height: '100%', background: corTaxa(p.taxa) }} />
                      </div>
                      <span style={{ fontWeight: 700, color: '#1A3C5A' }}>{p.esperando_mais_24h}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 18px', color: '#C2410C', fontWeight: 600 }}>{p.esperando_recente}</td>
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{ fontWeight: 700, color: corTaxa(p.taxa) }}>{p.taxa ?? 0}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
