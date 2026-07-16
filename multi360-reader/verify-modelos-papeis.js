// Dev one-off: confere o SQL modelos_papeis_cobrancas.sql aplicado.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('URL:', process.env.SUPABASE_URL);

  // 1) modelos
  const m = await db.from('at_modelos_cobranca').select('*').order('ordem');
  console.log('\nMODELOS:', m.error ? 'ERRO ' + m.error.message : m.data.length);
  for (const x of m.data ?? []) {
    console.log(`  - ${x.titulo} | prazo ${x.prazo_dias ?? '-'}d | ativo ${x.ativo} | usado ${x.vezes_usado}x`);
  }

  // 2) papéis
  const p = await db.from('at_papeis').select('*').order('ordem');
  console.log('\nPAPEIS:', p.error ? 'ERRO ' + p.error.message : p.data.length);
  for (const x of p.data ?? []) {
    console.log(`  - ${x.codigo} (${x.nome}) | fábrica ${x.sistema} | vê tudo ${x.pode_ver_tudo} | cobra ${x.pode_cobrar} | ativo ${x.ativo}`);
  }

  // 3) colunas novas em at_cobrancas: um select nelas falha se não existirem
  const c = await db.from('at_cobrancas').select('id, editado_em, editado_por, editado_por_nome, modelo_id').limit(1);
  console.log('\nCOLUNAS NOVAS em at_cobrancas:', c.error ? 'ERRO ' + c.error.message : 'OK');

  // 4) a trava antiga do papel saiu? tenta gravar um papel inventado num usuário e desfaz.
  const u = await db.from('usuarios').select('id, role').limit(1).maybeSingle();
  if (!u.data) {
    console.log('\nTRAVA DO PAPEL: sem usuário para testar');
  } else {
    const original = u.data.role;
    const t = await db.from('usuarios').update({ role: 'TESTE_PAPEL_NOVO' }).eq('id', u.data.id);
    if (t.error) {
      console.log('\nTRAVA DO PAPEL: AINDA EXISTE ->', t.error.message);
    } else {
      await db.from('usuarios').update({ role: original }).eq('id', u.data.id);
      const volta = await db.from('usuarios').select('role').eq('id', u.data.id).maybeSingle();
      console.log('\nTRAVA DO PAPEL: removida (aceita papel novo). Papel restaurado para:', volta.data.role);
    }
  }
})();
