import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipoIdentificador } from './tipos'

/**
 * Resolução de identidade (Fase 1 — nível básico).
 *
 * Dado um identificador (ex.: número de WhatsApp), encontra a Pessoa dona dele
 * dentro da empresa (tenant). Se não existir, cria uma nova Pessoa como
 * PRETENSO_CLIENTE e registra o identificador.
 *
 * A evolução (grau de confiança 99/70/20, cadastro provisório, fusão) entra
 * nas próximas fases; aqui o casamento é exato sobre (empresa, tipo, valor).
 */
export async function resolverPessoaPorIdentificador(
  db: SupabaseClient,
  params: {
    empresaId: string
    tipo: TipoIdentificador
    valor: string
    nomeSugerido?: string
    rotulo?: string
    origem?: string
  }
): Promise<{ pessoaId: string; criada: boolean }> {
  const { empresaId, tipo, valor } = params

  const { data: existente } = await db
    .from('identificadores')
    .select('pessoa_id')
    .eq('empresa_id', empresaId)
    .eq('tipo', tipo)
    .eq('valor', valor)
    .limit(1)
    .maybeSingle()

  if (existente?.pessoa_id) {
    return { pessoaId: existente.pessoa_id, criada: false }
  }

  const agora = new Date().toISOString()
  const { data: pessoa, error: errP } = await db
    .from('pessoas')
    .insert({
      empresa_id: empresaId,
      nome: params.nomeSugerido?.trim() || valor,
      estagio: 'PRETENSO_CLIENTE',
      data_primeiro_contato: agora,
      data_ultima_msg: agora,
    })
    .select('id')
    .single()
  if (errP || !pessoa) {
    throw new Error(`falha ao criar pessoa: ${errP?.message}`)
  }

  await db.from('identificadores').insert({
    empresa_id: empresaId,
    pessoa_id: pessoa.id,
    tipo,
    valor,
    principal: true,
    rotulo: params.rotulo ?? null,
    origem: params.origem ?? 'ingestao',
    confianca: 100,
  })

  return { pessoaId: pessoa.id, criada: true }
}

/** Resolve a empresa (tenant) atual. Fase 1: single-tenant (Aposentar). */
export async function resolverEmpresaId(db: SupabaseClient): Promise<string | null> {
  const slug = process.env.EMPRESA_SLUG || 'aposentar'
  const { data } = await db.from('empresas').select('id').eq('slug', slug).maybeSingle()
  if (data?.id) return data.id
  const { data: primeira } = await db.from('empresas').select('id').limit(1).maybeSingle()
  return primeira?.id ?? null
}
