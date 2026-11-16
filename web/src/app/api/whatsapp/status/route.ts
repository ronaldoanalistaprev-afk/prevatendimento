import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Status do worker de WhatsApp (Baileys) para a tela do Laboratório: diz se está
 * conectado e, se não estiver, devolve o QR Code (imagem) para escanear. Só ADMIN.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'não autenticado' }, { status: 401 })
  const { data: perfil } = await supabase.from('usuarios').select('role').eq('id', user.id).maybeSingle()
  if ((perfil as { role?: string } | null)?.role !== 'ADMIN') {
    return NextResponse.json({ erro: 'só o administrador' }, { status: 403 })
  }

  const url = process.env.WHATSAPP_SERVICE_URL
  if (!url) return NextResponse.json({ online: false, motivo: 'worker não configurado' })
  try {
    const r = await fetch(`${url}/status`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!r.ok) return NextResponse.json({ online: false })
    const j = await r.json()
    return NextResponse.json({ online: true, conectado: !!j.conectado, numero: j.numero ?? null, qr: j.qr ?? null })
  } catch {
    return NextResponse.json({ online: false })
  }
}
