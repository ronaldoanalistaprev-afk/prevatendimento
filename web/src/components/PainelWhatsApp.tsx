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

  if (!st) {
    return <div className="cartao" style={{ padding: '18px 20px', marginBottom: 18 }}><Linha icone={<Loader2 className="icone animate-spin" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" focusable="false" />} texto="Verificando o WhatsApp…" /></div>
  }

  if (!st.online) {
    return (
      <div className="aviso aviso-perigo" style={{ marginBottom: 18, flexDirection: 'column', alignItems: 'stretch' }}>
        <Linha icone={<WifiOff className="icone" aria-hidden="true" focusable="false" />} texto="O worker do WhatsApp não está no ar." cor="var(--perigo)" />
        <p style={{ fontSize: 13, marginTop: 6 }}>Peça para religar o worker (é o programinha que conecta o número).</p>
      </div>
    )
  }

  if (st.conectado) {
    return (
      <div className="aviso aviso-info" style={{ marginBottom: 18, flexDirection: 'column', alignItems: 'stretch' }}>
        <Linha icone={<CheckCircle2 className="icone" style={{ color: 'var(--sucesso)' }} aria-hidden="true" focusable="false" />} texto={`WhatsApp conectado${st.numero ? ` — ${st.numero}` : ''}`} cor="var(--sucesso)" />
        <p style={{ fontSize: 13, marginTop: 6 }}>Mande uma mensagem de outro celular para o número de teste e ela aparece abaixo.</p>
      </div>
    )
  }

  return (
    <section className="cartao" style={{ padding: '18px 20px', marginBottom: 18 }}>
      <Linha icone={<Smartphone className="icone" style={{ color: 'var(--acao)' }} aria-hidden="true" focusable="false" />} texto="Conecte o número de teste" />
      <p style={{ fontSize: 14, color: 'var(--tinta-2)', margin: '8px 0 14px' }}>No celular: <b>WhatsApp → Aparelhos conectados → Conectar um aparelho</b> e aponte a câmera para o código abaixo.</p>
      {st.qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={st.qr} alt="QR Code do WhatsApp" width={300} height={300} style={{ boxShadow: '0 0 0 1px var(--linha)', borderRadius: 14, display: 'block' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tinta-2)', fontSize: 14 }}><Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> Preparando o QR Code… aguarde alguns segundos.</div>
      )}
      <p className="texto-apoio" style={{ marginTop: 10 }}>O código se renova sozinho e some quando você conectar.</p>
    </section>
  )
}

function Linha({ icone, texto, cor = 'var(--tinta)' }: { icone: React.ReactNode; texto: string; cor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {icone}
      <span style={{ fontSize: 15, fontWeight: 650, color: cor }}>{texto}</span>
    </div>
  )
}
