import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Recebe atualizações de status de entrega/leitura do WhatsApp (do worker Baileys).
 * Atualiza a mensagem correspondente (por external_message_id).
 *
 * Body: { external_message_id: string, status: 'sent'|'delivered'|'read'|'failed' }
 * Protegido por header `x-ingest-secret`.
 */
export async function POST(req: Request) {
  const segredo = req.headers.get('x-ingest-secret')
  if (!process.env.INGEST_SECRET || segredo !== process.env.INGEST_SECRET) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  let body: { external_message_id?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const id = body.external_message_id
  const status = body.status
  if (!id || !['sent', 'delivered', 'read', 'failed'].includes(status ?? '')) {
    return NextResponse.json({ erro: 'external_message_id e status válidos são obrigatórios' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db
    .from('mensagens')
    .update({ external_status: status })
    .eq('external_message_id', id)
  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
