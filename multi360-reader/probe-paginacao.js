// Sonda: a API do Multi360 pagina além das 100 mensagens? (offset funciona?)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE = (process.env.MULTI360_BASE_URL || 'https://painel.multi360.com.br/api').replace(/\/$/, '');
const TOKEN = (process.env.MULTI360_TOKEN || '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const msgsDe = (json) => (Array.isArray(json) ? json : json?.registros ?? []);
const resumo = (ms) => ({
  qtd: ms.length,
  primeiroId: ms[0]?.id,
  ultimoId: ms[ms.length - 1]?.id,
  maisAntiga: ms.length ? new Date(Math.min(...ms.map((m) => Number(m.dataCriacao)))).toISOString().slice(0, 10) : null,
  maisNova: ms.length ? new Date(Math.max(...ms.map((m) => Number(m.dataCriacao)))).toISOString().slice(0, 10) : null,
});

(async () => {
  // uma conversa que bateu no teto de 100
  const { data } = await db.from('at_mensagens').select('protocolo_id').limit(20000);
  const conta = new Map();
  for (const m of data) conta.set(m.protocolo_id, (conta.get(m.protocolo_id) ?? 0) + 1);
  const alvo = [...conta.entries()].find(([, n]) => n >= 100);
  if (!alvo) return console.log('nenhuma conversa com 100+ nesta amostra');

  const { data: p } = await db.from('at_protocolos').select('numero_protocolo').eq('id', alvo[0]).maybeSingle();
  const numero = p.numero_protocolo;
  console.log('conversa de teste:', numero, '| mensagens no nosso banco:', alvo[1]);

  const url = (offset, limit, dir) =>
    `/atendimentos/${numero}/mensagens/v2?filtro=0&filtroDataCriacao=0&filtroOriginalId=0&filtroOriginalIdOrigem=0&offset=${offset}&limit=${limit}&paginationDownUpEnum=${dir}`;

  for (const dir of ['UP', 'DOWN']) {
    console.log(`\n--- ${dir} ---`);
    for (const offset of [0, 100, 200]) {
      try {
        const ms = msgsDe(await api(url(offset, 100, dir)));
        console.log(`offset=${offset}:`, JSON.stringify(resumo(ms)));
      } catch (e) {
        console.log(`offset=${offset}: ERRO ${e.message}`);
      }
    }
  }

  // limite maior funciona?
  console.log('\n--- limit=500, UP, offset=0 ---');
  try {
    const ms = msgsDe(await api(url(0, 500, 'UP')));
    console.log(JSON.stringify(resumo(ms)));
  } catch (e) {
    console.log('ERRO', e.message);
  }
})();
