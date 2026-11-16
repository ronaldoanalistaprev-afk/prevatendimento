import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Flag, Send, Reply, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { getMarcoZero, ROTULO_MZ_STATUS, type MarcoZeroItem, type MarcoZeroStatus } from '@/lib/marcozero'
import { getPapelAtual } from '@/lib/papel'
import { formatarTelefone, formatarNome, formatarData } from '@/lib/utils'
import SeloAtualizacao from '@/components/SeloAtualizacao'
import { PrepararLote, CopiarLista, DesfazerLote, RemoverPessoa } from '@/components/MarcoZeroAcoes'

export const dynamic = 'force-dynamic'

const CORES: Record<MarcoZeroStatus, { bg: string; fg: string }> = {
  ATENDIDO: { bg: '#DCFCE7', fg: '#15803D' },
  RESPONDEU: { bg: '#FEF3C7', fg: '#B45309' },
  AGUARDANDO_RESPOSTA: { bg: '#E0F2FE', fg: '#0369A1' },
  SEM_RESPOSTA: { bg: '#F1F5F9', fg: '#64748B' },
}

export default async function MarcoZeroPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  const papel = await getPapelAtual()
  if (!papel.verTudo) redirect('/dashboard/monitor')

  const sp = await searchParams
  const { itens, resumo } = await getMarcoZero()

  const loteSelecionado = Number(sp.lote) || resumo.lotes[0]?.lote || 0
  const itensDoLote = itens
    .filter((i) => i.lote === loteSelecionado)
    .sort((a, b) => ordem(a.status_calc) - ordem(b.status_calc))

  // Lista para o disparo (o que o Claude web vai usar): nome — telefone, uma por linha.
  const listaDisparo = itensDoLote
    .map((i) => `${i.cliente_nome ?? 'Cliente'} — ${i.cliente_telefone ?? 'sem telefone'}`)
    .join('\n')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flag size={22} style={{ color: '#16A34A' }} /> Marco Zero
          </h1>
          <SeloAtualizacao />
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          O placar da recuperação do atendimento. Enviamos a mensagem para quem espera, em lotes; quem responde é atendido com prioridade.
        </p>
      </div>

      {/* Explicação curta */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', margin: '12px 0 18px', fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
        Cada pessoa contatada aparece aqui e muda de status sozinha conforme o Multi360: <b>Aguardando resposta</b> → <b>Respondeu (atender)</b> → <b>Atendido</b>.
        Quem passa de 7 dias sem responder vira <b>Sem resposta</b> (fica registrado — é a defesa documentada).
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Cartao icone={Send} cor="#1A3C5A" valor={resumo.enviados} label="contatados" />
        <Cartao icone={Reply} cor="#0369A1" valor={resumo.responderam} label="responderam" />
        <Cartao icone={Clock} cor="#B45309" valor={resumo.aguardandoAtendimento} label="responderam e faltam atender" destaque />
        <Cartao icone={CheckCircle2} cor="#15803D" valor={resumo.atendidos} label="já atendidos" />
        <Cartao icone={XCircle} cor="#64748B" valor={resumo.semResposta} label="sem resposta (encerrados)" />
        <Cartao icone={Reply} cor="#0EA5E9" valor={`${resumo.taxaResposta}%`} label="taxa de resposta" />
      </div>

      {/* Freio: pode liberar o próximo lote? */}
      {resumo.temDados && (
        <div style={{
          borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          background: resumo.podeLiberarProximo ? '#DCFCE7' : '#FEF3C7',
          color: resumo.podeLiberarProximo ? '#15803D' : '#B45309',
          border: `1px solid ${resumo.podeLiberarProximo ? '#BBF7D0' : '#FDE68A'}`,
        }}>
          {resumo.podeLiberarProximo ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {resumo.podeLiberarProximo
            ? 'Todos os que responderam já foram atendidos. Pode liberar o próximo lote.'
            : `Ainda há ${resumo.aguardandoAtendimento} pessoa(s) que responderam e não foram atendidas. Atenda essas antes de enviar um novo lote.`}
        </div>
      )}

      {/* Preparar novo lote */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px', marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A', marginBottom: 4 }}>Preparar um novo lote</h2>
        <p style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 12 }}>
          Registra as conversas <b>mais antigas que esperam</b> (uma por cliente, ainda não contatadas). Depois copie a lista e use no disparo da noite.
        </p>
        <PrepararLote padrao={40} />
      </div>

      {/* Tabela por lote */}
      {resumo.lotes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px', marginBottom: 18, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A', marginBottom: 12 }}>Lotes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                <th style={th}>Lote</th>
                <th style={th}>Enviado em</th>
                <th style={{ ...th, textAlign: 'center' }}>Contatados</th>
                <th style={{ ...th, textAlign: 'center' }}>Responderam</th>
                <th style={{ ...th, textAlign: 'center' }}>Faltam atender</th>
                <th style={{ ...th, textAlign: 'center' }}>Atendidos</th>
                <th style={{ ...th, textAlign: 'center' }}>Sem resposta</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {resumo.lotes.map((l) => {
                const ativo = l.lote === loteSelecionado
                return (
                  <tr key={l.lote} style={{ borderTop: '1px solid #EEF2F7', background: ativo ? '#F0FDF4' : undefined }}>
                    <td style={td}>
                      <Link href={`/dashboard/marco-zero?lote=${l.lote}`} style={{ fontWeight: 700, color: '#1A3C5A', textDecoration: 'none' }}>
                        Lote {l.lote}
                      </Link>
                    </td>
                    <td style={{ ...td, color: '#6B7280' }}>{l.enviado_em ? formatarData(l.enviado_em) : '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{l.enviados}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#0369A1', fontWeight: 700 }}>{l.responderam}</td>
                    <td style={{ ...td, textAlign: 'center', color: l.aguardandoAtendimento > 0 ? '#B45309' : '#9CA3AF', fontWeight: l.aguardandoAtendimento > 0 ? 700 : 400 }}>{l.aguardandoAtendimento || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#15803D', fontWeight: 700 }}>{l.atendidos || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#94A3B8' }}>{l.semResposta || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{l.responderam === 0 && <DesfazerLote lote={l.lote} />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalhe do lote selecionado */}
      {loteSelecionado > 0 && itensDoLote.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A' }}>Lote {loteSelecionado} — {itensDoLote.length} pessoas</h2>
            <div style={{ marginLeft: 'auto' }}>
              <CopiarLista linhas={listaDisparo} quantos={itensDoLote.length} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: -6, marginBottom: 12 }}>
            &ldquo;Copiar lista&rdquo; entrega nome e telefone desta leva para usar no disparo da noite.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itensDoLote.map((i) => (
              <Linha key={i.id} i={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ordem(s: MarcoZeroStatus): number {
  // Quem precisa de ação (respondeu e falta atender) primeiro.
  return { RESPONDEU: 0, AGUARDANDO_RESPOSTA: 1, ATENDIDO: 2, SEM_RESPOSTA: 3 }[s]
}

const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 600 }
const td: React.CSSProperties = { padding: '10px 12px' }

function Cartao({
  icone: Icone, valor, label, cor, destaque,
}: {
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  valor: number | string
  label: string
  cor: string
  destaque?: boolean
}) {
  return (
    <div style={{ background: destaque ? '#FFFBEB' : '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: destaque ? '1px solid #FDE68A' : '1px solid transparent' }}>
      <Icone size={14} style={{ color: cor, marginBottom: 2 }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: cor, lineHeight: 1.15 }}>{valor}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
    </div>
  )
}

function Linha({ i }: { i: MarcoZeroItem }) {
  const c = CORES[i.status_calc]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12, border: '1px solid #EEF2F7', background: '#fff' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <Link href={i.protocolo_link ? `/dashboard/monitor/${i.protocolo_link}` : '#'} style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 14, textDecoration: 'none' }}>
          {i.cliente_nome ? formatarNome(i.cliente_nome) : 'Cliente'}
        </Link>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          {formatarTelefone(i.cliente_telefone)}
          {i.departamento ? ` · ${i.departamento}` : ''}
          {i.atendente_nome ? ` · ${formatarNome(i.atendente_nome)}` : ''}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 10px', background: c.bg, color: c.fg }}>
        {ROTULO_MZ_STATUS[i.status_calc]}
      </span>
      <RemoverPessoa id={i.id} nome={i.cliente_nome} />
      {i.protocolo_link && <Link href={`/dashboard/monitor/${i.protocolo_link}`} style={{ color: '#4B7BA6', display: 'inline-flex' }}><ChevronRight size={18} /></Link>}
    </div>
  )
}
