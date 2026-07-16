// Conta quantas finalizadas existem (paginando só metadados — rápido). Só GET.
require('dotenv').config()

const BASE = (process.env.MULTI360_BASE_URL || 'https://painel.multi360.com.br/api').replace(/\/$/, '')
const TOKEN = (process.env.MULTI360_TOKEN || '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim()
const DOMAIN = process.env.MULTI360_DOMAIN || ''
const H = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
if (DOMAIN) H['Domain'] = DOMAIN

function url(status, offset) {
  const p = new URLSearchParams({
    atendenteId: '-1', botId: '0', camposSegmentacao: '[]', cliente: '-1',
    departamentoId: '-1', localizacao: '', mes: '-1', motivoId: '-1',
    offset: String(offset), orderByFieldName: 'CREATE_DATE',
    orderByFieldOrdenation: 'DESC', origem: 'TODOS', status,
  })
  return `${BASE}/relatorios/atendimentos?${p.toString()}`
}

async function contar(status) {
  let offset = 0
  let total = 0
  let paginas = 0
  let maisAntiga = null
  let maisNova = null
  for (let i = 0; i < 1000; i++) {
    const res = await fetch(url(status, offset), { headers: H })
    if (!res.ok) { console.log(`HTTP ${res.status} em offset ${offset}`); break }
    const arr = await res.json()
    if (!Array.isArray(arr) || arr.length === 0) break
    total += arr.length
    paginas++
    for (const r of arr) {
      if (!maisNova) maisNova = r.data
      maisAntiga = r.data
    }
    if (arr.length < 20) break
    offset += arr.length
    if (i % 20 === 19) process.stdout.write(`  ...${total} até agora\n`)
  }
  console.log(`[${status}] total=${total} (${paginas} páginas). Mais nova: ${maisNova} | Mais antiga: ${maisAntiga}`)
  return total
}

async function main() {
  console.time('contagem')
  await contar('Finalizado')
  console.timeEnd('contagem')
}
main().catch((e) => console.error('ERRO', e.message))
