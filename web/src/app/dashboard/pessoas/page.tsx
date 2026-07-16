import Link from 'next/link'
import { getPessoas } from '@/lib/dados'
import BannerConfig from '@/components/BannerConfig'
import { formatarCpf, formatarTelefone, formatarDataHora, rotuloEstagio, coresEstagio, rotuloWhatsapp } from '@/lib/utils'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PessoasPage() {
  const pessoas = await getPessoas()
  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A' }}>Pessoas</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Identidade única de cada pessoa. Um mesmo cadastro reúne todos os WhatsApps, CPF e demais
          identificadores — e evolui de Pretenso Cliente a Cliente sem duplicar.
        </p>
      </div>

      {!configurado && <BannerConfig />}

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          border: '1px solid #EEF2F7',
          overflow: 'hidden',
        }}
      >
        {pessoas.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            Nenhuma pessoa cadastrada ainda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Estágio</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>WhatsApp</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>CPF</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Responsável</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Última msg</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => {
                  const est = coresEstagio(p.estagio)
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 600 }}>
                        <Link href={`/dashboard/pessoas/${p.id}`} style={{ color: '#1A3C5A', textDecoration: 'none' }}>
                          {p.nome}
                        </Link>
                        {p.provisorio && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: '#9CA3AF' }}>(provisório)</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: est.bg,
                            color: est.fg,
                          }}
                        >
                          {rotuloEstagio(p.estagio)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: '#374151' }}>
                        {p.telefone ? formatarTelefone(p.telefone) : rotuloWhatsapp(p.whatsapp_principal)}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#374151' }}>{formatarCpf(p.cpf)}</td>
                      <td style={{ padding: '12px 20px', color: '#374151' }}>{p.responsavel_nome ?? '—'}</td>
                      <td style={{ padding: '12px 20px', color: '#6B7280' }}>
                        {formatarDataHora(p.data_ultima_msg)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
