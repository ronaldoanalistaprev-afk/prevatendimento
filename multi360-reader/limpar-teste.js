// Remove os dados de TESTE (1ª versão, Baileys) das tabelas antigas.
// Não toca em nada do Multi360 (tabelas at_*). Esvazia respeitando as FKs.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ordem: filhos -> pais
const ORDEM = ['eventos', 'missoes', 'objetivos', 'mensagens', 'conversas', 'identificadores', 'pessoas', 'contactos']

async function conta(t) {
  const { count } = await db.from(t).select('id', { count: 'exact', head: true })
  return count ?? 0
}

async function main() {
  console.log('ANTES:')
  for (const t of ORDEM) console.log('  ', t.padEnd(16), await conta(t))

  console.log('\nremovendo...')
  for (const t of ORDEM) {
    const { error } = await db.from(t).delete().not('id', 'is', null)
    console.log('  ', t.padEnd(16), error ? 'ERRO: ' + error.message : 'ok')
  }

  console.log('\nDEPOIS:')
  for (const t of ORDEM) console.log('  ', t.padEnd(16), await conta(t))

  // confere que o Multi360 continua intacto
  const cli = await conta('at_clientes')
  console.log('\nMulti360 intacto? at_clientes =', cli, '(esperado 2792)')
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
