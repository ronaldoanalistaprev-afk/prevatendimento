import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipoEvento, AtorTipo } from './tipos'

/**
 * Registra um Evento na Linha do Tempo Única da Pessoa (Motor de Eventos).
 * Toda interação relevante deve passar por aqui. Nunca lança: falha ao
 * registrar evento não pode derrubar o fluxo principal (best-effort).
 */
export async function registrarEvento(
  db: SupabaseClient,
  ev: {
    empresaId: string
    pessoaId: string
    tipo: TipoEvento
    canal?: string | null
    titulo?: string | null
    conteudo?: string | null
    atorTipo?: AtorTipo | null
    atorId?: string | null
    atorNome?: string | null
    conversaId?: string | null
    mensagemId?: string | null
    metadata?: Record<string, unknown> | null
    ocorridoEm?: string
  }
): Promise<void> {
  try {
    await db.from('eventos').insert({
      empresa_id: ev.empresaId,
      pessoa_id: ev.pessoaId,
      tipo: ev.tipo,
      canal: ev.canal ?? null,
      titulo: ev.titulo ?? null,
      conteudo: ev.conteudo ?? null,
      ator_tipo: ev.atorTipo ?? null,
      ator_id: ev.atorId ?? null,
      ator_nome: ev.atorNome ?? null,
      conversa_id: ev.conversaId ?? null,
      mensagem_id: ev.mensagemId ?? null,
      metadata: ev.metadata ?? null,
      ocorrido_em: ev.ocorridoEm ?? new Date().toISOString(),
    })
  } catch {
    // best-effort: não interrompe o fluxo principal
  }
}
