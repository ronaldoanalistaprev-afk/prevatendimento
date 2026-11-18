import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MessagesSquare } from 'lucide-react'
import { getConversa } from '@/lib/dados'
import { getPapelAtual } from '@/lib/papel'
import { formatarCpf, formatarTelefone, rotuloWhatsapp, tempoDecorrido, rotuloEstagio, coresEstagio, statusConversa, formatarNome } from '@/lib/utils'
import ChatBox from '@/components/ChatBox'

export const dynamic = 'force-dynamic'

/** Duas iniciais, como no resto do sistema (auditoria T11/P3). */
function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const a = partes[0][0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase()
}

export default async function ConversaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const papel = await getPapelAtual()
  if (papel.role !== 'ADMIN') redirect('/dashboard/monitor')
  const { id } = await params
  const { conversa, pessoa, identificadores, mensagens } = await getConversa(id)

  if (!conversa) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820 }}>
        <Link href="/dashboard/conversas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Laboratório WhatsApp</Link>
        <div className="cartao" style={{ marginTop: 14 }}><div className="vazio">
          <div className="vazio-icone"><MessagesSquare className="icone" aria-hidden="true" focusable="false" /></div>
          <h1 className="vazio-titulo">Conversa não encontrada</h1>
          <p className="vazio-texto">Ela pode ter sido apagada, ou o endereço está incompleto. Volte à lista e abra a conversa por lá.</p>
          <Link href="/dashboard/conversas" className="botao botao-secundario">Voltar às conversas</Link>
        </div></div>
      </main>
    )
  }

  const whatsapp = identificadores.find((i) => i.tipo === 'WHATSAPP' && i.principal)?.valor ?? identificadores.find((i) => i.tipo === 'WHATSAPP')?.valor ?? null
  const cpf = identificadores.find((i) => i.tipo === 'CPF')?.valor ?? null
  const telefone = identificadores.find((i) => i.tipo === 'TELEFONE')?.valor ?? null
  const est = pessoa ? coresEstagio(pessoa.estagio) : null
  const stt = statusConversa(conversa.status)
  const nome = pessoa?.nome ? formatarNome(pessoa.nome) : 'Cliente sem nome'

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 40px)' }}>
      <Link href="/dashboard/conversas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Laboratório WhatsApp</Link>

      <section className="cartao" style={{ padding: '16px 20px', marginTop: 12, display: 'flex', alignItems: 'center', gap: '10px 14px', flexWrap: 'wrap' }}>
        <span className="avatar g" aria-hidden="true">{iniciais(pessoa?.nome)}</span>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <h1 className="titulo" style={{ fontSize: 22, overflowWrap: 'anywhere' }}>{nome}</h1>
          <div className="texto-apoio">{telefone ? formatarTelefone(telefone) : rotuloWhatsapp(whatsapp)}{cpf ? ` · CPF ${formatarCpf(cpf)}` : ''}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {est && pessoa && <span className={`selo ${est.classe}`}>{rotuloEstagio(pessoa.estagio)}</span>}
            <span className={`selo ${stt.classe}`}>{stt.label}</span>
          </div>
          {conversa.tempo_sem_resposta_horas != null && <div className="texto-apoio">Sem resposta há {tempoDecorrido(conversa.tempo_sem_resposta_horas)}</div>}
        </div>
      </section>

      <ChatBox conversaId={conversa.id} mensagensIniciais={mensagens} />
    </main>
  )
}
