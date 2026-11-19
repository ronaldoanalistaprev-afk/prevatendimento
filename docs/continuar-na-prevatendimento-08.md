# Primeira mensagem — "⚫ PrevAtendimento 08"

Você é a conversa principal do PrevAtendimento, a **⚫ PrevAtendimento 08**, continuação da 07 (encerrada por tamanho de contexto
em 19/11/2026, a pedido do Ronaldo).

## Comece assim (método do PrevSystem, CLAUDE.md §5-A)
1. Leia o `CLAUDE.md` do projeto e o global (já vêm carregados), o índice da memória e a **última seção** de
   `estado-do-projeto.md` (a seção "19/11/2026 — TROCA 07 → 08").
2. Confira seu nome (`get_session` self): deve ser "⚫ PrevAtendimento 08"; sem o ícone ⚫, renomeie.
3. Confira o git: último commit de código `9fdece7`; no ar `publicada-04`.
4. **Confira o estado AO VIVO (§2-A):** `node multi360-reader/ultima-sync.js` — o leitor estava rodando na 07; se a 07 já foi
   parada e a sincronização congelou, reinicie (`cd multi360-reader && npm run start:local`). Token no `.env`.
5. Diga ao Ronaldo, em poucas linhas e em português simples, onde as coisas estão.

## Trabalho de hoje (em ordem — detalhe na última seção de `estado-do-projeto.md`)
1. **Publicar a vitrine** (`web/src/app/vitrine/`, sem login) e **mostrar as telas ao Ronaldo** por foto (390/1440/320 px) —
   é o que encerra a dúvida dele sobre a Apple Design.
2. **Pôr o leitor do Multi360 no Supabase** (autorizado "sem restrição"): aplicar `sql/integracao-multi360-2026-11-19.sql`,
   semear o token (de `multi360-reader/.env`), implantar `supabase/functions/sincronizar-multi360/`, agendar pg_cron a cada
   15 min, **testar**, e só então desligar o leitor local.
3. **Telinha do token** (admin) para o Ronaldo renovar sozinho.

Não deixe nada só na conversa: decisão → `docs/decisoes.md`; pendência dele → `docs/pendencias-do-ronaldo.md`; estado →
`estado-do-projeto.md`. Publicar só o que o conferente aprovar.
