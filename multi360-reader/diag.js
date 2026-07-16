// Diagnóstico: DOWN vs UP nas mensagens — qual traz as MAIS RECENTES?
require('dotenv').config()
const TOKEN = (process.env.MULTI360_TOKEN || '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim()
const BASE = (process.env.MULTI360_BASE_URL || 'https://painel.multi360.com.br/api').replace(/\/$/, '')
const H = { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } }
const proto = 535926256 // Márcia — tem 202 msgs, última é recente (09/07/2026)

async function pega(dir) {
  const url = `/atendimentos/${proto}/mensagens/v2?filtro=0&filtroDataCriacao=0&filtroOriginalId=0&filtroOriginalIdOrigem=0&offset=0&limit=5&paginationDownUpEnum=${dir}`
  const res = await fetch(`${BASE}${url}`, H)
  const j = await res.json().catch(() => [])
  const arr = Array.isArray(j) ? j : j?.registros ?? []
  console.log(`\n== ${dir} == (${arr.length} msgs)`)
  arr.forEach((m) => console.log(`  ${new Date(Number(m.dataCriacao)).toISOString().slice(0, 16)} | ${m.tipo} | ${m.tipoMensagem} | ${String(m.mensagem || '').slice(0, 30)}`))
}

;(async () => { await pega('DOWN'); await pega('UP') })().catch((e) => console.error('erro', e.message))
