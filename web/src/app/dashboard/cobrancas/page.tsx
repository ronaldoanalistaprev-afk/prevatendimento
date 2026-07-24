import Link from 'next/link'
import {
  getCobrancas,
  getMinhasCobrancas,
  getMetricasCobrancas,
  ROTULO_STATUS,
  type Cobranca,
  type FiltroStatus,
} from '@/lib/cobrancas'
import { getPapelAtual } from '@/lib/papel'
import { formatarTelefone, formatarDataHora, formatarNome, formatarDuracao } from '@/lib/utils'
import AcoesCobranca from '@/components/AcoesCobranca'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { BellRing, AlarmClock, Check, X, Clock, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SITUACOES: { chave: FiltroStatus; label: string }[] = [
  { chave: 'ABERTA', label: 'A resolver' },
  { chave: 'RESOLVIDA', label: 'Resolvidas' },
  { chave: 'CANCELADA', label: 'Canceladas' },
  { chave: 'TODAS', label: 'Todas' },
]

/** Períodos das métricas, em dias. */
const PERIODOS = [7, 30, 90]

function nomeCliente(c: Cobranca): string {
  return c.at_clientes?.nome ? formatarNome(c.at_clientes.nome) : 'Cliente'
}
function venceu(prazo: string | null): boolean {
  return !!prazo && new Date(prazo).getTime() < Date.now()
}
/** 32.6 -> "1d 8h" ; 5.2 -> "5h" */
function horasLegivel(h: number | null): string {
  if (h === null) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 24) return `${Math.round(h)}h`
  const d = Math.floor(h / 24)
  const r = Math.round(h % 24)
  return r ? `${d}d ${r}h` : `${d}d`
}

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string; dias?: string }>
}) {
  const sp = await searchParams
  const situacao: FiltroStatus = (SITUACOES.find((s) => s.chave === sp.situacao)?.chave ?? 'ABERTA') as FiltroStatus
  const dias = PERIODOS.includes(Number(sp.dias)) ? Number(sp.dias) : 30

  const papel = await getPapelAtual()
  const supervisiona = papel.cobrar
  const souAtendente = !papel.cobrar

  const [cobrancas, metricas] = await Promise.all([
    supervisiona ? getCobrancas(situacao) : getMinhasCobrancas(papel.atColaboradorId, situacao),
    supervisiona ? getMetricasCobrancas(dias) : Promise.resolve(null),
  ])

  const titulo = souAtendente ? 'Minhas cobranças' : 'Painel de Cobrança'
  const subtitulo = souAtendente
    ? 'Conversas que o supervisor pediu que você responda. Marque como resolvida quando atender o cliente.'
    : 'Conversas paradas que você cobrou dos atendentes. Acompanhe até serem respondidas.'

  const href = (p: { situacao?: string; dias?: number }) => {
    const q = new URLSearchParams()
    const s = p.situacao ?? situacao
    const d = p.dias ?? dias
    if (s !== 'ABERTA') q.set('situacao', s)
    if (d !== 30) q.set('dias', String(d))
    const s2 = q.toString()
    return `/dashboard/cobrancas${s2 ? `?${s2}` : ''}`
  }

  const chip = (ativo: boolean): React.CSSProperties => ({
    height: 32, padding: '0 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', textDecoration: 'none',
    border: ativo ? '1px solid #1A3C5A' : '1px solid #DCE6EF',
    background: ativo ? '#1A3C5A' : '#fff',
    color: ativo ? '#fff' : '#6B7280',
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BellRing size={22} style={{ color: '#C2410C' }} /> {titulo}
          </h1>
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{subtitulo}</p>
      </div>

      {/* ===== Métricas (só para quem cobra) ===== */}
      {supervisiona && metricas && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A' }}>O que a cobrança está produzindo</h2>
            <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>cobranças criadas nos últimos</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {PERIODOS.map((d) => (
                <Link key={d} href={href({ dias: d })} style={{ ...chip(d === dias), height: 26, padding: '0 10px', fontSize: 12 }}>
                  {d} dias
                </Link>
              ))}
            </div>
          </div>

          {!metricas.temDados ? (
            <div style={{ fontSize: 13.5, color: '#9CA3AF', padding: '8px 0' }}>
              Nenhuma cobrança criada nesse período. As métricas aparecem quando você começar a cobrar.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <Cartao icone={BellRing} cor="#1A3C5A" valor={metricas.criadas} label="cobranças criadas" />
                <Cartao icone={Check} cor="#15803D" valor={metricas.resolvidas} label="resolvidas" />
                <Cartao icone={Clock} cor="#B45309" valor={metricas.abertas} label="ainda a resolver" />
                <Cartao icone={AlarmClock} cor="#DC2626" valor={metricas.atrasadas} label="com prazo vencido" />
                <Cartao icone={X} cor="#6B7280" valor={metricas.canceladas} label="canceladas" />
                <Cartao icone={TrendingUp} cor="#15803D" valor={`${metricas.taxaResolucao}%`} label="taxa de resolução" />
                <Cartao icone={Clock} cor="#1A3C5A" valor={horasLegivel(metricas.tempoMedioHoras)} label="tempo médio até resolver" />
              </div>

              {metricas.porAtendente.length > 0 && (
                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Atendente</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Cobranças</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Resolvidas</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>A resolver</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Canceladas</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Prazo vencido</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Tempo médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.porAtendente.map((a) => (
                        <tr key={a.nome} style={{ borderTop: '1px solid #EEF2F7' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1A3C5A' }}>{formatarNome(a.nome)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{a.criadas}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#15803D', fontWeight: 700 }}>{a.resolvidas}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{a.abertas}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94A3B8' }}>{a.canceladas || '—'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: a.atrasadas > 0 ? '#DC2626' : '#9CA3AF', fontWeight: a.atrasadas > 0 ? 700 : 400 }}>
                            {a.atrasadas || '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{horasLegivel(a.tempoMedioHoras)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 8 }}>
                    Tempo médio = da hora em que você cobrou até a cobrança ser marcada como resolvida.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== Filtro de situação ===== */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 600 }}>Situação:</span>
        {SITUACOES.map((s) => (
          <Link key={s.chave} href={href({ situacao: s.chave })} style={chip(s.chave === situacao)}>
            {s.label}
          </Link>
        ))}
      </div>

      {cobrancas.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '44px 20px', textAlign: 'center', color: situacao === 'ABERTA' ? '#15803D' : '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>
          <BellRing size={30} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          {situacao === 'ABERTA'
            ? souAtendente
              ? 'Você não tem cobranças a resolver. 🎉'
              : 'Nenhuma cobrança a resolver no momento.'
            : `Nenhuma cobrança ${ROTULO_STATUS[situacao as 'RESOLVIDA' | 'CANCELADA']?.toLowerCase() ?? ''} por aqui.`}
          {souAtendente && !papel.atColaboradorId && (
            <div style={{ marginTop: 10, color: '#C2410C', fontSize: 13 }}>
              (Seu login ainda não está vinculado a um atendente do Multi360 — peça ao gestor para vincular.)
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cobrancas.map((c) => {
            const atrasada = c.status === 'ABERTA' && venceu(c.prazo)
            const borda = c.status === 'RESOLVIDA' ? '#16A34A' : c.status === 'CANCELADA' ? '#CBD5E1' : atrasada ? '#DC2626' : '#F59E0B'
            return (
              <div
                key={c.id}
                style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px',
                  borderLeft: `4px solid ${borda}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Link href={c.protocolo_id ? `/dashboard/monitor/${c.protocolo_id}` : '#'} style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 15, textDecoration: 'none' }}>
                        {nomeCliente(c)}
                      </Link>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {formatarTelefone(c.at_clientes?.telefone ?? null)}
                        {c.at_protocolos?.departamento ? ` · ${c.at_protocolos.departamento}` : ''}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px',
                        background: c.status === 'RESOLVIDA' ? '#DCFCE7' : c.status === 'CANCELADA' ? '#F1F5F9' : atrasada ? '#FEE2E2' : '#FEF3C7',
                        color: c.status === 'RESOLVIDA' ? '#15803D' : c.status === 'CANCELADA' ? '#64748B' : atrasada ? '#DC2626' : '#B45309',
                      }}>
                        {c.status === 'ABERTA' && atrasada ? 'A resolver · atrasada' : ROTULO_STATUS[c.status]}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.mensagem}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {!souAtendente && <span>Atendente: <b style={{ color: '#374151' }}>{c.colaborador_nome ? formatarNome(c.colaborador_nome) : '—'}</b></span>}
                      <span>Por: {c.criado_por_nome ?? '—'}</span>
                      <span>Criada <b style={{ color: '#1A3C5A' }}>{formatarDataHora(c.criado_em)}</b></span>
                      {c.editado_em && <span title={`Editada por ${c.editado_por_nome ?? 'alguém'}`}>(editada)</span>}
                      {c.prazo && c.status === 'ABERTA' && (
                        <span style={{ color: atrasada ? '#DC2626' : '#B45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlarmClock size={13} /> {atrasada ? 'Venceu ' : 'Prazo '}{formatarDataHora(c.prazo)}
                        </span>
                      )}
                      {c.status === 'RESOLVIDA' && c.resolvido_em && (
                        <span style={{ color: '#15803D' }}>Resolvida em {formatarDataHora(c.resolvido_em)} · levou {formatarDuracao(c.criado_em, c.resolvido_em)}</span>
                      )}
                    </div>
                  </div>
                  <AcoesCobranca id={c.id} status={c.status} mensagem={c.mensagem} prazo={c.prazo} podeGerenciar={supervisiona} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Cartao({
  icone: Icone,
  valor,
  label,
  cor,
}: {
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  valor: number | string
  label: string
  cor: string
}) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
      <Icone size={14} style={{ color: cor, marginBottom: 2 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: cor, lineHeight: 1.15 }}>{valor}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
    </div>
  )
}
