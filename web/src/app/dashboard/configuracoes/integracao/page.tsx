import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import SemPermissao from '@/components/SemPermissao'
import IntegracaoMulti360 from '@/components/IntegracaoMulti360'
import { getPapelAtual } from '@/lib/papel'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatarDataHoraSegundos, formatarDuracao } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Status {
  token_status: string
  ultima_sync: string | null
  ultimo_erro: string | null
  atualizado_em: string | null
  tem_token: boolean
}

export default async function IntegracaoPage() {
  const papel = await getPapelAtual()
  // Só o Administrador ATIVO mexe no token (é um segredo de acesso). Mesmo critério da rota de API.
  if (papel.role !== 'ADMIN' || !papel.ativo) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
        <h1 className="titulo" style={{ margin: '12px 0 20px' }}>Integração Multi360</h1>
        <SemPermissao tela="Integração Multi360" />
      </main>
    )
  }

  let st: Status | null = null
  let erroLeitura = false
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('v_at_integracao_status')
      .select('token_status, ultima_sync, ultimo_erro, atualizado_em, tem_token')
      .limit(1)
      .maybeSingle()
    if (error) erroLeitura = true
    st = (data as Status | null) ?? null
  } catch { erroLeitura = true }

  // Estado "de verdade" do token, em linguagem simples.
  const temToken = st?.tem_token === true
  const emDia = temToken && st?.token_status === 'ok'
  const vencido = temToken && st?.token_status === 'vencido'
  const selo = erroLeitura
    ? { classe: 'selo-neutro', texto: 'Estado indisponível' }
    : !temToken
      ? { classe: 'selo-perigo', texto: 'Sem token' }
      : emDia
        ? { classe: 'selo-sucesso', texto: 'Em dia' }
        : vencido
          ? { classe: 'selo-perigo', texto: 'Vencido' }
          : { classe: 'selo-neutro', texto: 'A conferir' }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820 }}>
      <Link href="/dashboard/configuracoes" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Configurações</Link>
      <h1 className="titulo" style={{ margin: '12px 0 8px' }}>Integração Multi360</h1>
      <p className="subtitulo" style={{ marginBottom: 20 }}>
        O sistema lê as conversas do Multi360 usando um token de acesso. Esse token vence de tempos em tempos;
        quando vencer, a sincronização para — e é aqui que você cola um novo, sem depender de ninguém.
      </p>

      {/* Estado atual */}
      <section className="cartao" style={{ marginBottom: 16 }}>
        <div className="cartao-corpo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {erroLeitura
              ? <HelpCircle className="icone" style={{ color: 'var(--tinta-3)', flexShrink: 0 }} aria-hidden="true" focusable="false" />
              : emDia
                ? <CheckCircle2 className="icone" style={{ color: 'var(--sucesso)', flexShrink: 0 }} aria-hidden="true" focusable="false" />
                : vencido || !temToken
                  ? <XCircle className="icone" style={{ color: 'var(--perigo)', flexShrink: 0 }} aria-hidden="true" focusable="false" />
                  : <HelpCircle className="icone" style={{ color: 'var(--tinta-3)', flexShrink: 0 }} aria-hidden="true" focusable="false" />}
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <h2 className="sub-titulo">Token de acesso ao Multi360</h2>
              <div className="texto-apoio">
                {erroLeitura
                  ? 'Não foi possível ler o estado agora. Atualize a página daqui a pouco.'
                  : st?.ultima_sync
                    ? `Última sincronização: ${formatarDataHoraSegundos(st.ultima_sync)} (há ${formatarDuracao(st.ultima_sync)}).`
                    : 'Ainda não houve sincronização pela nuvem.'}
              </div>
            </div>
            <span className={`selo ${selo.classe}`}>{selo.texto}</span>
          </div>
        </div>
      </section>

      {!erroLeitura && (vencido || !temToken) && (
        <div className="aviso aviso-atencao" role="status" style={{ marginBottom: 16 }}>
          <div>
            <b>A leitura das conversas está parada.</b> Enquanto o token não for renovado, as conversas do
            WhatsApp não entram no sistema — o que aparece nas telas é a última leitura. Cole um token novo abaixo.
          </div>
        </div>
      )}

      <IntegracaoMulti360 />
    </main>
  )
}
