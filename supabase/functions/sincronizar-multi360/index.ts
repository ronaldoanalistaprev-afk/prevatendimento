// ============================================================================
// PrevAtendimento — Edge Function "sincronizar-multi360" (Deno)
//
// O QUE FAZ: UMA volta de sincronização com o Multi360 — exatamente o que o
// `sync()` do leitor local (multi360-reader/index.js) faz a cada 15 min no modo
// normal. Lê as filas de abertas (ativos/pendentes/potenciais) e as mensagens
// novas, grava nas tabelas at_* do Supabase, resolve cobranças já respondidas,
// preenche participantes, reconcilia finalizadas, pega as finalizadas recentes
// (fecha o furo da janela), recalcula métricas e registra em at_extracao_log.
// NÃO faz os modos dedicados do script local: --finalizados (backfill histórico),
// --resolver-cobrancas isolado nem o backfill pesado de mensagens. Esses seguem
// só como scripts locais.
//
// DE ONDE VEM O TOKEN: NÃO de variável de ambiente. A função lê a linha única da
// tabela public.at_integracao_multi360 (escritório 'aposentar') com a CHAVE DE
// SERVIÇO (passa por cima da RLS) e usa dela: token, base_url, dominio,
// empresa_slug. O empresaId é resolvido a partir do empresa_slug na tabela
// `empresas` (igual ao resolverEmpresa() de hoje). Ao terminar, grava o estado
// de volta nessa mesma linha (ultima_sync / token_status / ultimo_erro).
//
// TRAVA (x-cron-secret): o segredo do agendador NÃO vem de variável de ambiente
// (não há como defini-la por aqui). Ele é a coluna cron_secret da MESMA linha de
// at_integracao_multi360, lida com a chave de serviço; o pg_cron, que roda dentro
// do banco, lê o mesmo segredo e o manda no cabeçalho. A view v_at_integracao_status
// não expõe nem o token nem o cron_secret.
//
// COMO RESPONDE: o ciclo pode passar de 150s (limite da RESPOSTA de uma Edge
// Function). Então a função responde já (202) e roda o ciclo em SEGUNDO PLANO via
// EdgeRuntime.waitUntil, até o limite de parede do plano Pro (400s).
//
// VARIÁVEIS de ambiente usadas (as duas injetadas automaticamente pelo Supabase):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// EdgeRuntime é global no runtime do Supabase (Deno). Declaração só para o editor/tsc.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void }

// Diagnóstico: avisa no log se a função for encerrada (ex.: bateu os 400s de parede).
addEventListener('beforeunload', (ev: any) => {
  console.log('função sendo encerrada:', ev?.detail?.reason ?? '(sem motivo)')
})
addEventListener('unhandledrejection', (ev: any) => {
  console.error('promessa sem tratamento:', ev?.reason)
  ev?.preventDefault?.()
})

// ── Estado da requisição (preenchido no início de cada chamada) ──────────────
// Mantidos no escopo do módulo, como no script original (que usava variáveis de
// processo). O agendador dispara uma volta por vez, então não há concorrência.
let db: any = null
let empresaId: string | null = null
let BASE = ''
let TOKEN = ''
let DOMAIN = ''

// Caches (iguais aos do script; limpos no início de cada volta para que cada
// invocação se comporte como a 1ª rodada de um processo recém-iniciado).
const colaboradorCache = new Map<string, string | null>()
const tagCache = new Map<string, string | null>()
const clienteFinCache = new Map<string, string | null>()

// ── Chamada à API do Multi360 ───────────────────────────────────────────────
async function api(path: string): Promise<any> {
  const headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
  if (DOMAIN) headers['Domain'] = DOMAIN
  const res = await fetch(`${BASE}${path}`, { headers })
  if (res.status === 401 || res.status === 403) {
    throw new Error('TOKEN_EXPIRADO')
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} em ${path}`)
  }
  return res.json()
}

const soDigitos = (v: any) => String(v || '').replace(/\D/g, '')
const dataDe = (epochMs: any) => (epochMs ? new Date(Number(epochMs)).toISOString() : null)

// Nome canonizado p/ busca tolerante (Doc. Mestre SIAP — Regra 6): tira acentos e
// colapsa erros comuns (S↔SS↔Z, C↔CH↔X, G↔J, I↔Y, U↔W). Igual ao web/src/lib/utils.ts.
// (A classe de combinantes do original — U+0300–U+036F — foi escrita aqui como
// ̀-ͯ; é o mesmo intervalo, só mais legível no arquivo.)
function normalizarFonetico(texto: any): string {
  let t = String(texto || '').toLowerCase().replace(/ç/g, 's').normalize('NFD').replace(/[̀-ͯ]/g, '')
  t = t.replace(/[^a-z0-9\s]/g, ' ')
  t = t.replace(/ph/g, 'f').replace(/ch/g, 'x').replace(/ss/g, 's')
  t = t.replace(/ce/g, 'se').replace(/ci/g, 'si').replace(/ge/g, 'je').replace(/gi/g, 'ji')
  t = t.replace(/z/g, 's').replace(/y/g, 'i').replace(/w/g, 'u')
  return t.replace(/\s+/g, ' ').trim()
}

// "03/07/2026 09:39" (horário de Brasília) -> epoch ms
function parseDataBR(s: any): number | null {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (!m) return null
  const [, dd, mm, yyyy, HH, MM] = m
  const t = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00-03:00`).getTime()
  return Number.isFinite(t) ? t : null
}

