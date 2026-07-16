import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Server } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { getMonitorProtocolos } from '@/lib/dados'
import { formatarDataHoraSegundos, formatarDuracao } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function LinhaStatus({ ok, titulo, detalhe }: { ok: boolean; titulo: string; detalhe: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #F1F5F9' }}>
      {ok ? <CheckCircle2 size={20} style={{ color: '#16A34A', flexShrink: 0 }} /> : <XCircle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A3C5A' }}>{titulo}</div>
        <div style={{ fontSize: 12.5, color: '#6B7280' }}>{detalhe}</div>
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: ok ? '#15803D' : '#B91C1C' }}>{ok ? 'OK' : 'ATENÇÃO'}</span>
    </div>
  )
}

export default async function SituacaoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Você não tem acesso a esta tela.</div>
      </div>
    )
  }

  const bancoOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const cadastroOk = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { resumo } = await getMonitorProtocolos(undefined, 'tudo', undefined, 'abertas')
  const horas = resumo.atualizadoEm ? (Date.now() - new Date(resumo.atualizadoEm).getTime()) / 3_600_000 : null
  const leitorRecente = horas != null && horas < 1

  return (
    <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto' }}>
      <Link href="/dashboard/configuracoes" style={{ color: '#4B7BA6', fontSize: 14, textDecoration: 'none' }}>
        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6 }} /> Configurações
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A3C5A', display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 20px' }}>
        <Server size={22} style={{ color: '#16A34A' }} /> Situação do sistema
      </h1>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '4px 24px 14px' }}>
        <LinhaStatus ok={bancoOk} titulo="Banco de dados" detalhe="Onde ficam guardadas as conversas, clientes e mensagens." />
        <LinhaStatus ok={cadastroOk} titulo="Cadastro de logins" detalhe="Permite criar e editar os acessos da equipe." />
        <LinhaStatus
          ok={leitorRecente}
          titulo="Leitor do Multi360"
          detalhe={resumo.atualizadoEm ? `Última atualização: ${formatarDataHoraSegundos(resumo.atualizadoEm)} (há ${formatarDuracao(resumo.atualizadoEm)})` : 'Ainda não sincronizado.'}
        />
      </div>
      {!leitorRecente && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginTop: 10, fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
          <b>O leitor de conversas está parado.</b> Enquanto ele não voltar, as conversas do WhatsApp não são atualizadas
          aqui — o que você vê é a última leitura. Avise o responsável técnico para religá-lo.
        </div>
      )}
    </div>
  )
}
