import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Integração Multi360 — token (somente ADMIN).
 *
 * POST { token }            → grava o token novo na tabela at_integracao_multi360 e, em
 *                             seguida, pede à Edge Function (modo "validar") para conferir
 *                             na hora se o token funciona vindo da nuvem. Nunca DEVOLVE o token.
 * POST { acao:'sincronizar'}→ dispara uma sincronização completa (em segundo plano, na nuvem).
 *
 * O token NÃO mora mais no .env do computador: mora aqui, por escritório, e a função da
 * nuvem o lê com a chave de serviço. A view v_at_integracao_status não expõe o token.
 */

const SLUG = 'aposentar'

async function garantirAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: NextResponse.json({ erro: 'não autenticado' }, { status: 401 }) }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { erro: NextResponse.json({ erro: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }, { status: 500 }) }
  }
  const db = createAdminClient()
  const { data: perfil } = await db.from('usuarios').select('role, ativo').eq('id', user.id).maybeSingle()
  if ((perfil as { ativo?: boolean } | null)?.ativo === false) {
    return { erro: NextResponse.json({ erro: 'este login está desativado' }, { status: 403 }) }
  }
  if (perfil?.role !== 'ADMIN') {
    return { erro: NextResponse.json({ erro: 'apenas administradores podem alterar a integração' }, { status: 403 }) }
  }
  return { db, user }
}

/** Chama a Edge Function. modo 'validar' = só confere o token (resposta na hora). */
async function chamarFuncao(cronSecret: string, modo?: 'validar') {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sincronizar-multi360`
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-cron-secret': cronSecret }
  if (modo) headers['x-modo'] = modo
  const res = await fetch(url, { method: 'POST', headers })
  const texto = await res.text()
  let corpo: Record<string, unknown> = {}
  try { corpo = JSON.parse(texto) } catch { /* resposta não-JSON */ }
  return { status: res.status, corpo }
}

export async function POST(req: Request) {
  const g = await garantirAdmin()
  if ('erro' in g) return g.erro
  const { db, user } = g

  let body: { token?: string; acao?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: 'json inválido' }, { status: 400 })
  }

  // Lê o segredo do agendador (para chamar a função). Serve para as duas ações.
  const { data: linha } = await db
    .from('at_integracao_multi360')
    .select('cron_secret')
    .eq('empresa_slug', SLUG)
    .maybeSingle()
  const cronSecret = (linha as { cron_secret?: string } | null)?.cron_secret
  if (!cronSecret) {
    return NextResponse.json({ erro: 'integração não configurada (sem segredo do agendador).' }, { status: 500 })
  }

  // Ação "sincronizar agora": dispara a sincronização completa (segundo plano).
  if (body.acao === 'sincronizar') {
    try {
      const r = await chamarFuncao(cronSecret)
      return NextResponse.json({ ok: r.status === 202, iniciado: r.status === 202, status: r.status })
    } catch (e: unknown) {
      return NextResponse.json({ erro: `não foi possível disparar a sincronização: ${(e as Error)?.message ?? e}` }, { status: 502 })
    }
  }

  // Ação padrão: gravar um token novo.
  const token = (body.token ?? '').trim()
  if (token.length < 20) {
    return NextResponse.json({ erro: 'Cole o token completo (ele é bem longo). Veja o passo a passo na tela.' }, { status: 400 })
  }

  // Grava o token; marca o estado como "desconhecido" até a validação dizer o contrário.
  const { error: errUpd } = await db
    .from('at_integracao_multi360')
    .update({
      token,
      token_status: 'desconhecido',
      ultimo_erro: null,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user.id,
    })
    .eq('empresa_slug', SLUG)
  if (errUpd) {
    return NextResponse.json({ erro: `falha ao gravar o token: ${errUpd.message}` }, { status: 500 })
  }

  // Valida na hora (uma chamada barata ao Multi360, feita pela função da nuvem).
  try {
    const r = await chamarFuncao(cronSecret, 'validar')
    const corpo = r.corpo as { token?: string; detalhe?: string }
    // 'ok' = aceito; 'vencido' = recusado; qualquer outro ('indefinido'/erro) = não deu para conferir.
    const tokenValido = corpo?.token === 'ok' ? true : corpo?.token === 'vencido' ? false : null
    return NextResponse.json({
      ok: true,
      salvo: true,
      tokenValido,
      resultado: corpo?.token ?? 'indefinido',
      detalhe: corpo?.detalhe ?? null,
    })
  } catch (e: unknown) {
    // O token foi salvo; só não conseguimos validar agora.
    return NextResponse.json({
      ok: true,
      salvo: true,
      tokenValido: null,
      detalhe: `token salvo, mas não deu para validar agora: ${(e as Error)?.message ?? e}`,
    })
  }
}
