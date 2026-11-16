import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apenasDigitos } from '@/lib/utils'
import { resolverEmpresaId } from '@/lib/identidade'

/**
 * Webhook do WhatsApp Cloud API (oficial da Meta) — RECEBER mensagens.
 *
 * GET  = verificação (handshake) que a Meta exige ao cadastrar o webhook:
 *        responde o hub.challenge se o hub.verify_token bater com o nosso.
 * POST = mensagens/eventos recebidos. Reaproveita a MESMA ingestão do Baileys
 *        (RPC ingerir_mensagem_whatsapp → pessoas/conversas/mensagens), então as
 *        mensagens oficiais aparecem no mesmo Laboratório.
 */

export async function GET(req: Request) {
  const u = new URL(req.url)
  const mode = u.searchParams.get('hub.mode')
  const token = u.searchParams.get('hub.verify_token')
  const challenge = u.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_CLOUD_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('forbidden', { status: 403 })
}

type CloudMsg = {
  from?: string
  id?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
  image?: { caption?: string }
  video?: { caption?: string }
  button?: { text?: string }
  interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } }
}

function extrairTexto(m: CloudMsg): string {
  return (
    m.text?.body ||
    m.image?.caption ||
    m.video?.caption ||
    m.button?.text ||
    m.interactive?.button_reply?.title ||
    m.interactive?.list_reply?.title ||
    ''
  )
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  const db = createAdminClient()
  const empresaId = await resolverEmpresaId(db)

  try {
    const entradas = (body as { entry?: { changes?: { value?: Record<string, unknown> }[] }[] }).entry ?? []
    for (const entrada of entradas) {
      for (const change of entrada.changes ?? []) {
        const value = (change.value ?? {}) as {
          metadata?: { phone_number_id?: string }
          contacts?: { profile?: { name?: string }; wa_id?: string }[]
          messages?: CloudMsg[]
          statuses?: { id?: string; status?: string }[]
        }
        const instancia = apenasDigitos(value.metadata?.phone_number_id) || null
        const nomePerfil = value.contacts?.[0]?.profile?.name ?? ''

        // Mensagens recebidas → ingestão (mesma do Baileys)
        for (const m of value.messages ?? []) {
          const de = apenasDigitos(m.from)
          const texto = extrairTexto(m).trim()
          if (!de || !texto || !empresaId) continue
          const ocorrido = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString()
          await db.rpc('ingerir_mensagem_whatsapp', {
            p_empresa: empresaId,
            p_valor: de,
            p_nome: nomePerfil,
            p_instancia: instancia,
            p_conteudo: texto,
            p_tipo: 'texto',
            p_external_id: m.id ?? null,
            p_ocorrido: ocorrido,
            p_jid: `${de}@s.whatsapp.net`,
            p_telefone: de,
          })
        }

        // Status de entrega/leitura das mensagens que ENVIAMOS (best-effort)
        for (const s of value.statuses ?? []) {
          if (!s.id || !s.status) continue
          const st = s.status === 'read' ? 'read' : s.status === 'delivered' ? 'delivered' : s.status === 'sent' ? 'sent' : null
          if (st) await db.from('mensagens').update({ external_status: st }).eq('external_message_id', s.id)
        }
      }
    }
  } catch {
    // Nunca falha para a Meta (senão ela reenvia em loop). Só ignora o que não entendeu.
  }

  // A Meta exige 200 rápido, senão reenvia.
  return NextResponse.json({ ok: true })
}
