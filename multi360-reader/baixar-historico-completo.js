/**
 * Traz o histórico COMPLETO das conversas que bateram no teto de 100 mensagens.
 *
 * Porquê: o leitor pedia só as 100 mensagens mais recentes de cada conversa
 * (`limit=100`). Conversas longas ficaram com as mensagens antigas faltando —
 * o que falseia qualquer comparação entre meses.
 *
 * Descoberta da sonda (probe-paginacao.js): o parâmetro `offset` da API do
 * Multi360 é IGNORADO (offset=0, 100 e 200 devolvem a mesma coisa). O que
 * funciona é aumentar o `limit` — com limit=500 a conversa inteira veio.
 *
 * Uso:  node baixar-historico-completo.js            (simulação, não grava)
 *       node baixar-historico-completo.js --aplicar  (grava)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE = (process.env.MULTI360_BASE_URL || 'https://painel.multi360.com.br/api').replace(/\/$/, '');
const TOKEN = (process.env.MULTI360_TOKEN || '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const APLICAR = process.argv.includes('--aplicar');
// A sonda mostrou conversas com quase 6 mil mensagens (números comerciais, tipo
// Embasa/SAC). 20000 é folga suficiente; se alguma devolver exatamente isto, o
// script avisa que pode ter faltado.
const LIMITE = 20000;
const PAGINA = 1000;

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } });
  if (res.status === 401 || res.status === 403) throw new Error('TOKEN_EXPIRADO');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const dataDe = (epochMs) => (epochMs ? new Date(Number(epochMs)).toISOString() : null);

/** Mesma classificação do leitor (index.js): o robô é 'bot', não 'colaborador'. */
function classificar(msg) {
  const tipo = msg.tipo === 'USUARIO' ? 'cliente' : (msg.nome === 'Bot' ? 'bot' : 'colaborador');
  const ehMidia = ['AUDIO', 'IMAGEM', 'ARQUIVO', 'VIDEO'].includes(msg.tipoMensagem);
  return { tipo, texto: msg.tipoMensagem === 'TEXTO' ? msg.mensagem : null, ehMidia };
}

/** Conversas com 100+ mensagens no nosso banco = as que foram cortadas. */
async function conversasNoTeto() {
  const conta = new Map();
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await db.from('at_mensagens').select('protocolo_id').order('id').range(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    if (!data.length) break;
    for (const m of data) conta.set(m.protocolo_id, (conta.get(m.protocolo_id) ?? 0) + 1);
  }
  return [...conta.entries()].filter(([, n]) => n >= 100).map(([id, n]) => ({ id, n }));
}

(async () => {
  console.log(APLICAR ? '>>> MODO GRAVAR' : '>>> MODO SIMULAÇÃO (não grava)');
  console.log('procurando conversas cortadas...');
  const alvos = await conversasNoTeto();
  console.log('conversas com 100+ mensagens:', alvos.length);

  const { data: empresa } = await db.from('empresas').select('id').limit(1).maybeSingle();
  const empresaId = empresa?.id ?? null;

  let totalNovas = 0;
  let comProblema = 0;
  let feitas = 0;

  for (const alvo of alvos) {
    const { data: p } = await db.from('at_protocolos').select('numero_protocolo').eq('id', alvo.id).maybeSingle();
    if (!p) continue;

    let msgs;
    try {
      const json = await api(
        `/atendimentos/${p.numero_protocolo}/mensagens/v2?filtro=0&filtroDataCriacao=0&filtroOriginalId=0&filtroOriginalIdOrigem=0&offset=0&limit=${LIMITE}&paginationDownUpEnum=UP`
      );
      msgs = Array.isArray(json) ? json : json?.registros ?? [];
    } catch (e) {
      console.log(`  ERRO em ${p.numero_protocolo}: ${e.message}`);
      comProblema++;
      if (e.message === 'TOKEN_EXPIRADO') break;
      continue;
    }

    if (msgs.length >= LIMITE) {
      console.log(`  ATENÇÃO: ${p.numero_protocolo} devolveu ${msgs.length} (bateu no limite ${LIMITE}) — pode faltar coisa.`);
      comProblema++;
    }

    const { data: existentes } = await db.from('at_mensagens').select('id_multi360').eq('protocolo_id', alvo.id);
    const jaTem = new Set((existentes ?? []).map((m) => m.id_multi360));

    const novas = [];
    for (const m of msgs) {
      if (m.tipoMensagem === 'REACTION') continue;
      const raw = typeof m.mensagem === 'string' ? m.mensagem : '';
      if (/^\{"message":"[A-Z_]+"/.test(raw)) continue; // evento interno do Multi360
      const idm = String(m.id);
      if (jaTem.has(idm)) continue;
      const { tipo, texto, ehMidia } = classificar(m);
      novas.push({
        empresa_id: empresaId,
        protocolo_id: alvo.id,
        id_multi360: idm,
        remetente_tipo: tipo,
        remetente_nome: m.nome || null,
        texto,
        tem_anexo: ehMidia,
        enviado_em: dataDe(m.dataCriacao),
        ordem: Number(m.id),
      });
    }

    feitas++;
    if (novas.length) {
      totalNovas += novas.length;
      console.log(`  ${p.numero_protocolo}: tínhamos ${alvo.n}, o Multi360 tem ${msgs.length} -> +${novas.length} antigas`);
      if (APLICAR) {
        for (let i = 0; i < novas.length; i += 100) {
          const { error } = await db.from('at_mensagens').insert(novas.slice(i, i + 100));
          if (error) console.log('   ERRO ao gravar:', error.message);
        }
      }
    }
    if (feitas % 50 === 0) console.log(`  ... ${feitas}/${alvos.length} conversas conferidas`);
  }

  console.log('\n--- RESULTADO ---');
  console.log('conversas conferidas:', feitas);
  console.log('mensagens antigas que faltavam:', totalNovas);
  if (comProblema) console.log('conversas com problema/limite:', comProblema);
  if (!APLICAR) console.log('\n(simulação — rode com --aplicar para gravar)');
  else console.log('\nGravado. Rode o leitor para recalcular as métricas (ou espere a próxima rodada de 15 min).');
})();
