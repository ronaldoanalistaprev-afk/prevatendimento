// Dev one-off: mostra a última sincronização registrada e os números atuais.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: log } = await db
    .from('at_extracao_log')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(3);

  const conta = async (filtro) => {
    let q = db.from('at_protocolos').select('id', { count: 'exact', head: true });
    if (filtro) q = filtro(q);
    const { count } = await q;
    return count;
  };

  const abertos = ['ATIVO', 'AGUARDANDO'];
  const hora = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log('ÚLTIMAS EXTRAÇÕES:');
  for (const l of log || []) {
    console.log(' ', hora(l.executado_em), '|', l.camada, '|', l.status, '|', l.detalhe);
  }
  console.log('PROTOCOLOS:', await conta());
  console.log('ABERTOS:', await conta((q) => q.in('status_multi360', abertos)));
  console.log(
    'SEM RESPOSTA (cliente falou por último, abertos):',
    await conta((q) => q.in('status_multi360', abertos).eq('ultima_mensagem_direcao', 'cliente'))
  );
  const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log(
    'SEM RESPOSTA HÁ +24h (a lista da Auditoria):',
    await conta((q) =>
      q.in('status_multi360', abertos).eq('ultima_mensagem_direcao', 'cliente').lt('ultima_mensagem_em', limite24h)
    )
  );
  console.log('MENSAGENS:', (await db.from('at_mensagens').select('id', { count: 'exact', head: true })).count);
  console.log('AGORA:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
})();
