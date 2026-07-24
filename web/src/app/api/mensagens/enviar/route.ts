import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarEvento } from '@/lib/eventos'

/**
 * Envio de resposta pelo colaborador.
 * 1) Autentica o usuário logado (Supabase Auth)
 * 2) Salva a mensagem (quem = COLABORADOR) e atualiza a conversa
 * 3) Tenta entregar ao WhatsApp via whatsapp-service (Baileys).
 *    Se o serviço estiver fora do ar, a mensagem fica salva com status 'failed'
 *    e pode ser reenviada depois — nada se perde.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  }

  let body: { conversa_id?: string; conteudo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const conversaId = body.conversa_id
  const conteudo = (body.conteudo ?? '').trim()
  if (!conversaId || !conteudo) {
    return NextResponse.json({ erro: 'conversa_id e conteudo são obrigatórios' }, { status: 400 })
  }

  const db = createAdminClient()
  const agora = new Date().toISOString()

  // Nome do colaborador (tabela usuarios; fallback para e-mail)
  const { data: perfil } = await db
    .from('usuarios')
    .select('id, nome')
    .eq('id', user.id)
    .maybeSingle()
  const nomeColaborador = perfil?.nome ?? user.email ?? 'Atendente'

  // Dados da conversa/pessoa para saber para onde enviar
  const { data: conversa } = await db
    .from('conversas')
    .select('id, instancia, pessoa_id, empresa_id, wa_jid')
    .eq('id', conversaId)
    .single()
  if (!conversa) {
    return NextResponse.json({ erro: 'conversa não encontrada' }, { status: 404 })
  }
  // Destino = WhatsApp principal da Pessoa (ou qualquer WhatsApp dela)
  const { data: idents } = await db
    .from('identificadores')
    .select('valor, principal')
    .eq('pessoa_id', conversa.pessoa_id)
    .eq('tipo', 'WHATSAPP')
    .order('principal', { ascending: false })
  const destino = idents?.[0]?.valor ?? null
  const jid = (conversa.wa_jid as string | null) ?? null

  // Tenta entregar ao WhatsApp (jid completo tem prioridade; funciona p/ @lid)
  let externalStatus: 'sent' | 'failed' = 'failed'
  let externalId: string | null = null
  if (process.env.WHATSAPP_SERVICE_URL && (jid || destino)) {
    try {
      const resp = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ingest-secret': process.env.INGEST_SECRET ?? '',
        },
        body: JSON.stringify({ jid, para: destino, conteudo, instancia: conversa.instancia }),
      })
      if (resp.ok) {
        const j = await resp.json().catch(() => ({}))
        externalStatus = 'sent'
        externalId = j?.id ?? null
      }
    } catch {
      externalStatus = 'failed'
    }
  }

  // Salva a mensagem
  const { data: mensagem, error } = await db
    .from('mensagens')
    .insert({
      empresa_id: conversa.empresa_id,
      conversa_id: conversaId,
      quem: 'COLABORADOR',
      enviado_por: user.id,
      enviado_por_nome: nomeColaborador,
      conteudo,
      tipo: 'texto',
      external_message_id: externalId,
      external_status: externalStatus,
      timestamp_recebido: agora,
    })
    .select('*')
    .single()
  if (error) {
    return NextResponse.json({ erro: `falha ao salvar: ${error.message}` }, { status: 500 })
  }

  // Atualiza a conversa (colaborador respondeu → status RESPONDIDA)
  await db
    .from('conversas')
    .update({
      ultima_resposta_quem: 'COLABORADOR',
      ultimo_respondido_por: user.id,
      ultimo_respondido_por_nome: nomeColaborador,
      data_ultima_resposta_colaborador: agora,
      status: 'RESPONDIDA',
      updated_at: agora,
    })
    .eq('id', conversaId)

  // Linha do tempo: registrar o evento da mensagem enviada
  await registrarEvento(db, {
    empresaId: conversa.empresa_id as string,
    pessoaId: conversa.pessoa_id as string,
    tipo: 'mensagem_enviada',
    canal: 'whatsapp',
    conteudo,
    atorTipo: 'COLABORADOR',
    atorId: user.id,
    atorNome: nomeColaborador,
    conversaId,
    mensagemId: mensagem?.id ?? null,
    ocorridoEm: agora,
  })

  return NextResponse.json({ ok: true, entregue: externalStatus === 'sent', mensagem })
}
