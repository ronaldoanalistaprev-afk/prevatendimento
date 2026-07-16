import Link from 'next/link'
import { getConversas } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import { coresUrgencia, coresEstagio, rotuloEstagio, statusConversa, formatarDataHora, tempoDecorrido } from '@/lib/utils'
import { MessagesSquare, MessageSquarePlus } from 'lucide-react'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

export default async function ConversasPage() {
  const { itens, estado } = await getConversas()

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A' }}>Conversas</h1>
          <AutoRefresh />
          <Link
            href="/dashboard/conversas/nova"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: '0 16px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1A3C5A, #16A34A)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13.5,
              textDecoration: 'none',
            }}
          >
            <MessageSquarePlus size={18} /> Nova conversa
          </Link>
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Todas as conversas, com status e tempo sem resposta.
        </p>
      </div>

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          border: '1px solid #EEF2F7',
          overflow: 'hidden',
        }}
      >
        {itens.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            <MessagesSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            Nenhuma conversa por enquanto.
          </div>
        ) : (
          itens.map((c) => {
            const cores = coresUrgencia(c.nivel_urgencia)
            return (
              <Link
                key={c.id}
                href={`/dashboard/conversas/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#25D366',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {c.pessoa_nome?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#1A3C5A', fontSize: 14 }}>{c.pessoa_nome}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: coresEstagio(c.estagio).bg,
                        color: coresEstagio(c.estagio).fg,
                      }}
                    >
                      {rotuloEstagio(c.estagio)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>
                    {c.canal} · {c.instancia ?? '—'} · último: {c.ultimo_respondido_por_nome ?? '—'} ·{' '}
                    {formatarDataHora(c.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: statusConversa(c.status).bg,
                      color: statusConversa(c.status).fg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {statusConversa(c.status).label}
                  </span>
                  {(c.status === 'ABERTA' || c.status === 'PENDENTE') && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: cores.bg,
                        color: cores.fg,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tempoDecorrido(c.tempo_sem_resposta_horas)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
