-- Índices de desempenho — PrevAtendimento (projeto Supabase cgnudnxivpeyzcurdzkt)
-- Criados em 16/11/2026 porque "as páginas estavam lentas para abrir".
--
-- Diagnóstico (pg_stat_statements): a lentidão NÃO era o plano nem distância do
-- banco (Vercel gru1 e Supabase sa-east-1, ambos em São Paulo). Era a "prévia da
-- última mensagem" das views (v_at_auditoria, v_at_monitor): um subselect POR
-- LINHA que ordenava as mensagens do protocolo numa tabela at_mensagens de ~511
-- mil linhas, SEM índice que servisse a esse sort. Isso saturava a CPU do banco e
-- deixava TODAS as consultas lentas (Auditoria chegava a ~7,4 s).
--
-- Atenção que enganou: pg_stat_user_tables.n_live_tup dava 27 mil para
-- at_mensagens (estimativa desatualizada, antes de um ANALYZE). O real é ~511 mil.
-- Sempre conferir com um ANALYZE / índice antes de concluir "tabela pequena".
--
-- Medido depois destes índices (+ ANALYZE):
--   Auditoria (v_at_auditoria, abertas)  : 7.448 ms -> 9 ms
--   Selo "atualizado" (max enviado_em)   : 2.913 ms -> 0,2 ms
--   Painel do gestor (protocolos/status) : 1,6 ms
--
-- Tamanho total dos 4 índices: ~31 MB (irrelevante no plano). Reversível: DROP INDEX.
-- Rodados com CREATE INDEX CONCURRENTLY (sem travar o leitor Multi360).

-- Prévia da última mensagem (o maior ganho): serve o subselect das views
-- (ORDER BY enviado_em DESC, ordem DESC; WHERE texto IS NOT NULL; por protocolo).
create index concurrently if not exists idx_at_mens_proto_prev
  on at_mensagens (protocolo_id, enviado_em desc nulls last, ordem desc)
  where texto is not null;

-- Selo "Atualizado com o Multi360": max(enviado_em) vira Index Only Scan instantâneo.
create index concurrently if not exists idx_at_mens_enviado
  on at_mensagens (enviado_em desc nulls last);

-- Monitor: filtro por situação + ordenação por última mensagem (evita o top-N sort).
create index concurrently if not exists idx_at_prot_status_ultmsg
  on at_protocolos (status_multi360, ultima_mensagem_em desc nulls last);

-- Auditoria: só quem o cliente falou por último (parcial), por situação e recência.
create index concurrently if not exists idx_at_prot_aud
  on at_protocolos (status_multi360, ultima_mensagem_em desc nulls last)
  where ultima_mensagem_direcao = 'cliente';
