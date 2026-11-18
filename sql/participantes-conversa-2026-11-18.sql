-- Participantes da conversa — PrevAtendimento (projeto Supabase cgnudnxivpeyzcurdzkt)
-- Aplicado em 18/11/2026.
--
-- POR QUÊ: no Multi360, uma conversa tem um RESPONSÁVEL (o principal, "OWNER") e
-- pode ter outros colaboradores ADICIONADOS para acompanhar (participantes). Além
-- deles, o GESTOR pode entrar em qualquer conversa SEM ser participante. Até aqui o
-- nosso sistema só guardava o atendente responsável; os demais participantes se
-- perdiam. O Ronaldo pediu apenas MOSTRAR esses participantes (decisão "Só mostrar"):
-- nada de SLA nem de cobrança muda por causa disto.
--
-- O QUE É: uma coluna jsonb em at_protocolos com a lista capturada do Multi360.
-- Formato: [{ "nome": "Beatriz...", "principal": true }, { "nome": "Yago...", "principal": false }]
--   principal = true  -> é o responsável (OWNER no Multi360)
--   principal = false -> participante adicionado
-- NULL = ainda não capturado (o leitor preenche aos poucos). A tela não mostra a
-- faixa de participantes enquanto a coluna for NULL — some sem erro.
--
-- QUEM PREENCHE: o leitor (multi360-reader/index.js) grava os participantes das
-- conversas abertas que têm mensagem nova (reaproveitando o detalhe) e, a cada
-- sincronização, faz um backfill leve (80 por vez) das abertas que ainda estão NULL.
-- Depende do token do Multi360 estar válido (hoje vencido — renovação é do Ronaldo).
--
-- Reversível: alter table at_protocolos drop column participantes;

alter table at_protocolos
  add column if not exists participantes jsonb;

comment on column at_protocolos.participantes is
  'Participantes da conversa espelhados do Multi360: [{nome, principal}]. principal=true é o responsável (OWNER). NULL = ainda não capturado. Só exibição — não afeta SLA nem cobrança.';
