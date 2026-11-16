import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getConversas } from '@/lib/dados'
import { getPapelAtual } from '@/lib/papel'
import BannerConfig from '@/components/BannerConfig'
import PainelWhatsApp from '@/components/PainelWhatsApp'
import { coresUrgencia, coresEstagio, rotuloEstagio, statusConversa, formatarDataHora, tempoDecorrido, formatarNome } from '@/lib/utils'
import { MessagesSquare, MessageSquarePlus } from 'lucide-react'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

function inicial(nome: string | null): string {
  return nome?.[0]?.toUpperCase() ?? '?'
}

export default async function ConversasPage() {
  const papel = await getPapelAtual()
  if (papel.role !== 'ADMIN') redirect('/dashboard/monitor')
  const { itens, estado } = await getConversas()

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      <div className="cabeca">
        <div className="cabeca-texto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="titulo">Laboratório WhatsApp</h1>
            <AutoRefresh />
            <Link href="/dashboard/conversas/nova" className="botao botao-principal" style={{ marginLeft: 'auto' }}><MessageSquarePlus className="icone icone-p" aria-hidden="true" focusable="false" /> Nova conversa</Link>
          </div>
          <p className="subtitulo">Teste do nosso WhatsApp próprio (número de teste, separado do Multi360). Só o administrador vê.</p>
        </div>
      </div>

      <PainelWhatsApp />

      {(!estado.configurado || estado.erro) && <BannerConfig erro={estado.erro} />}

      <section className="cartao" style={{ overflow: 'hidden' }}>
        {itens.length === 0 ? (
          <div className="vazio" style={{ alignItems: 'center', textAlign: 'center' }}>
            <MessagesSquare className="icone" style={{ width: 32, height: 32, color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />
            <p className="vazio-texto" style={{ maxWidth: 'none' }}>Nenhuma conversa por enquanto.</p>
          </div>
        ) : (
          itens.map((c) => {
            const cores = coresUrgencia(c.nivel_urgencia)
            const est = coresEstagio(c.estagio)
            const stt = statusConversa(c.status)
            return (
              <Link key={c.id} href={`/dashboard/conversas/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--linha)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--acao-suave)', color: 'var(--acao)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{inicial(c.pessoa_nome)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--tinta)', fontSize: 14, overflowWrap: 'anywhere' }}>{c.pessoa_nome ? formatarNome(c.pessoa_nome) : 'Cliente'}</span>
                    <span className="selo" style={{ background: est.bg, color: est.fg }}>{rotuloEstagio(c.estagio)}</span>
                  </div>
                  <div className="texto-apoio" style={{ marginTop: 2 }}>{c.canal} · {c.instancia ?? '—'} · último: {c.ultimo_respondido_por_nome ?? '—'} · {formatarDataHora(c.created_at)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="selo" style={{ background: stt.bg, color: stt.fg, whiteSpace: 'nowrap' }}>{stt.label}</span>
                  {(c.status === 'ABERTA' || c.status === 'PENDENTE') && <span className="selo" style={{ background: cores.bg, color: cores.fg, whiteSpace: 'nowrap' }}>{tempoDecorrido(c.tempo_sem_resposta_horas)}</span>}
                </div>
              </Link>
            )
          })
        )}
      </section>
    </main>
  )
}
