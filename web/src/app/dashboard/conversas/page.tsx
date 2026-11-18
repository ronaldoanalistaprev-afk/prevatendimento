import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getConversas } from '@/lib/dados'
import { getPapelAtual } from '@/lib/papel'
import BannerConfig from '@/components/BannerConfig'
import PainelWhatsApp from '@/components/PainelWhatsApp'
import { coresUrgencia, coresEstagio, rotuloEstagio, statusConversa, formatarDataHora, tempoDecorrido, formatarNome } from '@/lib/utils'
import { MessagesSquare, MessageSquarePlus, ChevronRight } from 'lucide-react'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

/** Duas iniciais, como no resto do sistema (auditoria T11/P3). */
function iniciais(nome: string | null): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const a = partes[0][0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase()
}

export default async function ConversasPage() {
  const papel = await getPapelAtual()
  if (papel.role !== 'ADMIN') redirect('/dashboard/monitor')
  const { itens, estado } = await getConversas()

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 1100 }}>
      {/* Cabeça da referência: texto à esquerda, botão à direita (no celular, em largura total) — auditoria W4. */}
      <div className="cabeca">
        <div className="cabeca-texto">
          <h1 className="titulo">Laboratório WhatsApp</h1>
          <p className="subtitulo">Teste do nosso WhatsApp próprio (número de teste, separado do Multi360). Só o administrador vê.</p>
          <div style={{ marginTop: 8 }}><AutoRefresh /></div>
        </div>
        <Link href="/dashboard/conversas/nova" className="botao botao-principal"><MessageSquarePlus className="icone icone-p" aria-hidden="true" focusable="false" /> Nova conversa</Link>
      </div>

      <PainelWhatsApp />

      {!estado.configurado && <BannerConfig />}
      {estado.configurado && estado.erro && (
        <div className="aviso aviso-perigo" role="alert" style={{ marginBottom: 16 }}>
          <div>Não foi possível carregar as conversas agora. Recarregue a página; se continuar, avise o responsável técnico.</div>
        </div>
      )}

      <section className="cartao" aria-label="Conversas do número de teste">
        {itens.length === 0 ? (
          <div className="vazio">
            <div className="vazio-icone"><MessagesSquare className="icone" aria-hidden="true" focusable="false" /></div>
            <div className="vazio-titulo">Nenhuma conversa por enquanto</div>
            <p className="vazio-texto">Quando alguém mandar mensagem para o número de teste, ou quando você usar “Nova conversa”, ela aparece aqui.</p>
          </div>
        ) : (
          <ul className="mon-lista">
            {itens.map((c) => {
              const cores = coresUrgencia(c.nivel_urgencia)
              const est = coresEstagio(c.estagio)
              const stt = statusConversa(c.status)
              const nome = c.pessoa_nome ? formatarNome(c.pessoa_nome) : 'Cliente sem nome'
              return (
                <li key={c.id} className="mon-item">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                    <span className="avatar" aria-hidden="true">{iniciais(c.pessoa_nome)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="mon-nome-linha">
                        <Link href={`/dashboard/conversas/${c.id}`} className="mon-nome">{nome}</Link>
                        <span className={`selo ${est.classe}`}>{rotuloEstagio(c.estagio)}</span>
                      </div>
                      <div className="mon-meta">
                        {c.canal} · {c.instancia ?? '—'} · último a responder: {c.ultimo_respondido_por_nome ? formatarNome(c.ultimo_respondido_por_nome) : '—'} · {formatarDataHora(c.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="mon-dir" style={{ flexWrap: 'wrap' }}>
                    <span className={`selo ${stt.classe}`}>{stt.label}</span>
                    {(c.status === 'ABERTA' || c.status === 'PENDENTE') && <span className={`selo ${cores.classe}`}>Sem resposta há {tempoDecorrido(c.tempo_sem_resposta_horas)}</span>}
                    <Link href={`/dashboard/conversas/${c.id}`} className="mon-abrir" aria-label={`Abrir a conversa com ${nome}`}>Abrir <ChevronRight className="icone" aria-hidden="true" focusable="false" /></Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
