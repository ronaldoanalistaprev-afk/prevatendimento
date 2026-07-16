// Preenche at_clientes.nome_normalizado para TODOS os clientes (busca tolerante).
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

function normalizarFonetico(texto) {
  let t = String(texto || '').toLowerCase().replace(/ç/g, 's').normalize('NFD').replace(/[̀-ͯ]/g, '')
  t = t.replace(/[^a-z0-9\s]/g, ' ')
  t = t.replace(/ph/g, 'f').replace(/ch/g, 'x').replace(/ss/g, 's')
  t = t.replace(/ce/g, 'se').replace(/ci/g, 'si').replace(/ge/g, 'je').replace(/gi/g, 'ji')
  t = t.replace(/z/g, 's').replace(/y/g, 'i').replace(/w/g, 'u')
  return t.replace(/\s+/g, ' ').trim()
}

async function main() {
  const todos = []
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await db.from('at_clientes').select('id, nome').range(from, from + 999)
    if (error) { console.log('ERRO ao ler:', error.message); return }
    todos.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  console.log('clientes a normalizar:', todos.length)
  let n = 0
  for (const c of todos) {
    await db.from('at_clientes').update({ nome_normalizado: normalizarFonetico(c.nome) }).eq('id', c.id)
    if (++n % 300 === 0) console.log('  ', n, '/', todos.length)
  }
  console.log('✅ concluído:', n, 'nomes normalizados.')
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
