# Primeira mensagem — "⚫ PrevAtendimento 09"

Você é a conversa principal do PrevAtendimento, a **⚫ PrevAtendimento 09**, continuação da 08 (encerrada por tamanho/idade de
contexto em 26/11/2026, a pedido do Ronaldo — comando 111). O Ronaldo é advogado, não programador: trate por "você", explique a
finalidade sem jargão, publique só o que o conferente aprovar.

## Comece assim (método do PrevSystem, CLAUDE.md §5-A)
1. Leia o `CLAUDE.md` do projeto e o global (já vêm carregados), o índice da memória (`MEMORY.md`) e a **última seção** de
   `estado-do-projeto.md` (a seção "25/11/2026"). Leia também [[caderno-de-regras]], `docs/pendencias-do-ronaldo.md` e
   `docs/decisoes.md`.
2. Confira seu nome (`get_session` self): deve ser "⚫ PrevAtendimento 09"; sem o ícone ⚫, renomeie.
3. Confira o git (último commit de código `66421da`; no ar `publicada-05`).
4. **Confira o estado AO VIVO (§2-A):** no banco `cgnudnxivpeyzcurdzkt`,
   `select token_status, ultima_sync from v_at_integracao_status` e `select max(executado_em) from at_extracao_log`. O leitor
   agora roda na **NUVEM** (Edge Function `sincronizar-multi360` + pg_cron a cada 15 min) — não há mais leitor local para reiniciar.
5. Diga ao Ronaldo, em poucas linhas, onde as coisas estão.

## O que está PRONTO (não refazer)
- **Leitor do Multi360 na nuvem (DA-63):** Edge Function + pg_cron + tela de token (Configurações → Integração Multi360).
  Provado funcionando (sem amarração por IP). Publicado `publicada-05`.
- **Caderno de Regras (regra global):** Artifact fixo https://claude.ai/artifact/BMacjdfSJBQ2gwxdVr3PCR, fonte
  `docs/caderno-de-regras/caderno-de-regras.html`. **Manter:** a cada regra nova/mudada ou tela que mude, editar o HTML e
  republicar na MESMA url (`Artifact` com `url`), na mesma sessão. Ver [[caderno-de-regras]].
- **Vitrine:** https://web-phi-lovat-27.vercel.app/vitrine (telas de amostra, sem login).

## O que está EM ABERTO (prioridade)
1. **Token do Multi360 — automatizar (P-37):** o token é da SESSÃO do navegador e o Multi360 é **sessão única** (novo login
   invalida o anterior). O Ronaldo vai perguntar ao **suporte do Multi360** se há um **token oficial de integração** (texto em
   `docs/pergunta-suporte-multi360.md`). **Lembrete agendado para sexta 27/11 10:00** (`scheduled-tasks/multi360-token-oficial-followup`):
   se não responderem, refazer a pergunta e oferecer a **pecinha do navegador** (extensão que usa a sessão dele; a coluna
   `chave_auto` já existe no banco). A rotina na nuvem "entra como você" foi DESCARTADA (sessão única → conflito).
   - **Renovar o token na mão, se vencer:** Claude in Chrome → `painel.multi360.com.br/bots` (logado, **NÃO clicar "Entrar"**, que
     troca o token) → `JSON.parse(localStorage['ngStorage-token'])` → `update at_integracao_multi360 set token=...,
     token_status='desconhecido'` → validar (`x-modo: validar`).
2. **Aprovações do Ronaldo pendentes:** aprovar a aparência da vitrine (P-01) e dar uma passada no Caderno (ratificar/retificar).
3. **Demais pendências:** `docs/pendencias-do-ronaldo.md` (P-01 a P-13, P-35, P-36, P-37).

Não deixe nada só na conversa: decisão → `docs/decisoes.md` (DA-xx); pendência dele → `docs/pendencias-do-ronaldo.md`;
estado → `estado-do-projeto.md`; regra nova/tela que mude → atualizar o Caderno e republicar.
