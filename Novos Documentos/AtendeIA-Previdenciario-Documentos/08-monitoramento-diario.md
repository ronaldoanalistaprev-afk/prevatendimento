# AtendeIA Previdenciário — Monitoramento Diário (Entrega Rápida)

## Por que este documento existe

Os Documentos 01 a 07 descrevem o projeto completo: extração dos ~2.000 protocolos históricos, modelo de dados robusto, regras de auditoria por colaborador, painel completo por papéis. É um projeto sólido, mas leva tempo para ficar pronto de ponta a ponta.

Este documento define uma **entrega rápida e paralela**: capturar **apenas as conversas novas a partir de agora** (não o histórico) e mostrar isso numa **tela simples**, para Ronaldo já ter visibilidade enquanto o projeto grande é construído.

**Prioridade confirmada: este documento é construído ANTES da extração dos 2.000 protocolos históricos.**

---

## Escopo desta entrega

### O que FAZ
- A partir do momento em que o sistema for ligado, capturar **mensagens novas** que chegarem nas conversas do Multi360 (não busca o passado);
- Mostrar numa **tela simples**, organizada **por dia**, a lista bruta das mensagens/conversas daquele dia;
- Ronaldo abre a tela quando quiser olhar (não é um relatório enviado por e-mail nesta fase).

### O que NÃO faz (fica para depois)
- Não importa o histórico dos ~2.000 protocolos (isso é o Documento 06/03, que continua existindo, só que depois);
- Não classifica por assunto previdenciário nem por urgência (isso é o Documento 04 — fica para uma fase seguinte);
- Não gera sugestão de resposta nem responde automaticamente;
- Não tem ainda os papéis completos (Colaborador / Gestor de Conversas / Gestor Geral) do Documento 05 — é uma tela única e simples, sem permissões diferentes por enquanto.

Esta simplicidade é proposital: o objetivo é ter algo funcionando rápido, não o produto final.

---

## Como funciona (visão simples, sem jargão)

1. Um programinha roda no VPS, de tempos em tempos (por exemplo, a cada 15 ou 30 minutos), e olha o Multi360 em busca de mensagens novas desde a última vez que olhou.
2. Toda mensagem nova encontrada é guardada no Supabase (mesma base de dados que o projeto grande vai usar — nada aqui é jogado fora ou refeito depois).
3. Uma tela simples lê essas mensagens do Supabase e mostra, organizadas por dia: quem é o cliente, quem respondeu (se alguém respondeu), o horário e o texto.

Como usa a mesma base de dados (Documento 02) e o mesmo método de captura (Documento 03, Camada A e B), **nada aqui é retrabalho** — quando a extração histórica dos 2.000 acontecer depois, ela vai encaixar nas mesmas tabelas, e o Monitoramento Diário passa a mostrar tudo, histórico e novo, junto.

---

## Especificação da tela

**Estrutura simples, uma página:**

- Filtro por data (padrão: hoje).
- Lista de conversas com mensagem naquele dia, mostrando:
  - nome do cliente e telefone;
  - protocolo;
  - departamento (se disponível);
  - horário da última mensagem do dia;
  - quem falou por último (cliente ou colaborador) — usando a mesma regra mecânica do Documento 04, Camada 1, que já é simples de implementar e muito útil mesmo nesta fase inicial;
  - prévia do texto da última mensagem.
- Sem gráficos, sem indicadores, sem abas por papel — só a lista, clara e legível.

> Sugestão: mesmo sendo "lista bruta" como você pediu, incluir a coluna "quem falou por último" custa muito pouco a mais e já ajuda a enxergar rapidinho quem está esperando resposta. Fica como sugestão de melhoria; se preferir realmente só a lista crua, o Claude Code pode simplificar ainda mais.

---

## Ordem de construção revisada (prioridade)

1. Documento 07 — Setup do ambiente (VPS, Node, Playwright, Claude Code, Supabase);
2. **Este documento (08) — Monitoramento Diário**, capturando conversas novas a partir de agora e exibindo na tela simples;
3. Documento 06 — Fatia de teste (20 protocolos históricos), validando o método antes de escalar;
4. Extração histórica completa dos ~2.000 (Documento 03);
5. Evolução para o projeto completo: classificação por IA, regras de auditoria (Documento 04), painel por papéis (Documento 05).

---

## Nota para o Claude Code

Esta entrega usa deliberadamente um subconjunto pequeno do que já está especificado nos Documentos 02, 03 e 04 (Camada 1 apenas). Não é um projeto à parte — é a primeira fatia útil do mesmo projeto, entregue mais rápido. Ao construir, usar as mesmas tabelas do Documento 02 desde o início, para que o crescimento posterior (histórico, IA, auditoria) não exija redesenhar nada.
