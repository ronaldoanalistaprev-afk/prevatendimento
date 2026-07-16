// Compara o que a página Colaboradores mostra (v_at_placar) com os números
// CORRETOS (abertas x finalizadas separadas). Só leitura.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const ABERTAS = new Set(['ATIVO', 'AGUARDANDO'])
const corte24 = Date.now() - 24 * 3600000

async function main() {
  // números corretos, calculados dos protocolos
  const protos = []
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await db.from('at_protocolos').select('atendente_nome, status_multi360, ultima_mensagem_direcao, ultima_mensagem_em').range(from, from + 999)
    protos.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const m = new Map()
  const g = (n) => { const k = (n || '').trim() || 'sem atendente'; if (!m.has(k)) m.set(k, { atendente: k, total: 0, abertas: 0, esperando: 0, esperando24: 0, finalizadas: 0 }); return m.get(k) }
  for (const p of protos) {
    const l = g(p.atendente_nome); l.total++
    if (p.status_multi360 === 'FINALIZADO') l.finalizadas++
    else if (ABERTAS.has(p.status_multi360)) {
      l.abertas++
      if (p.ultima_mensagem_direcao === 'cliente') {
        l.esperando++
        const t = p.ultima_mensagem_em ? new Date(p.ultima_mensagem_em).getTime() : Date.now()
        if (t < corte24) l.esperando24++
      }
    }
  }
  // o que a view mostra
  const { data: placar } = await db.from('v_at_placar').select('*')
  const pv = new Map((placar ?? []).map((x) => [x.colaborador, x]))

  const linhas = [...m.values()].sort((a, b) => b.total - a.total)
  console.log('ATENDENTE            | VIEW(total/esp24/taxa) | CORRETO(total/abertas/esp24/final)')
  console.log('-'.repeat(92))
  for (const l of linhas.slice(0, 12)) {
    const v = pv.get(l.atendente) || {}
    const view = `${v.total_conversas ?? '-'}/${v.esperando_mais_24h ?? '-'}/${v.taxa != null ? Math.round(v.taxa) + '%' : '-'}`
    const cor = `${l.total}/${l.abertas}/${l.esperando24}/${l.finalizadas}`
    console.log(`${l.atendente.padEnd(20)} | ${view.padEnd(22)} | ${cor}`)
  }
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
