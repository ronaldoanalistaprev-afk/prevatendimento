import { createClient } from '@/lib/supabase/server'
import BannerConfig from '@/components/BannerConfig'

export const dynamic = 'force-dynamic'

interface StatColaborador {
  id: string
  nome: string
  email: string
  total_conversas: number
  conversas_abertas: number
  conversas_pendentes: number
  tempo_medio_resposta: number | null
}

async function getStats(): Promise<{ itens: StatColaborador[]; configurado: boolean; erro: string | null }> {
  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  if (!configurado) return { itens: [], configurado: false, erro: null }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('v_stats_colaboradores').select('*')
    if (error) return { itens: [], configurado: true, erro: error.message }
    return { itens: (data ?? []) as StatColaborador[], configurado: true, erro: null }
  } catch (e) {
    return { itens: [], configurado: true, erro: (e as Error).message }
  }
}

export default async function GestaoPage() {
  const { itens, configurado, erro } = await getStats()

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A' }}>Gestão de Pendências</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Carga e SLA por colaborador — quem tem mais conversas paradas.
        </p>
      </div>

      {(!configurado || erro) && <BannerConfig erro={erro} />}

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #EEF2F7',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {itens.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Sem dados de colaboradores ainda.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Atendente</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Conversas</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Abertas</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Pendentes</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tempo médio (h)</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: '#1A3C5A' }}>{s.nome}</td>
                  <td style={{ padding: '12px 20px' }}>{s.total_conversas}</td>
                  <td style={{ padding: '12px 20px' }}>{s.conversas_abertas}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: s.conversas_pendentes > 0 ? '#C2410C' : '#15803D',
                      }}
                    >
                      {s.conversas_pendentes}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>{s.tempo_medio_resposta ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
