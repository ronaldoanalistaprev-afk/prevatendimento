import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getConversa } from '@/lib/dados'
import { getPapelAtual } from '@/lib/papel'
import { formatarCpf, formatarTelefone, rotuloWhatsapp, tempoDecorrido, rotuloEstagio, coresEstagio, formatarNome } from '@/lib/utils'
import ChatBox from '@/components/ChatBox'

export const dynamic = 'force-dynamic'

export default async function ConversaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const papel = await getPapelAtual()
  if (papel.role !== 'ADMIN') redirect('/dashboard/monitor')
  const { id } = await params
  const { conversa, pessoa, identificadores, mensagens } = await getConversa(id)

  if (!conversa) {
    return (
      <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820 }}>
        <Link href="/dashboard/conversas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Voltar</Link>
        <div className="cartao" style={{ marginTop: 14 }}><div className="vazio"><p className="vazio-texto">Conversa não encontrada (ou banco ainda não conectado).</p></div></div>
      </main>
    )
  }

  const whatsapp = identificadores.find((i) => i.tipo === 'WHATSAPP' && i.principal)?.valor ?? identificadores.find((i) => i.tipo === 'WHATSAPP')?.valor ?? null
  const cpf = identificadores.find((i) => i.tipo === 'CPF')?.valor ?? null
  const telefone = identificadores.find((i) => i.tipo === 'TELEFONE')?.valor ?? null
  const est = pessoa ? coresEstagio(pessoa.estagio) : { bg: 'var(--recuo-2)', fg: 'var(--tinta-2)' }

  return (
    <main id="conteudo" className="conteudo" tabIndex={-1} style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 40px)' }}>
      <Link href="/dashboard/conversas" className="voltar"><ArrowLeft className="icone icone-p" aria-hidden="true" focusable="false" /> Voltar</Link>

      <section className="cartao" style={{ padding: '16px 20px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--acao-suave)', color: 'var(--acao)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{pessoa?.nome?.[0]?.toUpperCase() ?? '?'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650, color: 'var(--tinta)', fontSize: 16, overflowWrap: 'anywhere' }}>{pessoa?.nome ? formatarNome(pessoa.nome) : 'Pessoa'}</div>
          <div className="texto-apoio">{telefone ? formatarTelefone(telefone) : rotuloWhatsapp(whatsapp)} · {formatarCpf(cpf)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="selo" style={{ background: est.bg, color: est.fg }}>{pessoa ? rotuloEstagio(pessoa.estagio) : '—'}</span>
          <div className="texto-apoio" style={{ marginTop: 6 }}>{conversa.status} · sem resposta {tempoDecorrido(conversa.tempo_sem_resposta_horas)}</div>
        </div>
      </section>

      <ChatBox conversaId={conversa.id} mensagensIniciais={mensagens} />
    </main>
  )
}
