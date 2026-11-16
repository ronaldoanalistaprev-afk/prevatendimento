'use client'

import { useEffect, useState } from 'react'
import { Smartphone, CheckCircle2, Loader2, WifiOff } from 'lucide-react'

interface Status {
  online: boolean
  conectado?: boolean
  numero?: string | null
  qr?: string | null
}

export default function PainelWhatsApp() {
  const [st, setSt] = useState<Status | null>(null)

  useEffect(() => {
    let vivo = true
    async function puxar() {
      try {
        const r = await fetch('/api/whatsapp/status', { cache: 'no-store' })
        const j = await r.json()
        if (vivo) setSt(j)
      } catch {
        if (vivo) setSt({ online: false })
      }
    }
    puxar()
    const t = setInterval(puxar, 3000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: '18px 20px', marginBottom: 18,
  }

  if (!st) {
    return <div style={card}><Linha icone={<Loader2 size={18} className="animate-spin" style={{ color: '#94A3B8' }} />} texto="Verificando o WhatsApp…" /></div>
  }

  if (!st.online) {
    return (
      <div style={{ ...card, background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <Linha icone={<WifiOff size={18} style={{ color: '#B91C1C' }} />} texto="O worker do WhatsApp não está no ar." cor="#B91C1C" />
        <p style={{ fontSize: 12.5, color: '#991B1B', marginTop: 6 }}>Peça para religar o worker (é o programinha que conecta o número).</p>
      </div>
    )
  }

  if (st.conectado) {
    return (
      <div style={{ ...card, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <Linha icone={<CheckCircle2 size={18} style={{ color: '#15803D' }} />} texto={`WhatsApp conectado${st.numero ? ` — ${st.numero}` : ''}`} cor="#15803D" />
        <p style={{ fontSize: 12.5, color: '#166534', marginTop: 6 }}>Mande uma mensagem de outro celular para o número de teste e ela aparece abaixo.</p>
      </div>
    )
  }

  // online, ainda não conectado
  return (
    <div style={card}>
      <Linha icone={<Smartphone size={18} style={{ color: '#1A3C5A' }} />} texto="Conecte o número de teste" />
      <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 14px' }}>
        No celular: <b>WhatsApp → Aparelhos conectados → Conectar um aparelho</b> e aponte a câmera para o código abaixo.
      </p>
      {st.qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={st.qr} alt="QR Code do WhatsApp" width={300} height={300} style={{ border: '1px solid #EEF2F7', borderRadius: 14, display: 'block' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 13.5 }}>
          <Loader2 size={16} className="animate-spin" /> Preparando o QR Code… aguarde alguns segundos.
        </div>
      )}
      <p style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 10 }}>O código se renova sozinho e some quando você conectar.</p>
    </div>
  )
}

function Linha({ icone, texto, cor = '#1A3C5A' }: { icone: React.ReactNode; texto: string; cor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icone}
      <span style={{ fontSize: 15, fontWeight: 700, color: cor }}>{texto}</span>
    </div>
  )
}
