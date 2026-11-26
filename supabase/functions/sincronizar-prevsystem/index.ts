// ============================================================================
// PrevAtendimento — Edge Function "sincronizar-prevsystem" (Deno)
//
// O QUE FAZ: lê a EQUIPE do escritório do PrevSystem pela ponte (NR-173/DA-64) e
// espelha nas nossas tabelas (at_colaboradores + at_colaborador_detalhe + at_setores
// + at_colaborador_setores + at_ausencias). É só para escritório que usa mais de um
// sistema do SIAP (hoje a Aposentar). Leitura incremental por versão.
//
// DE ONDE: a config fica em public.at_integracao_prevsystem (chave de serviço passa por
// cima da RLS): endpoint, apikey (anon do PrevSystem), a NOSSA chave (p_chave), o
// cron_secret e a ultima_versao lida. Chamadas server->server (nunca do navegador).
//
// CASA SEM DUPLICAR: cada colaborador do PrevSystem tem um id (externo_id). Procuramos
// por externo_id; se não achar, por NOME exato (funde com o atendente do Multi360 de
// mesmo nome); senão criamos (só para quem está ativo). Quem saiu do universo vira
// "ausente_desde" — nunca apaga (o histórico de mensagens/cobranças continua).
//
// TRAVA: x-cron-secret = a coluna cron_secret. Variáveis injetadas pelo Supabase:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Cfg = {
  empresa_id: string; endpoint_url: string; apikey: string; chave: string
  cron_secret: string; ultima_versao: number; ligado: boolean
}

const soDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '') || null
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