// Detalhe do atendimento (traz o CONTATO — telefone/nome — mesmo p/ pendentes,
// que não trazem contatoTelefone na lista). Endpoint "/atendente" devolve o usuario.
async function detalheContato(id: any): Promise<any> {
  try {
    const j = await api(`/atendimentos/${id}/atendente`)
    const u = j?.usuario || {}
    return {
      telefone: u.usuarioTelefone || null,
      nome: (u.usuarioNome || '').trim() || null,
      atendenteNome: u.atendenteNome || null,
      status: u.status || null,
      // Participantes da conversa (só exibição): OWNER = o principal; os demais foram
      // adicionados. Guardamos [{nome, principal}].
      participantes: mapearParticipantes(j?.participantes),
    }
  } catch {
    return null
  }
}

// Lista de participantes do Multi360 -> [{nome, principal}] (principal = tipo OWNER).
function mapearParticipantes(arr: any): any[] {
  if (!Array.isArray(arr)) return []
  return arr
    .map((p: any) => ({ nome: (p?.nome || '').trim(), principal: p?.tipo === 'OWNER' }))
    .filter((p: any) => p.nome)
}

// Grava os participantes de um protocolo (só exibição; não muda SLA nem cobrança).
async function gravarParticipantes(protoId: any, participantes: any): Promise<void> {
  if (!protoId) return
  try {
    await db.from('at_protocolos').update({ participantes: participantes ?? [] }).eq('id', protoId)
  } catch { /* não interrompe a sincronização por causa disto */ }
}

// Preenchimento leve: conversas abertas que ainda não tiveram os participantes
// buscados (coluna NULL). Poucas por rodada, para não dar rajada na API do Multi360.
async function backfillParticipantes(limite = 80): Promise<number> {
  try {
    const { data } = await db
      .from('at_protocolos')
      .select('id, numero_protocolo')
      .eq('empresa_id', empresaId)
      .in('status_multi360', ['ATIVO', 'AGUARDANDO', 'POTENCIAL'])
      .is('participantes', null)
      .limit(limite)
    if (!data || data.length === 0) return 0
    let capturadas = 0
    for (const p of data) {
      const d = await detalheContato(p.numero_protocolo)
      // Só grava quando a leitura deu certo. Se o detalhe falhou (d === null), NÃO
      // grava []: deixa a coluna NULL para o backfill tentar de novo na próxima rodada
      // (senão um blip de rede marcaria a conversa como "sem participantes" para sempre).
      if (d) { await gravarParticipantes(p.id, d.participantes); capturadas++ }
    }
    return capturadas
  } catch {
    return 0
  }
}

// ── Upserts ─────────────────────────────────────────────────────────────────
async function upsertCliente(reg: any): Promise<string | null> {
  const telefone = soDigitos(reg.contatoTelefone)
  if (!telefone) return null
  const agora = new Date().toISOString()
  const { data } = await db
    .from('at_clientes')
    .upsert(
      { empresa_id: empresaId, telefone, nome: reg.nome || telefone, nome_normalizado: normalizarFonetico(reg.nome || telefone), ultimo_contato_em: dataDe(reg.dataUltimaMensagem), atualizado_em: agora },
      { onConflict: 'telefone' }
    )
    .select('id')
    .single()
  return data?.id ?? null
}

async function upsertColaborador(nome: any): Promise<string | null> {
  const n = (nome || '').trim()
  if (!n || n.toLowerCase() === 'bot') return null
  if (colaboradorCache.has(n)) return colaboradorCache.get(n) as string | null
  const { data } = await db
    .from('at_colaboradores')
    .upsert({ empresa_id: empresaId, nome: n }, { onConflict: 'empresa_id,nome' })
    .select('id')
    .single()
  const id = data?.id ?? null
  colaboradorCache.set(n, id)
  return id
}

async function upsertTag(nome: any): Promise<string | null> {
  const n = (nome || '').trim()
  if (!n) return null
  if (tagCache.has(n)) return tagCache.get(n) as string | null
  const { data } = await db
    .from('at_tags')
    .upsert({ empresa_id: empresaId, nome: n }, { onConflict: 'empresa_id,nome' })
    .select('id')
    .single()
  const id = data?.id ?? null
  tagCache.set(n, id)
  return id
}

