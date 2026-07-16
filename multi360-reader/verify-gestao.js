// Sanidade das métricas do painel do Gestor (mesma lógica de lib/gestao.ts).
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const ABERTAS = new Set(['ATIVO', 'AGUARDANDO'])
const corte24 = Date.now() - 24 * 3600000

async function main() {
  const protos = []
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await db.from('at_protocolos').select('atendente_nome, status_multi360, ultima_mensagem_direcao, ultima_mensagem_em').range(from, from + 999)
    protos.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const mapa = new Map()
  const pega = (n) => { const k = (n || '').trim() || 'sem atendente'; if (!mapa.has(k)) mapa.set(k, { atendente: k, abertas: 0, esperando: 0, esperando24: 0, finalizadas: 0 }); return mapa.get(k) }
  const resumo = { conversasAbertas: 0, esperando: 0, esperando24: 0, finalizadas: 0 }
  for (const p of protos) {
    const l = pega(p.atendente_nome)
    if (p.status_multi360 === 'FINALIZADO') { l.finalizadas++; resumo.finalizadas++ }
    else if (ABERTAS.has(p.status_multi360)) {
      l.abertas++; resumo.conversasAbertas++
      if (p.ultima_mensagem_direcao === 'cliente') {
        l.esperando++; resumo.esperando++
        const t = p.ultima_mensagem_em ? new Date(p.ultima_mensagem_em).getTime() : Date.now()
        if (t < corte24) { l.esperando24++; resumo.esperando24++ }
      }
    }
  }
  console.log('total protocolos lidos:', protos.length)
  console.log('RESUMO:', resumo)
  const rank = [...mapa.values()].filter((l) => l.abertas > 0).sort((a, b) => b.esperando24 - a.esperando24 || b.esperando - a.esperando).slice(0, 8)
  console.log('\nTOP atendentes (esperando24 / esperando / abertas):')
  for (const r of rank) console.log(`  ${r.atendente.padEnd(22)} 24h=${r.esperando24}  esp=${r.esperando}  abertas=${r.abertas}`)
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
