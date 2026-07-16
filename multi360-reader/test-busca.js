require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
function nf(t) {
  let s = String(t || '').toLowerCase().replace(/ç/g, 's').normalize('NFD').replace(/[̀-ͯ]/g, '')
  s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/ph/g, 'f').replace(/ch/g, 'x').replace(/ss/g, 's')
  s = s.replace(/ce/g, 'se').replace(/ci/g, 'si').replace(/ge/g, 'je').replace(/gi/g, 'ji')
  s = s.replace(/z/g, 's').replace(/y/g, 'i').replace(/w/g, 'u')
  return s.replace(/\s+/g, ' ').trim()
}
;(async () => {
  for (const q of ['conceisao', 'conceicao', 'jose', 'marssia', 'luisa']) {
    const { data } = await db.from('v_at_monitor').select('cliente_nome').ilike('cliente_nome_normalizado', '%' + nf(q) + '%').limit(2)
    console.log('busca "' + q + '" (fon:' + nf(q) + ') ->', (data || []).map((x) => x.cliente_nome).join(' | ') || '(nada)')
  }
})().catch((e) => console.log('erro', e.message))
