// Verifica a tabela at_cobrancas e os relacionamentos que o app usa.
// Cria uma cobrança de teste, lê com joins e APAGA. Não deixa lixo.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  // 1) tabela existe?
  const { error: e0 } = await db.from('at_cobrancas').select('id').limit(1)
  if (e0) { console.log('❌ at_cobrancas não acessível:', e0.message); process.exit(1) }
  console.log('✅ tabela at_cobrancas existe e é legível.')

  // 2) pega um protocolo real "esperando" p/ simular
  const { data: proto } = await db
    .from('at_protocolos')
    .select('id, empresa_id, cliente_id, responsavel_id, atendente_nome')
    .eq('ultima_mensagem_direcao', 'cliente')
    .limit(1)
    .maybeSingle()
  if (!proto) { console.log('⚠️ nenhum protocolo esperando p/ testar (mas a tabela existe).'); return }

  // 3) cria cobrança (como faz a API)
  const { data: nova, error: e1 } = await db.from('at_cobrancas').insert({
    empresa_id: proto.empresa_id,
    protocolo_id: proto.id,
    cliente_id: proto.cliente_id,
    colaborador_id: proto.responsavel_id,
    colaborador_nome: proto.atendente_nome,
    criado_por_nome: 'TESTE (script)',
    mensagem: 'Teste automático — verificar tabela. Será apagada.',
  }).select('id').single()
  if (e1) { console.log('❌ falha ao inserir cobrança:', e1.message); process.exit(1) }
  console.log('✅ cobrança de teste criada:', nova.id)

  // 4) lê com os mesmos joins que o app (lib/cobrancas.ts)
  const { data: lida, error: e2 } = await db
    .from('at_cobrancas')
    .select('*, at_clientes(nome, telefone), at_protocolos(numero_protocolo, departamento, status_multi360)')
    .eq('id', nova.id)
    .single()
  if (e2) { console.log('❌ falha ao ler com joins:', e2.message) }
  else {
    console.log('✅ leitura com joins OK:')
    console.log('   cliente:', lida.at_clientes?.nome, '| protocolo:', lida.at_protocolos?.numero_protocolo, '| atendente:', lida.colaborador_nome)
  }

  // 5) apaga o teste
  await db.from('at_cobrancas').delete().eq('id', nova.id)
  console.log('🧹 cobrança de teste apagada. Tudo certo.')
}
main().catch((e) => { console.error('ERRO', e.message); process.exit(1) })
