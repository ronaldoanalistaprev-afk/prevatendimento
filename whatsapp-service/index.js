// ============================================================================
// PrevAtendimento — WhatsApp Service (Baileys)
// Conecta UM número de WhatsApp via QR Code (como o WhatsApp Web), 100% no seu
// servidor. Ao receber mensagem, faz POST na rota de ingestão do app Next.
// Expõe POST /send para o app entregar respostas ao WhatsApp.
//
// ⚠️ Uso não-oficial (contra os termos do WhatsApp). Use um número SECUNDÁRIO
//    durante os testes. Depois migramos para a Cloud API oficial da Meta —
//    o app não muda, só troca quem faz POST na rota de ingestão.
// ============================================================================

require('dotenv').config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const express = require('express')

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000'
const INGEST_SECRET = process.env.INGEST_SECRET || ''
const PORT = process.env.PORT || 8088

const logger = pino({ level: 'warn' })
let sock = null
let numeroConectado = null

function soDigitos(v) {
  return String(v || '').replace(/\D/g, '')
}

// ── Envia a mensagem recebida para o app Next (rota de ingestão) ────────────
async function enviarParaApp(payload) {
  try {
    const res = await fetch(`${WEB_URL}/api/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ingest-secret': INGEST_SECRET,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error(`[ingest] ${res.status}: ${txt}`)
    }
  } catch (err) {
    console.error('[ingest] falha ao enviar para o app:', err.message)
  }
}

// ── Reporta status de entrega/leitura das mensagens enviadas ─────────────────
async function postStatus(externalId, status) {
  try {
    await fetch(`${WEB_URL}/api/webhook/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-secret': INGEST_SECRET },
      body: JSON.stringify({ external_message_id: externalId, status }),
    })
  } catch (err) {
    console.error('[status] falha:', err.message)
  }
}

// ── Extrai texto de diferentes formatos de mensagem do WhatsApp ─────────────
function extrairTexto(msg) {
  const m = msg.message || {}
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  )
}

// Tenta descobrir o TELEFONE real mesmo quando o contato chega como @lid.
async function extrairTelefone(msg, jid) {
  // 1) O próprio remoteJid já é um telefone (contato "antigo")
  if (jid.endsWith('@s.whatsapp.net')) return soDigitos(jid.split('@')[0])

  // 2) Campos alternativos que o Baileys pode trazer p/ contatos @lid
  const k = msg.key || {}
  const candidatos = [k.remoteJidAlt, k.senderPn, k.participantPn, k.participantAlt, msg.senderPn, msg.participant]
  for (const c of candidatos) {
    if (!c) continue
    const s = String(c)
    if (s.includes('@s.whatsapp.net')) return soDigitos(s.split('@')[0])
    if (!s.includes('@lid')) {
      const d = soDigitos(s)
      if (d.length >= 10 && d.length <= 15) return d
    }
  }

  // 3) Mapeamento LID -> telefone do próprio Baileys, se disponível
  try {
    const lm = sock?.signalRepository?.lidMapping
    const pn = lm?.getPNForLID ? await lm.getPNForLID(jid) : null
    if (pn && String(pn).includes('@s.whatsapp.net')) return soDigitos(String(pn).split('@')[0])
  } catch {}

  return null
}

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_state')
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['PrevAtendimento', 'Chrome', '1.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  // Status de entrega/leitura das mensagens que ENVIAMOS (fromMe)
  sock.ev.on('messages.update', async (updates) => {
    for (const u of updates) {
      if (!u.key?.fromMe || !u.key?.id) continue
      const st = u.update?.status
      if (st == null) continue
      let status = null
      if (st === 2) status = 'sent'        // servidor recebeu (✓)
      else if (st === 3) status = 'delivered' // entregue (✓✓)
      else if (st === 4 || st === 5) status = 'read' // lido (✓✓ azul)
      if (status) await postStatus(u.key.id, status)
    }
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📲  Escaneie o QR Code abaixo no WhatsApp (Aparelhos conectados):\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      numeroConectado = soDigitos(sock.user?.id?.split(':')[0])
      console.log(`\n✅  Conectado como ${numeroConectado}. Recebendo mensagens...\n`)
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      const deveReconectar = code !== DisconnectReason.loggedOut
      console.log(`⚠️  Conexão fechada (código ${code}). ${deveReconectar ? 'Reconectando...' : 'Deslogado — apague auth_state e reconecte.'}`)
      if (deveReconectar) iniciar()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue
      const jid = msg.key.remoteJid || ''
      if (jid.endsWith('@g.us')) continue // ignora grupos por enquanto

      const texto = extrairTexto(msg)
      if (!texto) continue

      const telefone = await extrairTelefone(msg, jid)
      // Diagnóstico: mostra a estrutura da key p/ localizar o telefone quando vier @lid
      console.log('[debug key]', JSON.stringify(msg.key), '=> telefone:', telefone)

      await enviarParaApp({
        instancia: numeroConectado,
        de: soDigitos(jid.split('@')[0]),
        jid, // endereço WhatsApp completo (telefone@s.whatsapp.net ou lid@lid) — para responder no destino certo
        telefone, // telefone real, quando o WhatsApp o expõe
        nome_perfil: msg.pushName || '',
        conteudo: texto,
        tipo: 'texto',
        external_message_id: msg.key.id,
        timestamp: Number(msg.messageTimestamp) || undefined,
      })
      console.log(`💬  ${msg.pushName || jid}${telefone ? ' (' + telefone + ')' : ''}: ${texto.slice(0, 60)}`)
    }
  })
}

// ── Servidor HTTP: o app Next chama POST /send para enviar respostas ────────
const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, conectado: Boolean(numeroConectado), numero: numeroConectado })
})

app.post('/send', async (req, res) => {
  if (req.headers['x-ingest-secret'] !== INGEST_SECRET) {
    return res.status(401).json({ erro: 'não autorizado' })
  }
  // Prioriza o jid completo (funciona tanto p/ telefone quanto p/ @lid).
  // Sem jid, reconstrói a partir do número (@s.whatsapp.net).
  const jidBruto = String(req.body?.jid || '')
  const para = soDigitos(req.body?.para)
  const destino = jidBruto.includes('@') ? jidBruto : para ? `${para}@s.whatsapp.net` : null
  const conteudo = String(req.body?.conteudo || '').trim()
  if (!destino || !conteudo) {
    return res.status(400).json({ erro: 'destino (jid ou para) e conteudo são obrigatórios' })
  }
  if (!sock || !numeroConectado) {
    return res.status(503).json({ erro: 'whatsapp ainda não conectado' })
  }
  // Se for telefone (@s.whatsapp.net), confere se o número EXISTE no WhatsApp
  if (destino.endsWith('@s.whatsapp.net')) {
    try {
      const num = destino.split('@')[0]
      const [info] = await sock.onWhatsApp(num)
      if (!info || !info.exists) {
        return res.status(422).json({ erro: 'número não está no WhatsApp' })
      }
    } catch (e) {
      // se a checagem falhar por algum motivo, não bloqueia — tenta enviar
    }
  }
  try {
    const sent = await sock.sendMessage(destino, { text: conteudo })
    res.json({ ok: true, id: sent?.key?.id ?? null })
  } catch (err) {
    console.error('[send] erro:', err.message)
    res.status(500).json({ erro: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀  whatsapp-service ouvindo em http://localhost:${PORT}`)
})

iniciar().catch((err) => {
  console.error('Falha ao iniciar Baileys:', err)
  process.exit(1)
})
