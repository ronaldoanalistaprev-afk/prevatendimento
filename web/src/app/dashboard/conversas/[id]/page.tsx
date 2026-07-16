import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getConversa } from '@/lib/dados'
import { formatarCpf, formatarTelefone, rotuloWhatsapp, tempoDecorrido, rotuloEstagio, coresEstagio } from '@/lib/utils'
import ChatBox from '@/components/ChatBox'

export const dynamic = 'force-dynamic'

export default async function ConversaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { conversa, pessoa, identificadores, mensagens } = await getConversa(id)

  if (!conversa) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto' }}>
        <Link href="/dashboard/conversas" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} />
          Voltar
        </Link>
        <div
          style={{
            marginTop: 20,
            padding: 40,
            textAlign: 'center',
            color: '#9CA3AF',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #EEF2F7',
          }}
        >
          Conversa não encontrada (ou banco ainda não conectado).
        </div>
      </div>
    )
  }

  const whatsapp =
    identificadores.find((i) => i.tipo === 'WHATSAPP' && i.principal)?.valor ??
    identificadores.find((i) => i.tipo === 'WHATSAPP')?.valor ??
    null
  const cpf = identificadores.find((i) => i.tipo === 'CPF')?.valor ?? null
  const telefone = identificadores.find((i) => i.tipo === 'TELEFONE')?.valor ?? null
  const est = pessoa ? coresEstagio(pessoa.estagio) : { bg: '#F1F5F9', fg: '#64748B' }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Link href="/dashboard/conversas" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} />
        Voltar
      </Link>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #EEF2F7',
          padding: '16px 20px',
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#25D366',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          {pessoa?.nome?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#1A3C5A', fontSize: 16 }}>{pessoa?.nome ?? 'Pessoa'}</div>
          <div style={{ fontSize: 12.5, color: '#6B7280' }}>
            {telefone ? formatarTelefone(telefone) : rotuloWhatsapp(whatsapp)} · {formatarCpf(cpf)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: est.bg,
              color: est.fg,
            }}
          >
            {pessoa ? rotuloEstagio(pessoa.estagio) : '—'}
          </span>
          <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
            {conversa.status} · sem resposta {tempoDecorrido(conversa.tempo_sem_resposta_horas)}
          </div>
        </div>
      </div>

      <ChatBox conversaId={conversa.id} mensagensIniciais={mensagens} />
    </div>
  )
}
