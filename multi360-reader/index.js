// ============================================================================
// AtendeIA — Leitor do Multi360 (via API interna)
// Lê a lista de atendimentos (chat/ativos, chat/pendentes) e as mensagens novas,
// e grava no Supabase (tabelas at_*). Sem navegador — só chamadas HTTP com token.
//
// Prioridade (Documento 08): capturar conversas/mensagens NOVAS e mostrar na tela.
// ============================================================================

const { createClient } = require('@supabase/supabase-js')

const BASE = (process.env.MULTI360_BASE_URL || 'https://painel.multi360.com.br/api').replace(/\/$/, '')
const TOKEN = (process.env.MULTI360_TOKEN || '')
  .trim()
  .replace(/^Bearer\s+/i, '') // caso cole "Bearer eyJ..."
  .replace(/^["']|["']$/g, '') // caso cole com aspas "eyJ..."
  .trim()
const DOMAIN = process.env.MULTI360_DOMAIN || ''
const INTERVALO_MIN = Number(process.env.POLL_INTERVAL_MIN || 15)
const UMA_VEZ = process.argv.includes('--once')
const FINALIZADOS = process.argv.includes('--finalizados')
const RESOLVER_COBRANCAS = process.argv.includes('--resolver-cobrancas')
const COM_MENSAGENS = process.argv.includes('--mensagens')
const LIMITE_MSGS = (() => {
  const a = process.argv.find((x) => x.startsWith('--limite='))
  return a ? Number(a.split('=')[1]) || Infinity : Infinity
})()

if (!TOKEN) {
  console.error('❌ Falta o MULTI360_TOKEN no .env. Veja o README para pegar o token no navegador.')
  process.exit(1)
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.')
  process.exit(1)
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let empresaId = null

// ── Chamada à API do Multi360 ───────────────────────────────────────────────
async function api(path) {
  const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
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

const soDigitos = (v) => String(v || '').replace(/\D/g, '')
const dataDe = (epochMs) => (epochMs ? new Date(Number(epochMs)).toISOString() : null)

// Nome canonizado p/ busca tolerante (Doc. Mestre SIAP — Regra 6): tira acentos e
// colapsa erros comuns (S↔SS↔Z, C↔CH↔X, G↔J, I↔Y, U↔W). Igual ao web/src/lib/utils.ts.
function normalizarFonetico(texto) {
  let t = String(texto || '').toLowerCase().replace(/ç/g, 's').normalize('NFD').replace(/[̀-ͯ]/g, '')
  t = t.replace(/[^a-z0-9\s]/g, ' ')
  t = t.replace(/ph/g, 'f').replace(/ch/g, 'x').replace(/ss/g, 's')
  t = t.replace(/ce/g, 'se').replace(/ci/g, 'si').replace(/ge/g, 'je').replace(/gi/g, 'ji')
  t = t.replace(/z/g, 's').replace(/y/g, 'i').replace(/w/g, 'u')
  return t.replace(/\s+/g, ' ').trim()
}

// "03/07/2026 09:39" (horário de Brasília) -> epoch ms
function parseDataBR(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (!m) return null
  const [, dd, mm, yyyy, HH, MM] = m
  const t = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00-03:00`).getTime()
  return Number.isFinite(t) ? t : null
}

// Detalhe do atendimento (traz o CONTATO — telefone/nome — mesmo p/ pendentes,
// que não trazem contatoTelefone na lista). Endpoint "/atendente" devolve o usuario.
async function detalheContato(id) {
  try {
    const j = await api(`/atendimentos/${id}/atendente`)
    const u = j?.usuario || {}
    return {
      telefone: u.usuarioTelefone || null,
      nome: (u.usuarioNome || '').trim() || null,
      atendenteNome: u.atendenteNome || null,
      status: u.status || null,
    }
  } catch {
    return null
  }
}

// ── Upserts ─────────────────────────────────────────────────────────────────
async function upsertCliente(reg) {
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

const colaboradorCache = new Map()
async function upsertColaborador(nome) {
  const n = (nome || '').trim()
  if (!n || n.toLowerCase() === 'bot') return null
  if (colaboradorCache.has(n)) return colaboradorCache.get(n)
  const { data } = await db
    .from('at_colaboradores')
    .upsert({ empresa_id: empresaId, nome: n }, { onConflict: 'empresa_id,nome' })
    .select('id')
    .single()
  const id = data?.id ?? null
  colaboradorCache.set(n, id)
  return id
}

const tagCache = new Map()
async function upsertTag(nome) {
  const n = (nome || '').trim()
  if (!n) return null
  if (tagCache.has(n)) return tagCache.get(n)
  const { data } = await db
    .from('at_tags')
    .upsert({ empresa_id: empresaId, nome: n }, { onConflict: 'empresa_id,nome' })
    .select('id')
    .single()
  const id = data?.id ?? null
  tagCache.set(n, id)
  return id
}

async function upsertProtocolo(reg, clienteId, responsavelId) {
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

function classificarMensagem(msg) {
  const tipo = msg.tipo === 'USUARIO' ? 'cliente' : (msg.nome === 'Bot' ? 'bot' : 'colaborador')
  const ehMidia = ['AUDIO', 'IMAGEM', 'ARQUIVO', 'VIDEO'].includes(msg.tipoMensagem)
  return {
    tipo,
    texto: msg.tipoMensagem === 'TEXTO' ? msg.mensagem : null,
    ehMidia,
  }
}

async function syncMensagens(protocoloId, numero) {
  let json
  try {
    // UP = mais recentes primeiro (é o que interessa: última mensagem, direção e prévia).
    // limit=2000 (era 100): com 100, conversas longas ficavam com as mensagens
    // ANTIGAS faltando e qualquer comparação entre meses saía torta. O `offset`
    // desta API é ignorado (sonda em probe-paginacao.js), então aumentar o limite
    // é o único jeito de trazer tudo. As mensagens repetidas são descartadas logo
    // abaixo pelo id_multi360, então o custo extra é só de rede.
    json = await api(`/atendimentos/${numero}/mensagens/v2?filtro=0&filtroDataCriacao=0&filtroOriginalId=0&filtroOriginalIdOrigem=0&offset=0&limit=2000&paginationDownUpEnum=UP`)
  } catch (e) {
    await db.from('at_extracao_log').insert({ empresa_id: empresaId, camada: 'B', status: 'falha', detalhe: `msgs ${numero}: ${e.message}` })
    return
  }
  const msgs = Array.isArray(json) ? json : json?.registros ?? []
  if (!msgs.length) return

  // ids já existentes p/ não duplicar
  const { data: existentes } = await db.from('at_mensagens').select('id_multi360').eq('protocolo_id', protocoloId)
  const jaTem = new Set((existentes ?? []).map((m) => m.id_multi360))

  let ultimaDirecao = null
  let ultimaData = 0
  const novas = []
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
async function listar(tipo) {
  const todos = []
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
function urlRelatorio(status, offset) {
  const p = new URLSearchParams({
    atendenteId: '-1', botId: '0', camposSegmentacao: '[]', cliente: '-1',
    departamentoId: '-1', localizacao: '', mes: '-1', motivoId: '-1',
    offset: String(offset), orderByFieldName: 'CREATE_DATE',
    orderByFieldOrdenation: 'DESC', origem: 'TODOS', status,
  })
  return `/relatorios/atendimentos?${p.toString()}`
}

async function listarRelatorio(status) {
  const todos = []
  let offset = 0
  for (let i = 0; i < 2000; i++) {
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
function normalizarRelatorio(r) {
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
const clienteFinCache = new Map()
async function upsertClienteFin(reg) {
  const telefone = soDigitos(reg.numero)
  if (!telefone) return null
  if (clienteFinCache.has(telefone)) return clienteFinCache.get(telefone)
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

async function temMensagens(protocoloId) {
  const { count } = await db
    .from('at_mensagens')
    .select('id', { count: 'exact', head: true })
    .eq('protocolo_id', protocoloId)
  return (count ?? 0) > 0
}

// Fecha automaticamente as cobranças cujo protocolo JÁ foi respondido pelo
// atendente (última mensagem = colaborador, e depois da criação da cobrança).
async function resolverCobrancasRespondidas() {
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

async function syncFinalizados({ mensagens = false, limiteMsgs = Infinity } = {}) {
  console.log(`\n📚  ${new Date().toLocaleString('pt-BR')} — importando conversas FINALIZADAS...`)
  const brutos = await listarRelatorio('Finalizado')
  console.log(`   ${brutos.length} conversas finalizadas encontradas no Multi360.`)

  // 1) Metadados (rápido): cliente + colaborador + protocolo p/ todas.
  let n = 0
  const protocolos = [] // {id, numero} p/ a fase de mensagens
  for (const r of brutos) {
    const reg = normalizarRelatorio(r)
    const clienteId = await upsertClienteFin(reg)
    if (!clienteId) continue
    const responsavelId = await upsertColaborador(reg.atendenteNome)
    const proto = await upsertProtocolo(reg, clienteId, responsavelId)
    if (proto?.id) protocolos.push({ id: proto.id, numero: String(reg.id) })
    if (++n % 200 === 0) console.log(`   metadados: ${n}/${brutos.length}`)
  }
  console.log(`   ✅ metadados de ${protocolos.length} protocolos gravados.`)

  // 2) Mensagens (pesado, opcional): das mais recentes p/ as mais antigas,
  //    pulando o que já tem mensagem (retomável).
  if (mensagens) {
    console.log(`   baixando mensagens (limite: ${limiteMsgs === Infinity ? 'todas' : limiteMsgs})...`)
    let baixadas = 0
    let puladas = 0
    for (const p of protocolos) {
      if (baixadas >= limiteMsgs) break
      if (await temMensagens(p.id)) { puladas++; continue }
      await syncMensagens(p.id, p.numero)
      baixadas++
      if (baixadas % 50 === 0) console.log(`   mensagens: ${baixadas} baixadas, ${puladas} já existentes`)
    }
    console.log(`   ✅ mensagens: ${baixadas} conversas baixadas, ${puladas} já tinham.`)
  }

  await db.from('at_extracao_log').insert({
    empresa_id: empresaId,
    camada: 'A',
    status: 'sucesso',
    detalhe: `finalizadas: ${protocolos.length} protocolos${mensagens ? ' + mensagens' : ' (só metadados)'}`,
  })
  console.log('📚  importação de finalizadas concluída.')
}

// ── Uma rodada de sincronização ─────────────────────────────────────────────
/**
 * Recalcula o tempo de resposta mês a mês e grava a foto do dia (linha de base).
 * É o que alimenta o painel inicial — a conta roda no banco (são ~176 mil
 * mensagens; fazer isso a cada abertura de tela seria inviável).
 * Best-effort: se as tabelas de métrica ainda não existirem, o leitor segue.
 */
async function atualizarMetricas() {
  const { data: meses, error } = await db.rpc('at_recalcular_metricas')
  if (error) {
    console.log('   (métricas não atualizadas:', error.message + ')')
    return
  }
  const { error: e2 } = await db.rpc('at_registrar_linha_base', { nota: null })
  if (e2) console.log('   (linha de base não registrada:', e2.message + ')')
  else console.log(`   métricas atualizadas (${meses} meses) + foto do dia`)
}

async function sync() {
  console.log(`\n🔄  ${new Date().toLocaleString('pt-BR')} — sincronizando...`)
  const ativos = await listar('ativos')
  const pendentes = await listar('pendentes')
  const mapa = new Map()
  for (const r of [...ativos, ...pendentes]) mapa.set(String(r.id), r)
  const registros = [...mapa.values()]
  console.log(`   ${registros.length} conversas em aberto (${ativos.length} ativas, ${pendentes.length} pendentes)`)

  let comNovas = 0
  let semTelefone = 0
  for (const reg of registros) {
    // Pendentes vêm "enxutos" (sem telefone/nome) — busca o contato no detalhe.
    const pendente = !reg.contatoTelefone
    if (pendente) {
      const d = await detalheContato(reg.id)
      if (d) {
        reg.contatoTelefone = d.telefone
        if (!reg.nome && d.nome) reg.nome = d.nome
        if (!reg.atendenteNome && d.atendenteNome) reg.atendenteNome = d.atendenteNome
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
    }
  }
  if (semTelefone) console.log(`   (${semTelefone} conversas sem telefone identificável — ignoradas)`)
  await resolverCobrancasRespondidas()
  await atualizarMetricas()
  await db.from('at_extracao_log').insert({
    empresa_id: empresaId,
    camada: 'A',
    status: 'sucesso',
    detalhe: `${registros.length} protocolos; ${comNovas} com mensagens novas`,
  })
  console.log(`✅  rodada concluída (${comNovas} conversas com mensagens novas).`)
}

// ── Loop ────────────────────────────────────────────────────────────────────
async function resolverEmpresa() {
  const slug = process.env.EMPRESA_SLUG || 'aposentar'
  const { data } = await db.from('empresas').select('id').eq('slug', slug).maybeSingle()
  return data?.id ?? null
}

async function main() {
  empresaId = await resolverEmpresa()
  if (!empresaId) {
    console.error('❌ Empresa não encontrada no Supabase (slug EMPRESA_SLUG).')
    process.exit(1)
  }
  // Modo dedicado: só fechar cobranças já respondidas e sair.
  if (RESOLVER_COBRANCAS) {
    const n = await resolverCobrancasRespondidas()
    console.log(`✅  ${n} cobrança(s) resolvida(s) automaticamente.`)
    return
  }

  // Modo dedicado: importar conversas FINALIZADAS (histórico via Relatórios) e sair.
  if (FINALIZADOS) {
    try {
      await syncFinalizados({ mensagens: COM_MENSAGENS, limiteMsgs: LIMITE_MSGS })
    } catch (e) {
      if (e.message === 'TOKEN_EXPIRADO') {
        console.error('\n🔑  Token do Multi360 expirou/ inválido. Pegue um novo no navegador (README) e atualize o .env.')
        process.exit(1)
      }
      console.error('Erro ao importar finalizadas:', e.message)
      process.exit(1)
    }
    return
  }

  try {
    await sync()
  } catch (e) {
    if (e.message === 'TOKEN_EXPIRADO') {
      console.error('\n🔑  O token do Multi360 expirou ou está inválido. Pegue um novo no navegador (README) e atualize o .env.')
      process.exit(1)
    }
    console.error('Erro na sincronização:', e.message)
  }
  if (UMA_VEZ) return
  console.log(`\n⏱️  Próxima rodada em ${INTERVALO_MIN} min. (Ctrl+C para parar.)`)
  setInterval(async () => {
    try {
      await sync()
    } catch (e) {
      if (e.message === 'TOKEN_EXPIRADO') {
        console.error('🔑  Token expirou. Atualize o .env e rode de novo.')
        process.exit(1)
      }
      console.error('Erro:', e.message)
    }
  }, INTERVALO_MIN * 60 * 1000)
}

main()
