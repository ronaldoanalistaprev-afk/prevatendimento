/**
 * Recalcula at_protocolos.ultima_mensagem_direcao / ultima_mensagem_em
 * IGNORANDO as mensagens do robô (bot).
 *
 * Porquê: o leitor antigo tratava o robô como "colaborador". Quando o robô dava
 * a última resposta, a conversa aparecia como respondida — e o cliente, que
 * continuava esperando gente, sumia das telas de "sem resposta".
 *
 * O conserto no leitor só vale para mensagens novas; este script arruma o que
 * já está gravado. Pode rodar de novo sem problema (só grava o que mudou).
 *
 * Uso:  node corrigir-direcao-bot.js           (mostra o que mudaria, NÃO grava)
 *       node corrigir-direcao-bot.js --aplicar (grava)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APLICAR = process.argv.includes('--aplicar');
const PAGINA = 1000; // teto do PostgREST

/** Baixa todas as mensagens humanas (cliente/colaborador), paginado. */
async function carregarMensagensHumanas() {
  const porProtocolo = new Map(); // protocolo_id -> { direcao, em }
  let de = 0;
  for (;;) {
    const { data, error } = await db
      .from('at_mensagens')
      .select('protocolo_id, remetente_tipo, enviado_em')
      .neq('remetente_tipo', 'bot')
      .order('id', { ascending: true })
      .range(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    if (!data.length) break;

    for (const m of data) {
      if (!m.protocolo_id || !m.enviado_em) continue;
      const atual = porProtocolo.get(m.protocolo_id);
      if (!atual || m.enviado_em > atual.em) {
        porProtocolo.set(m.protocolo_id, { direcao: m.remetente_tipo, em: m.enviado_em });
      }
    }
    de += PAGINA;
    if (de % 20000 === 0) console.log('  ...', de, 'mensagens lidas');
  }
  return porProtocolo;
}

(async () => {
  console.log(APLICAR ? '>>> MODO GRAVAR' : '>>> MODO SIMULAÇÃO (nada será gravado)');
  console.log('lendo mensagens humanas (ignorando o robô)...');
  const certo = await carregarMensagensHumanas();
  console.log('protocolos com mensagem humana:', certo.size);

  console.log('lendo protocolos...');
  const protos = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await db
      .from('at_protocolos')
      .select('id, numero_protocolo, status_multi360, ultima_mensagem_direcao, ultima_mensagem_em')
      .order('id', { ascending: true })
      .range(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    if (!data.length) break;
    protos.push(...data);
  }
  console.log('protocolos:', protos.length);

  const ABERTOS = ['ATIVO', 'AGUARDANDO'];
  const mudancas = [];
  let soBot = 0;

  for (const p of protos) {
    const c = certo.get(p.id);
    if (!c) {
      // nenhuma mensagem humana: ou não tem mensagem, ou só o robô falou
      if (p.ultima_mensagem_direcao) soBot++;
      continue;
    }
    const mesmaDirecao = p.ultima_mensagem_direcao === c.direcao;
    const mesmaData = p.ultima_mensagem_em && new Date(p.ultima_mensagem_em).getTime() === new Date(c.em).getTime();
    if (mesmaDirecao && mesmaData) continue;
    mudancas.push({ p, c, aberto: ABERTOS.includes(p.status_multi360) });
  }

  const abertosVirandoCliente = mudancas.filter((m) => m.aberto && m.c.direcao === 'cliente' && m.p.ultima_mensagem_direcao !== 'cliente');
  console.log('\n--- RESULTADO ---');
  console.log('protocolos a corrigir:', mudancas.length);
  console.log('  destes, ABERTOS que passam a contar como CLIENTE ESPERANDO:', abertosVirandoCliente.length);
  console.log('  protocolos onde só o robô falou (ficam sem direção humana):', soBot);
  for (const m of abertosVirandoCliente.slice(0, 5)) {
    console.log(`   ex.: protocolo ${m.p.numero_protocolo} | era ${m.p.ultima_mensagem_direcao} ${m.p.ultima_mensagem_em} -> cliente ${m.c.em}`);
  }

  if (!APLICAR) {
    console.log('\n(simulação — rode com --aplicar para gravar)');
    return;
  }

  let ok = 0;
  for (const m of mudancas) {
    const { error } = await db
      .from('at_protocolos')
      .update({ ultima_mensagem_direcao: m.c.direcao, ultima_mensagem_em: m.c.em })
      .eq('id', m.p.id);
    if (error) console.log('  ERRO no', m.p.numero_protocolo, error.message);
    else ok++;
  }
  console.log('\ngravados:', ok, 'de', mudancas.length);

  const { count: semResposta } = await db
    .from('at_protocolos')
    .select('id', { count: 'exact', head: true })
    .in('status_multi360', ABERTOS)
    .eq('ultima_mensagem_direcao', 'cliente');
  console.log('AGORA — abertos com o cliente falando por último (sem resposta):', semResposta);
})();