Deno.serve(async (req: Request) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // Config
  const { data: cfg, error: errCfg } = await db
    .from('at_integracao_prevsystem')
    .select('empresa_id, endpoint_url, apikey, chave, cron_secret, ultima_versao, ligado')
    .eq('empresa_slug', 'aposentar')
    .maybeSingle()
  if (errCfg || !cfg) return new Response(`config ausente: ${errCfg?.message ?? 'sem linha'}`, { status: 500 })
  const c = cfg as Cfg

  // Trava do agendador
  const secret = req.headers.get('x-cron-secret')
  if (!c.cron_secret || secret !== c.cron_secret) return new Response('nao autorizado', { status: 401 })
  if (!c.ligado) return Response.json({ ok: false, motivo: 'desligado' }, { status: 200 })

  // Chamada à RPC do PrevSystem
  async function ler(parte: string, p_desde = 0): Promise<any> {
    const res = await fetch(c.endpoint_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: c.apikey, Authorization: `Bearer ${c.apikey}` },
      body: JSON.stringify({ p_chave: c.chave, p_parte: parte, p_desde, p_limite: 2000 }),
    })
    const txt = await res.text()
    let json: any = null
    try { json = txt ? JSON.parse(txt) : null } catch { /* abaixo */ }
    if (!res.ok) throw new Error(`PrevSystem ${parte} HTTP ${res.status}: ${txt.slice(0, 200)}`)
    // A RPC devolve erro como objeto {code,message} ou lança; normaliza
    if (json && typeof json === 'object' && json.message && !('itens' in json)) throw new Error(`PrevSystem ${parte}: ${json.message}`)
    return json
  }

  // Acha o nosso colaborador (ou cria/funde) para um id do PrevSystem.
  async function casarColaborador(externoId: string, nome: string, ativo: boolean, versao: number): Promise<string | null> {
    // 1) por externo_id
    let { data } = await db.from('at_colaboradores').select('id').eq('empresa_id', c.empresa_id).eq('externo_id', externoId).maybeSingle()
    if (data?.id) {
      await db.from('at_colaboradores').update({ nome, ativo, fonte: 'prevsystem', versao, ausente_desde: null }).eq('id', data.id)
      return data.id
    }
    // 2) por nome exato (funde com o atendente do Multi360 de mesmo nome)
    const { data: todos } = await db.from('at_colaboradores').select('id, nome').eq('empresa_id', c.empresa_id).is('externo_id', null)
    const achado = (todos ?? []).find((r: any) => norm(r.nome) === norm(nome))
    if (achado?.id) {
      await db.from('at_colaboradores').update({ externo_id: externoId, nome, ativo, fonte: 'prevsystem', versao, ausente_desde: null }).eq('id', achado.id)
      return achado.id
    }
    // 3) cria (só se ativo; inativo que não casa não precisa virar linha)
    if (!ativo) return null
    const { data: novo } = await db.from('at_colaboradores')
      .insert({ empresa_id: c.empresa_id, nome, ativo, fonte: 'prevsystem', externo_id: externoId, versao })
      .select('id').single()
    return novo?.id ?? null
  }

  try {
    // ── Universo: ids da equipe + departamentos ──────────────────────────────
    const uni = await ler('universo')
    const itens = uni?.itens ?? {}
    const idsEquipe: string[] = itens.colaboradores ?? []
    const departamentos: any[] = itens.departamentos ?? []

    // Departamentos (at_setores) por externo_id. Guardamos o mapa nome->setor_id.
    const setorPorNome = new Map<string, string>()
    for (const d of departamentos) {
      const { data: ex } = await db.from('at_setores').select('id').eq('empresa_id', c.empresa_id).eq('externo_id', d.id).maybeSingle()
      let setorId = ex?.id
      const patch = { nome: d.nome, ativo: d.ativo !== false, fonte: 'prevsystem' as const }
      if (setorId) {
        await db.from('at_setores').update(patch).eq('id', setorId)
      } else {
        const { data: novo } = await db.from('at_setores')
          .insert({ empresa_id: c.empresa_id, externo_id: d.id, ...patch }).select('id').single()
        setorId = novo?.id
      }
      if (setorId) setorPorNome.set(norm(d.nome), setorId)
    }

    // ── Colaboradores (incremental) ──────────────────────────────────────────
    let desde = Number(c.ultima_versao) || 0
    let maiorVersao = desde
    let processados = 0, ativosCompletos = 0
    for (let pagina = 0; pagina < 50; pagina++) {
      const resp = await ler('colaborador', desde)
      const lista: any[] = resp?.itens ?? []
      for (const it of lista) {
        const colabId = await casarColaborador(String(it.id), it.nome ?? '', it.ativo !== false, Number(it.versao) || 0)
        if (Number(it.versao) > maiorVersao) maiorVersao = Number(it.versao)
        processados++
        if (!colabId) continue
        if (it.ativo === false) {
          await db.from('at_colaboradores').update({ ativo: false }).eq('id', colabId)
          continue
        }
        ativosCompletos++
        // Detalhe (dados pessoais)
        await db.from('at_colaborador_detalhe').upsert({
          colaborador_id: colabId, empresa_id: c.empresa_id,
          cpf: soDigitos(it.cpf), rg: it.rg ?? null, data_nascimento: it.data_nascimento ?? null, sexo: it.sexo ?? null,
          email: it.email ?? null, telefone: soDigitos(it.telefone), whatsapp: soDigitos(it.whatsapp),
          cep: soDigitos(it.cep), logradouro: it.logradouro ?? null, numero: it.numero ?? null, complemento: it.complemento ?? null,
          bairro: it.bairro ?? null, cidade: it.cidade ?? null, uf: it.uf ?? null,
          data_admissao: it.data_admissao ?? null, funcao: it.funcao ?? null, tipo_vinculo: it.tipo_vinculo ?? null,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'colaborador_id' })
        // Departamentos da pessoa (substitui pelo conjunto atual)
        await db.from('at_colaborador_setores').delete().eq('colaborador_id', colabId)
        for (const nomeSetor of (it.departamentos ?? [])) {
          const setorId = setorPorNome.get(norm(nomeSetor))
          if (setorId) await db.from('at_colaborador_setores').insert({ colaborador_id: colabId, setor_id: setorId })
        }
        // Ausências (substitui pelo conjunto atual)
        await db.from('at_ausencias').delete().eq('colaborador_id', colabId)
        for (const a of (it.ausencias ?? [])) {
          await db.from('at_ausencias').insert({
            empresa_id: c.empresa_id, colaborador_id: colabId,
            tipo: a.ferias ? 'Férias' : (a.tipo ?? 'Ausência'), ferias: a.ferias === true,
            inicio: a.inicio ?? null, fim: a.fim ?? null,
          })
        }
      }
      if (!resp?.tem_mais) break
      desde = Number(resp?.ate) || maiorVersao
    }

    // ── Reconcilia: quem a gente tem do PrevSystem e não veio no universo → ausente ──
    if (idsEquipe.length > 0) {
      const { data: nossos } = await db.from('at_colaboradores')
        .select('id, externo_id').eq('empresa_id', c.empresa_id).eq('fonte', 'prevsystem').is('ausente_desde', null)
      const vivos = new Set(idsEquipe.map(String))
      for (const r of (nossos ?? [])) {
        if (r.externo_id && !vivos.has(String(r.externo_id))) {
          await db.from('at_colaboradores').update({ ausente_desde: new Date().toISOString() }).eq('id', r.id)
        }
      }
    }

    await db.from('at_integracao_prevsystem').update({
      ultima_versao: maiorVersao, ultima_sync: new Date().toISOString(), ultimo_erro: null, atualizado_em: new Date().toISOString(),
    }).eq('empresa_id', c.empresa_id)

    return Response.json({
      ok: true, equipe_no_universo: idsEquipe.length, departamentos: departamentos.length,
      colaboradores_processados: processados, ativos_completos: ativosCompletos, ultima_versao: maiorVersao,
    }, { status: 200 })
  } catch (e: any) {
    const msg = e?.message ?? String(e)
    await db.from('at_integracao_prevsystem').update({ ultimo_erro: msg, atualizado_em: new Date().toISOString() }).eq('empresa_id', c.empresa_id)
    return Response.json({ ok: false, erro: msg }, { status: 200 })
  }
})
