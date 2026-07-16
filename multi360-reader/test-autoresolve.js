// Testa a auto-resolução de cobranças. Cria uma cobrança num protocolo já
// respondido, roda o resolvedor e confere. Apaga o teste no fim.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { execSync } = require('child_process')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { data: p } = await db
    .from('at_protocolos')
    .select('id, cliente_id, responsavel_id, atendente_nome, empresa_id, ultima_mensagem_em, ultima_mensagem_direcao')
    .eq('ultima_mensagem_direcao', 'colaborador')
    .not('ultima_mensagem_em', 'is', null)
    .limit(1)
    .maybeSingle()
  if (!p) { console.log('⚠️ nenhum protocolo respondido p/ testar'); return }

  // cobrança criada ANTES da última resposta do atendente → deve auto-resolver
  const criadoEm = new Date(new Date(p.ultima_mensagem_em).getTime() - 3600000).toISOString()
  const { data: nova, error } = await db.from('at_cobrancas').insert({
    empresa_id: p.empresa_id, protocolo_id: p.id, cliente_id: p.cliente_id,
    colaborador_id: p.responsavel_id, colaborador_nome: p.atendente_nome,
    criado_por_nome: 'TESTE', mensagem: 'teste auto-resolve (será apagada)', criado_em: criadoEm,
  }).select('id').single()
  if (error) { console.log('❌ insert falhou:', error.message); return }
  console.log('cobrança de teste criada ABERTA:', nova.id)
  console.log('  criada em', criadoEm, '| atendente respondeu em', p.ultima_mensagem_em)

  console.log('--- rodando --resolver-cobrancas ---')
  console.log(execSync('node index.js --resolver-cobrancas', { encoding: 'utf8' }).trim())

  const { data: depois } = await db.from('at_cobrancas').select('status, nota_resolucao').eq('id', nova.id).single()
  console.log('--- resultado ---')
  console.log('status:', depois.status, '| nota:', depois.nota_resolucao)
  console.log(depois.status === 'RESOLVIDA' ? '✅ AUTO-RESOLUÇÃO FUNCIONOU' : '❌ não resolveu')

  await db.from('at_cobrancas').delete().eq('id', nova.id)
  console.log('🧹 cobrança de teste apagada.')
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
