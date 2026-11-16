/**
 * WhatsApp Cloud API (oficial da Meta) — envio.
 * Substitui o gateway Baileys pelo canal OFICIAL. Usa Phone Number ID + token
 * (em web/.env.local: WHATSAPP_CLOUD_*). Regra da Meta: texto livre só dentro da
 * janela de 24h após o cliente escrever; fora disso, só template aprovado.
 */

const GRAPH = 'https://graph.facebook.com/v22.0'

export function cloudConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID)
}

function soDigitos(v: string | null | undefined): string {
  return String(v ?? '').replace(/\D/g, '')
}

/** Envia um TEXTO (sessão) ao número informado. Retorna o id da mensagem ou o erro. */
export async function enviarTextoCloud(para: string, texto: string): Promise<{ ok: boolean; id?: string | null; erro?: string }> {
  const pnid = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_CLOUD_TOKEN
  if (!pnid || !token) return { ok: false, erro: 'Cloud API não configurada' }
  const to = soDigitos(para)
  if (!to || !texto.trim()) return { ok: false, erro: 'destino e texto obrigatórios' }
  try {
    const r = await fetch(`${GRAPH}/${pnid}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: texto } }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      const e = (j as { error?: { message?: string; error_data?: { details?: string } } }).error
      return { ok: false, erro: e?.error_data?.details ?? e?.message ?? `HTTP ${r.status}` }
    }
    const id = (j as { messages?: { id?: string }[] }).messages?.[0]?.id ?? null
    return { ok: true, id }
  } catch (e) {
    return { ok: false, erro: (e as Error).message }
  }
}
