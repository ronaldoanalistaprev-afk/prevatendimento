import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Server } from 'lucide-react'
import { getPapelAtual } from '@/lib/papel'
import { getPermissoesMapa, podeAcessar } from '@/lib/permissoes'
import { getMonitorProtocolos } from '@/lib/dados'
import { formatarDataHoraSegundos, formatarDuracao } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function LinhaStatus({ ok, titulo, detalhe }: { ok: boolean; titulo: string; detalhe: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
      {ok ? <CheckCircle2 className="icone" style={{ color: 'var(--sucesso)', flexShrink: 0 }} aria-hidden="true" focusable="false" /> : <XCircle className="icone" style={{ color: 'var(--perigo)', flexShrink: 0 }} aria-hidden="true" focusable="false" />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tinta)' }}>{titulo}</div>
        <div className="texto-apoio">{detalhe}</div>
      </div>
      <span className={`selo ${ok ? 'selo-sucesso' : 'selo-perigo'}`}>{ok ? 'OK' : 'Atenção'}</span>
    </div>
  )
}

export default async function SituacaoPage() {
  const [papel, mapa] = await Promise.all([getPapelAtual(), getPermissoesMapa()])
  if (!podeAcessar(mapa, 'configuracoes', papel.role)) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <div className="cartao" style={{ marginTop: 8 }}><div className="vazio"><p className="vazio-texto">Você não tem acesso a esta tela.</p></div></div>
      </main>
    )
  }

  const bancoOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const cadastroOk = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { resumo } = await getMonitorProtocolos(undefined, 'tudo', undefined, 'abertas')
  const horas = resumo.atualizadoEm ? (Date.now() - new Date(resumo.atualizadoEm).getTime()) / 3_600_000 : null
  const leitorRecente = horas != null && horas < 1

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 20px' }}>
        <Server className="icone icone-g" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" /> Situação do sistema
      </h1>

      <section className="cartao"><div className="cartao-corpo" style={{ paddingTop: 4 }}>
        <LinhaStatus ok={bancoOk} titulo="Banco de dados" detalhe="Onde ficam guardadas as conversas, clientes e mensagens." />
        <LinhaStatus ok={cadastroOk} titulo="Cadastro de logins" detalhe="Permite criar e editar os acessos da equipe." />
        <LinhaStatus ok={leitorRecente} titulo="Leitor do Multi360" detalhe={resumo.atualizadoEm ? `Última atualização: ${formatarDataHoraSegundos(resumo.atualizadoEm)} (há ${formatarDuracao(resumo.atualizadoEm)})` : 'Ainda não sincronizado.'} />
      </div></section>
      {!leitorRecente && (
        <div className="aviso aviso-atencao" style={{ marginTop: 10 }}>
          <div><b>O leitor de conversas está parado.</b> Enquanto ele não voltar, as conversas do WhatsApp não são atualizadas aqui — o que você vê é a última leitura. Avise o responsável técnico para religá-lo.</div>
        </div>
      )}
    </main>
  )
}