async function upsertProtocolo(reg: any, clienteId: any, responsavelId: any): Promise<any> {
  const numero = String(reg.id)
  const { data } = await db
    .from('at_protocolos')
    .upsert(
      {
        empresa_id: empresaId,
        numero_protocolo: numero,
        cliente_id: clienteId,
        responsavel_id: responsavelId,
        atendente_nome: reg.atendenteNome || null,
        departamento: reg.departamentoNome || null,
        canal: soDigitos(reg.canal) || null,
        status_multi360: reg.status || null,
        possui_anexo: Boolean(reg.possuiAnexo),
        criado_em_multi360: dataDe(reg.dataCriacao),
        ultima_mensagem_em: dataDe(reg.dataUltimaMensagem || reg.dataCriacao),
        ...(reg._origem !== undefined ? { origem: reg._origem } : {}),
        ...(reg._finalizadoEm !== undefined ? { finalizado_em: dataDe(reg._finalizadoEm) } : {}),
        importado_em: new Date().toISOString(),
      },
      { onConflict: 'numero_protocolo' }
    )
    .select('id, ultima_mensagem_em')
    .single()
  // tags
  if (data?.id && Array.isArray(reg.tags)) {
    for (const t of reg.tags) {
      const tagId = await upsertTag(t?.text)
      if (tagId) {
        await db.from('at_protocolo_tags').upsert({ protocolo_id: data.id, tag_id: tagId }, { onConflict: 'protocolo_id,tag_id', ignoreDuplicates: true })
      }
    }
  }
  return data ?? null
}

function classificarMensagem(msg: any): { tipo: string; texto: any; ehMidia: boolean } {
  const tipo = msg.tipo === 'USUARIO' ? 'cliente' : (msg.nome === 'Bot' ? 'bot' : 'colaborador')
  const ehMidia = ['AUDIO', 'IMAGEM', 'ARQUIVO', 'VIDEO'].includes(msg.tipoMensagem)
  return {
    tipo,
    texto: msg.tipoMensagem === 'TEXTO' ? msg.mensagem : null,
    ehMidia,
  }
}

