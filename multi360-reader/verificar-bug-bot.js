// Confere o achado do agente: última mensagem do BOT sendo contada como "equipe respondeu".
process.chdir('D:/Projetos/SIAP/PrevAtendimento/multi360-reader');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ABERTOS = ['ATIVO', 'AGUARDANDO'];

(async () => {
  // 1) Existe mensagem de bot?
  for (const tipo of ['cliente', 'colaborador', 'bot']) {
    const { count } = await db.from('at_mensagens').select('id', { count: 'exact', head: true }).eq('remetente_tipo', tipo);
    console.log(`mensagens ${tipo}:`, count);
  }

  // 2) at_protocolos.ultima_mensagem_direcao tem 'bot'?
  for (const d of ['cliente', 'colaborador', 'bot']) {
    const { count } = await db.from('at_protocolos').select('id', { count: 'exact', head: true }).eq('ultima_mensagem_direcao', d);
    console.log(`protocolos com direcao=${d}:`, count);
  }

  // 3) Nos protocolos ABERTOS marcados como "equipe respondeu", qual é MESMO a última mensagem?
  const { data: protos } = await db
    .from('at_protocolos')
    .select('id, numero_protocolo, ultima_mensagem_em')
    .in('status_multi360', ABERTOS)
    .eq('ultima_mensagem_direcao', 'colaborador')
    .limit(1000);

  console.log('\nconferindo', protos.length, 'protocolos abertos marcados como "equipe respondeu"...');
  let bot = 0;
  const achados = [];
  for (const p of protos) {
    const { data: ult } = await db
      .from('at_mensagens')
      .select('remetente_tipo, remetente_nome, enviado_em')
      .eq('protocolo_id', p.id)
      .order('enviado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ult && ult.remetente_tipo === 'bot') {
      bot++;
      if (achados.length < 5) achados.push({ protocolo: p.numero_protocolo, quem: ult.remetente_nome, quando: ult.enviado_em });
    }
  }
  console.log('>>> marcados como respondidos, mas a ÚLTIMA mensagem foi do BOT:', bot);
  console.log('exemplos:', JSON.stringify(achados, null, 1));
})();