async function syncMensagens(protocoloId: any, numero: any): Promise<void> {
  let json: any
  try {
    // UP = mais recentes primeiro (é o que interessa: última mensagem, direção e prévia).
    // limit=2000 (era 100): com 100, conversas longas ficavam com as mensagens
    // ANTIGAS faltando e qualquer comparação entre meses saía torta. O `offset`
    // desta API é ignorado (sonda em probe-paginacao.js), então aumentar o limite
    // é o único jeito de trazer tudo. As mensagens repetidas são descartadas logo
    // abaixo pelo id_multi360, então o custo extra é só de rede.
    json = await api(`/atendimentos/${numero}/mensagens/v2?filtro=0&filtroDataCriacao=0&filtroOriginalId=0&filtroOriginalIdOrigem=0&offset=0&limit=2000&paginationDownUpEnum=UP`)
  } catch (e: any) {
    await db.from('at_extracao_log').insert({ empresa_id: empresaId, camada: 'B', status: 'falha', detalhe: `msgs ${numero}: ${e.message}` })
    return
  }
  const msgs = Array.isArray(json) ? json : json?.registros ?? []
  if (!msgs.length) return

  // ids já existentes p/ não duplicar
  const { data: existentes } = await db.from('at_mensagens').select('id_multi360').eq('protocolo_id', protocoloId)
  const jaTem = new Set((existentes ?? []).map((m: any) => m.id_multi360))

  let ultimaDirecao: string | null = null
  let ultimaData = 0
  const novas: any[] = []
  for (const m of msgs) {
    if (m.tipoMensagem === 'REACTION') continue
    // eventos internos do Multi360 (troca de atendente etc.) não são mensagens
    const raw = typeof m.mensagem === 'string' ? m.mensagem : ''
    if (/^\{"message":"[A-Z_]+"/.test(raw)) continue
    const { tipo, texto, ehMidia } = classificarMensagem(m)
    // Registra direção/data da mensagem HUMANA mais recente.
    // O robô responder não é a equipe responder: o cliente segue esperando gente.
    // Por isso o bot não vira "colaborador" aqui nem para o relógio da espera —
    // senão o cliente some das telas de quem está sem resposta.
    if (tipo !== 'bot' && Number(m.dataCriacao) >= ultimaData) {
      ultimaData = Number(m.dataCriacao)
      ultimaDirecao = tipo
    }
    const idm = String(m.id)
    if (jaTem.has(idm)) continue
    novas.push({
      empresa_id: empresaId,
      protocolo_id: protocoloId,
      id_multi360: idm,
      remetente_tipo: tipo,
      remetente_nome: m.nome || null,
      colaborador_id: tipo === 'colaborador' ? await upsertColaborador(m.nome) : null,
      texto,
      tem_anexo: ehMidia,
      enviado_em: dataDe(m.dataCriacao),
      ordem: Number(m.id),
      _fileUrl: m.fileUrl || null,
      _nomeArq: m.nomePDF || null,
      _tipoMsg: m.tipoMensagem || null,
    })
  }

  // insere mensagens novas
  for (const n of novas) {
    const { _fileUrl, _nomeArq, _tipoMsg, ...linha } = n
    const { data: msgIns } = await db.from('at_mensagens').insert(linha).select('id').single()
    // anexo (Camada C: só registra o link; download fica p/ depois)
    if (_fileUrl && msgIns?.id) {
      const tipoAnexo = _tipoMsg === 'AUDIO' ? 'audio' : _tipoMsg === 'IMAGEM' ? 'imagem' : /\.pdf$/i.test(_nomeArq || '') ? 'pdf' : 'outro'
      await db.from('at_anexos').insert({
        empresa_id: empresaId,
        protocolo_id: protocoloId,
        mensagem_id: msgIns.id,
        tipo: tipoAnexo,
        nome_arquivo: _nomeArq || null,
        link_origem: _fileUrl,
        baixado: false,
      })
    }
  }

  if (ultimaDirecao) {
    // usa a data da última mensagem REAL (corrige pendentes que só tinham data de criação)
    await db
      .from('at_protocolos')
      .update({ ultima_mensagem_direcao: ultimaDirecao, ultima_mensagem_em: dataDe(ultimaData) })
      .eq('id', protocoloId)
  }
  if (novas.length) console.log(`   +${novas.length} msg(s) no protocolo ${numero}`)
}

// ── Lista paginada (ativos / pendentes) ─────────────────────────────────────
async function listar(tipo: string): Promise<any[]> {
  const todos: any[] = []
  let offset = 0
  for (let i = 0; i < 200; i++) {
    const json = await api(`/atendimentos/chat/${tipo}?offset=${offset}&apenasNovasMensagens=false&orderByAsc=false&apenasTotal=false&filtro=`)
    const regs = json?.registros ?? []
    if (!regs.length) break
    todos.push(...regs)
    offset += regs.length
  }
  return todos
}

// ── Conversas FINALIZADAS (via Relatórios) ──────────────────────────────────
// O endpoint de relatório traz TODOS os status (inclusive FINALIZADO), com nomes
// de campo diferentes do chat e datas como texto "dd/mm/aaaa hh:mm".
function urlRelatorio(status: string, offset: number): string {
  const p = new URLSearchParams({
    atendenteId: '-1', botId: '0', camposSegmentacao: '[]', cliente: '-1',
    departamentoId: '-1', localizacao: '', mes: '-1', motivoId: '-1',
    offset: String(offset), orderByFieldName: 'CREATE_DATE',
    orderByFieldOrdenation: 'DESC', origem: 'TODOS', status,
  })
  return `/relatorios/atendimentos?${p.toString()}`
}

async function listarRelatorio(status: string, maxPaginas = Infinity): Promise<any[]> {
  const todos: any[] = []
  let offset = 0
  for (let i = 0; i < 2000 && i < maxPaginas; i++) {
    const arr = await api(urlRelatorio(status, offset))
    const regs = Array.isArray(arr) ? arr : arr?.registros ?? []
    if (!regs.length) break
    todos.push(...regs)
    if (regs.length < 20) break
    offset += regs.length
  }
  return todos
}

// Converte um registro de relatório no formato que os upserts esperam.
function normalizarRelatorio(r: any): any {
  return {
    id: r.protocolo,
    contatoTelefone: r.numero,
    numero: r.numero,
    nome: r.nome,
    atendenteNome: r.atendente,
    departamentoNome: r.departamento,
    canal: r.botDisplayName,
    status: r.status, // FINALIZADO
    possuiAnexo: r.possuiAnexo,
    dataCriacao: parseDataBR(r.data),
    dataUltimaMensagem: parseDataBR(r.dataUltimaMensagem),
    _origem: r.origem || null,
    _finalizadoEm: parseDataBR(r.dataFinalizacao),
    tags: [],
  }
}

// Upsert de cliente que NÃO rebaixa ultimo_contato_em de um cliente já ativo.
// (usa insert-se-novo; se já existe, só pega o id — não sobrescreve a data recente)
async function upsertClienteFin(reg: any): Promise<string | null> {
  const telefone = soDigitos(reg.numero)
  if (!telefone) return null
  if (clienteFinCache.has(telefone)) return clienteFinCache.get(telefone) as string | null
  await db.from('at_clientes').upsert(
    {
      empresa_id: empresaId,
      telefone,
      nome: reg.nome || telefone,
      nome_normalizado: normalizarFonetico(reg.nome || telefone),
      ultimo_contato_em: dataDe(reg.dataUltimaMensagem),
    },
    { onConflict: 'telefone', ignoreDuplicates: true }
  )
  const { data } = await db.from('at_clientes').select('id').eq('telefone', telefone).maybeSingle()
  const id = data?.id ?? null
  clienteFinCache.set(telefone, id)
  return id
}

async function temMensagens(protocoloId: any): Promise<boolean> {
  const { count } = await db
    .from('at_mensagens')
    .select('id', { count: 'exact', head: true })
    .eq('protocolo_id', protocoloId)
  return (count ?? 0) > 0
}

// Fecha automaticamente as cobranças cujo protocolo JÁ foi respondido pelo
// atendente (última mensagem = colaborador, e depois da criação da cobrança).
async function resolverCobrancasRespondidas(): Promise<number> {
  const { data: abertas } = await db
    .from('at_cobrancas')
    .select('id, protocolo_id, criado_em')
    .eq('status', 'ABERTA')
  if (!abertas || !abertas.length) return 0
  let n = 0
  for (const c of abertas) {
    if (!c.protocolo_id) continue
    const { data: p } = await db
      .from('at_protocolos')
      .select('ultima_mensagem_direcao, ultima_mensagem_em')
      .eq('id', c.protocolo_id)
      .maybeSingle()
    if (!p) continue
    const respondida =
      p.ultima_mensagem_direcao === 'colaborador' &&
      p.ultima_mensagem_em &&
      c.criado_em &&
      new Date(p.ultima_mensagem_em).getTime() > new Date(c.criado_em).getTime()
    if (respondida) {
      await db
        .from('at_cobrancas')
        .update({
          status: 'RESOLVIDA',
          resolvido_em: new Date().toISOString(),
          nota_resolucao: 'Resolvida automaticamente — o atendente respondeu o cliente.',
        })
        .eq('id', c.id)
      n++
    }
  }
  if (n) console.log(`   ✅ ${n} cobrança(s) resolvida(s) automaticamente (atendente respondeu).`)
  return n
}

// (C) Fecha o furo dos 15 min: uma conversa que NASCEU e foi FINALIZADA dentro
// da mesma janela nunca aparece nas abas de abertas — o loop normal não a veria.
// Aqui pegamos as finalizadas mais RECENTES (topo do relatório, ordenado por data
// de criação desc) e gravamos os metadados. Assim as conversas "abriu e fechou
// rápido" também entram. Leve: só as primeiras páginas, sem baixar mensagens.
async function syncFinalizadasRecentes(paginas = 3): Promise<number> {
  let brutos: any[] = []
  try {
    brutos = await listarRelatorio('Finalizado', paginas)
  } catch (e: any) {
    console.warn(`   ⚠️  finalizadas recentes: não consegui ler o relatório (${e.message}).`)
    return 0
  }
  let n = 0
  for (const r of brutos) {
    const reg = normalizarRelatorio(r)
    const clienteId = await upsertClienteFin(reg)
    if (!clienteId) continue
    const responsavelId = await upsertColaborador(reg.atendenteNome)
    const proto = await upsertProtocolo(reg, clienteId, responsavelId)
    if (proto) n++
  }
  if (n) console.log(`   📌 finalizadas recentes conferidas: ${n} (fecha o furo dos 15 min).`)
  return n
}

/**
 * Recalcula o tempo de resposta mês a mês e grava a foto do dia (linha de base).
 * É o que alimenta o painel inicial — a conta roda no banco (são ~176 mil
 * mensagens; fazer isso a cada abertura de tela seria inviável).
 * Best-effort: se as tabelas de métrica ainda não existirem, o leitor segue.
 */
async function atualizarMetricas(): Promise<void> {
  const { data: meses, error } = await db.rpc('at_recalcular_metricas')
  if (error) {
    console.log('   (métricas não atualizadas:', error.message + ')')
    return
  }
  const { error: e2 } = await db.rpc('at_registrar_linha_base', { nota: null })
  if (e2) console.log('   (linha de base não registrada:', e2.message + ')')
  else console.log(`   métricas atualizadas (${meses} meses) + foto do dia`)
}

// Marca como FINALIZADO, no nosso banco, as conversas que saíram de TODAS as
// filas de abertas da Multi360 (foram encerradas lá). Corrige o "resíduo" de
// conversas que ficavam presas como ATIVO/AGUARDANDO no nosso lado.
// SEGURANÇA: só encerra quem NÃO está em nenhuma fila de abertas; se a lista
// vier vazia (falha de leitura), não faz nada — para nunca encerrar por engano.
async function reconciliarFinalizadas(idsAbertos: Set<string>): Promise<number> {
  if (!idsAbertos || idsAbertos.size === 0) {
    console.log('   ⏭️  reconciliação pulada (lista de abertas vazia — evitando encerrar por engano).')
    return 0
  }
  const { data: nossasAbertas, error } = await db
    .from('at_protocolos')
    .select('id, numero_protocolo, ultima_mensagem_em, finalizado_em')
    .eq('empresa_id', empresaId)
    .in('status_multi360', ['ATIVO', 'AGUARDANDO', 'POTENCIAL'])
  if (error) {
    console.error('   ⚠️  reconciliação: erro ao ler abertas do banco:', error.message)
    return 0
  }
  const fantasmas = (nossasAbertas || []).filter(
    (p: any) => !idsAbertos.has(String(p.numero_protocolo))
  )
  if (!fantasmas.length) {
    console.log('   ✔️  reconciliação: banco bate com a Multi360 (nada a encerrar).')
    return 0
  }
  let n = 0
  for (const p of fantasmas) {
    const { error: upErr } = await db
      .from('at_protocolos')
      .update({
        status_multi360: 'FINALIZADO',
        finalizado_em: p.finalizado_em || p.ultima_mensagem_em || new Date().toISOString(),
      })
      .eq('id', p.id)
    if (!upErr) n++
  }
  console.log(`   🧹 reconciliação: ${n} conversa(s) marcada(s) como FINALIZADA (saíram das filas de abertas da Multi360).`)
  return n
}

// Normaliza um registro da aba "Potenciais". Potenciais são DUAS situações:
// (1) primeiro contato novo ainda não distribuído; (2) cliente já existente cuja
// conversa foi ENCERRADA e que VOLTOU a falar (reengajamento). A dataCriacao vem
// como o momento do RETORNO (mesmo que o protocolo seja antigo) — por isso o Marco
// Zero detecta o retorno. ATENÇÃO: o cliente real está em telefoneUsuario
// (telefoneCliente é a linha do escritório). Não tem status/departamento/atendente.
function normalizarPotencial(r: any): any {
  return {
    id: r.id,
    status: 'POTENCIAL',
    contatoTelefone: r.telefoneUsuario,
    nome: (r.usuario || '').trim() || null,
    departamentoNome: null,
    atendenteNome: null,
    canal: r.telefoneCliente || null,
    possuiAnexo: false,
    dataCriacao: r.dataCriacao,
    dataUltimaMensagem: r.dataCriacao,
    tags: [],
    _previa: r.ultimaMensagemTexto || null,
    _direcao: r.ultimaMensagemRemetente === 'USUARIO' ? 'cliente' : 'colaborador',
  }
}

// ── Uma rodada de sincronização (igual ao sync() do script local) ────────────
async function sync(): Promise<any> {
  console.log(`\n🔄  ${new Date().toLocaleString('pt-BR')} — sincronizando...`)
  const ativos = await listar('ativos')
  const pendentes = await listar('pendentes')
  let potenciais: any[] = []
  let potenciaisOk = true
  try {
    potenciais = await listar('potenciais')
  } catch (e: any) {
    potenciaisOk = false
    console.warn(`   ⚠️  não consegui ler a aba Potenciais: ${e.message}`)
  }
  const mapa = new Map<string, any>()
  for (const r of [...ativos, ...pendentes]) mapa.set(String(r.id), r)
  const registros = [...mapa.values()]
  console.log(`   ${registros.length} conversas em aberto (${ativos.length} ativas, ${pendentes.length} pendentes, ${potenciais.length} potenciais)`)

  let comNovas = 0
  let semTelefone = 0
  for (const reg of registros) {
    // Pendentes vêm "enxutos" (sem telefone/nome) — busca o contato no detalhe.
    const pendente = !reg.contatoTelefone
    let detalhe: any = null
    if (pendente) {
      detalhe = await detalheContato(reg.id)
      if (detalhe) {
        reg.contatoTelefone = detalhe.telefone
        if (!reg.nome && detalhe.nome) reg.nome = detalhe.nome
        if (!reg.atendenteNome && detalhe.atendenteNome) reg.atendenteNome = detalhe.atendenteNome
      }
    }
    const clienteId = await upsertCliente(reg)
    if (!clienteId) {
      semTelefone++
      continue
    }
    const responsavelId = await upsertColaborador(reg.atendenteNome)
    const proto = await upsertProtocolo(reg, clienteId, responsavelId)
    if (!proto) continue
    // Busca mensagens de: quem tem novidade (não visualizada), pendentes,
    // OU quem ainda não tem NENHUMA mensagem baixada (backfill da prévia).
    const semMensagens = !(await temMensagens(proto.id))
    if (Number(reg.mensagensNaoVisualizadas) > 0 || pendente || semMensagens) {
      comNovas++
      await syncMensagens(proto.id, String(reg.id))
      // Participantes (só exibição): reaproveita o detalhe do pendente; senão busca.
      // Só grava quando a leitura deu certo (detalhe != null); em falha deixa NULL para
      // o backfill tentar depois, em vez de marcar como "sem participantes" por engano.
      if (!detalhe) detalhe = await detalheContato(reg.id)
      if (detalhe) await gravarParticipantes(proto.id, detalhe.participantes)
    }
  }
  // Potenciais: guarda como protocolo status POTENCIAL (conta como aberto). Grava a
  // prévia e a direção real (contato novo OU cliente encerrado que voltou a falar).
  let potNovos = 0
  for (const r of potenciais) {
    const reg = normalizarPotencial(r)
    const clienteId = await upsertCliente(reg)
    if (!clienteId) { semTelefone++; continue }
    const proto = await upsertProtocolo(reg, clienteId, null)
    if (!proto) continue
    if (reg._previa) {
      await db.from('at_mensagens').upsert(
        { empresa_id: empresaId, protocolo_id: proto.id, id_multi360: `pot-${reg.id}`, remetente_tipo: reg._direcao, texto: reg._previa, enviado_em: dataDe(reg.dataCriacao), ordem: Number(reg.id) || null },
        { onConflict: 'protocolo_id,id_multi360', ignoreDuplicates: true }
      )
    }
    await db.from('at_protocolos').update({ ultima_mensagem_direcao: reg._direcao, ultima_mensagem_em: dataDe(reg.dataCriacao) }).eq('id', proto.id)
    potNovos++
  }
  if (potNovos) console.log(`   ${potNovos} potencial(is) capturado(s).`)
  if (semTelefone) console.log(`   (${semTelefone} conversas sem telefone identificável — ignoradas)`)
  await resolverCobrancasRespondidas()

  // Participantes (só exibição): preenche aos poucos as abertas que ainda não têm.
  const nPart = await backfillParticipantes(80)
  if (nPart) console.log(`   ${nPart} conversa(s) tiveram os participantes capturados.`)

  // Reconcilia: o que saiu de TODAS as filas de abertas (Ativos + Pendentes +
  // Potenciais) foi encerrado na Multi360 → marca como FINALIZADO no nosso banco.
  // Só roda quando conseguimos ler a aba Potenciais — senão, adia (nunca encerra às cegas).
  if (potenciaisOk) {
    const idsAbertos = new Set<string>(
      [...ativos, ...pendentes, ...potenciais].map((r: any) => String(r.id))
    )
    await reconciliarFinalizadas(idsAbertos)
  } else {
    console.warn('   ⚠️  reconciliação adiada nesta rodada (não li a aba Potenciais).')
  }

  // (C) Pega as finalizadas recentes (fecha o furo dos 15 min).
  await syncFinalizadasRecentes()

  await atualizarMetricas()
  await db.from('at_extracao_log').insert({
    empresa_id: empresaId,
    camada: 'A',
    status: 'sucesso',
    detalhe: `${registros.length} protocolos; ${comNovas} com mensagens novas`,
  })
  console.log(`✅  rodada concluída (${comNovas} conversas com mensagens novas).`)

  return {
    conversas_abertas: registros.length,
    ativas: ativos.length,
    pendentes: pendentes.length,
    potenciais: potenciais.length,
    com_mensagens_novas: comNovas,
    potenciais_capturados: potNovos,
    sem_telefone: semTelefone,
  }
}

// ── Resolução da empresa (igual ao resolverEmpresa() do script) ──────────────
async function resolverEmpresa(slug: string): Promise<string | null> {
  try {
    const { data, error } = await db.from('empresas').select('id').eq('slug', slug).maybeSingle()
    if (error) throw error
    return data?.id ?? null
  } catch (e: any) {
    console.error(`❌ Erro ao buscar empresa (slug: ${slug}):`, e.message)
    throw e
  }
}

// Lê a linha única de configuração (token + base_url + dominio + empresa_slug).
// Preferência: a linha do escritório 'aposentar'; se não houver, a primeira linha.
async function lerConfig(): Promise<any> {
  const { data, error } = await db
    .from('at_integracao_multi360')
    .select('empresa_id, token, base_url, dominio, empresa_slug, cron_secret')
    .eq('empresa_slug', 'aposentar')
    .maybeSingle()
  if (error) throw new Error(`erro ao ler at_integracao_multi360: ${error.message}`)
  if (data) return data
  // fallback: primeira linha qualquer
  const { data: qualquer, error: e2 } = await db
    .from('at_integracao_multi360')
    .select('empresa_id, token, base_url, dominio, empresa_slug, cron_secret')
    .limit(1)
    .maybeSingle()
  if (e2) throw new Error(`erro ao ler at_integracao_multi360: ${e2.message}`)
  if (!qualquer) throw new Error('at_integracao_multi360 vazia: nenhuma configuração do Multi360 cadastrada')
  return qualquer
}

// Grava o estado da sincronização de volta na linha do empresaId.
async function gravarEstado(patch: Record<string, any>): Promise<void> {
  if (!empresaId) return
  try {
    await db.from('at_integracao_multi360').update(patch).eq('empresa_id', empresaId)
  } catch { /* não deixa o estado estourar a resposta */ }
}

// ── Entrada HTTP ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Cliente de serviço (passa por cima da RLS; URL e chave injetadas pelo Supabase).
  db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // Cada invocação começa "limpa" (como a 1ª rodada de um processo novo).
  colaboradorCache.clear()
  tagCache.clear()
  clienteFinCache.clear()
  empresaId = null

  // 1) Config + empresa. Erro aqui é erro de configuração, não de token.
  let config: any
  try {
    config = await lerConfig()
    // Limpeza do token igual ao script local (caso venha com "Bearer " ou aspas).
    TOKEN = String(config.token || '')
      .trim()
      .replace(/^Bearer\s+/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()
    BASE = String(config.base_url || 'https://painel.multi360.com.br/api').replace(/\/$/, '')
    DOMAIN = config.dominio || ''
    empresaId = config.empresa_id ?? await resolverEmpresa(config.empresa_slug || 'aposentar')
    if (!empresaId) {
      return new Response(`empresa não encontrada (slug: ${config.empresa_slug})`, { status: 500 })
    }
  } catch (e: any) {
    return new Response(`erro de configuração: ${e?.message ?? e}`, { status: 500 })
  }

  // Trava: só o nosso agendador dispara. O segredo mora na própria linha de
  // configuração (coluna cron_secret), lida aqui com a chave de serviço; o
  // pg_cron, que roda dentro do banco, lê o mesmo segredo e o manda no cabeçalho
  // x-cron-secret. (Não vem de variável de ambiente porque não há como defini-la
  // por aqui; a view v_at_integracao_status não expõe este segredo.)
  const secret = req.headers.get('x-cron-secret')
  if (!config.cron_secret || !secret || secret !== config.cron_secret) {
    return new Response('nao autorizado', { status: 401 })
  }

  // Sem token: não é "erro", é configuração pendente — marca vencido e sai 200.
  if (!TOKEN) {
    await gravarEstado({ token_status: 'vencido', ultimo_erro: 'MULTI360_TOKEN ausente na configuração' })
    return Response.json({ ok: false, motivo: 'token_vencido' }, { status: 200 })
  }

  // Modo "validar": só confere se o token responde (UMA chamada barata) e devolve
  // na hora. A tela de administrador usa isto logo após colar um token novo, para
  // dizer na mesma hora se funcionou — e, de quebra, se o Multi360 aceita a chamada
  // vinda da nuvem (não só do computador do Ronaldo).
  if (req.headers.get('x-modo') === 'validar') {
    try {
      await api('/atendimentos/chat/ativos?offset=0&apenasNovasMensagens=false&orderByAsc=false&apenasTotal=true&filtro=')
      await gravarEstado({ token_status: 'ok', ultimo_erro: null })
      return Response.json({ ok: true, token: 'ok' }, { status: 200 })
    } catch (e: any) {
      const msg = e?.message ?? String(e)
      if (msg === 'TOKEN_EXPIRADO') {
        // Token recusado pelo Multi360: venceu ou é de outra conta.
        await gravarEstado({ token_status: 'vencido', ultimo_erro: 'TOKEN_EXPIRADO' })
        return Response.json({ ok: false, token: 'vencido', detalhe: msg }, { status: 200 })
      }
      // Outro erro (ex.: Multi360 fora do ar): NÃO dá para afirmar que o token está ok
      // nem que venceu. Deixa "a conferir" e devolve indefinido (a tela não mente).
      await gravarEstado({ token_status: 'desconhecido', ultimo_erro: msg })
      return Response.json({ ok: false, token: 'indefinido', detalhe: msg }, { status: 200 })
    }
  }

  // 2) UMA volta de sincronização — em SEGUNDO PLANO.
  //    Um ciclo pode passar de 150s (o limite da RESPOSTA de uma Edge Function),
  //    então respondemos já (202) e deixamos o Supabase manter a função viva até
  //    o ciclo terminar (limite de parede do plano Pro: 400s). Como há um único
  //    escritório, duas rodadas que por acaso se cruzem usam os MESMOS valores
  //    (token/base/empresa) e não se atrapalham; e o agendador dispara a cada
  //    15 min, muito mais que 400s, então na prática não há cruzamento.
  EdgeRuntime.waitUntil((async () => {
    try {
      const contagens = await sync()
      await gravarEstado({ ultima_sync: new Date().toISOString(), token_status: 'ok', ultimo_erro: null })
      console.log('✅ rodada concluída', JSON.stringify(contagens))
    } catch (e: any) {
      const msg = e?.message ?? String(e)
      if (msg === 'TOKEN_EXPIRADO') {
        await gravarEstado({ token_status: 'vencido', ultimo_erro: 'TOKEN_EXPIRADO' })
      } else {
        await gravarEstado({ ultimo_erro: msg })
        console.error('erro na sincronização:', msg)
      }
    }
  })())

  return Response.json({ ok: true, iniciado: true }, { status: 202 })
})
