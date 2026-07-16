# AtendeIA Previdenciário — Visão do Projeto

**Projeto separado da Aposentar Soluções Previdenciárias / PrevAtendimento, com integração futura planejada.**

---

## 1. Problema

A Aposentar Soluções Previdenciárias atende clientes via WhatsApp através da plataforma de multiatendimento **Multi360**. O Multi360 **não possui API** — a integração externa depende de exportação de relatório (para metadados) e de leitura do HTML da tela (para o conteúdo das mensagens).

**Estrutura de dados descoberta na plataforma (fundamental):** um mesmo cliente (identificado pelo telefone) possui **vários protocolos** ao longo do tempo. Cada protocolo é um atendimento/sessão com número próprio, status próprio (Ativo / Finalizado), responsável próprio e conjunto próprio de mensagens. Quando uma conversa é encerrada e o cliente volta, abre-se um novo protocolo — e os anteriores ficam como "Finalizados". A hierarquia correta dos dados é, portanto: **Cliente (telefone) → Protocolos → Mensagens.**

O atendimento previdenciário tem características que uma plataforma genérica de mensagens não resolve:

- Relacionamento longo, técnico e documental (não é venda simples e rápida);
- Cliente ansioso, que depende financeiramente do resultado (aposentadoria, restituição, pensão);
- Perguntas que exigem contexto (benefício, etapa do processo, última movimentação, prazos, promessas já feitas) e não respostas genéricas;
- Risco real de: mensagens sem resposta, promessas esquecidas, retrabalho, reclamações, perda de confiança;
- Gestor (Ronaldo) sem visibilidade consolidada do que está acontecendo em todas as conversas simultaneamente.

## 2. Objetivo do projeto

Criar um assistente/agente que:

1. **Leia** as conversas do Multi360 (via automação de navegador, já que não há API);
2. **Responda automaticamente** mensagens de baixo risco e repetitivas;
3. **Sinalize e prepare** (mas não envie sozinho) respostas para mensagens que envolvam prazo, valor, direito ou situação processual específica;
4. **Alimente um painel de visualização** (dashboard) — não relatórios estáticos — que mostre em tempo quase real o que está acontecendo em todas as conversas, organizado por papel (ver seção 2.1).

### 2.1 Papéis envolvidos e o que cada um precisa ver no painel

O projeto não serve só à IA — ele serve a uma estrutura de gestão de atendimento em três camadas:

**Colaborador** (atendente previdenciário)
- Vê apenas as conversas atribuídas a ele;
- Vê contexto previdenciário de cada conversa (assunto, última movimentação, pendências, promessas feitas);
- Vê sugestões de resposta geradas pela IA para conversas de risco médio/alto.

**Gestor de Conversas** (posição nova, a contratar) — missão: garantir que todo cliente tenha sua solicitação atendida
- Vê o painel geral de todas as conversas;
- Vê especificamente as **conversas sem colaborador vinculado** e atribui manualmente (a IA não atribui sozinha — pode sugerir, mas a decisão é do Gestor de Conversas);
- Vê conversas paradas/sem resposta há mais tempo que o aceitável;
- Vê fila de sugestões de resposta pendentes de aprovação.

**Gestor Geral** (Ronaldo) — audita o trabalho do Gestor de Conversas e dos colaboradores, além de acompanhar as conversas
- Painel de auditoria com, no mínimo:
  - Tempo de resposta por colaborador/conversa (SLA);
  - Conversas paradas há X tempo sem resposta;
  - Sinais de insatisfação/risco de reclamação do cliente;
  - Volume de conversas por colaborador.

**Conversas sem colaborador vinculado** são um estado de atenção específico no painel — ficam visíveis com destaque até que o Gestor de Conversas faça a atribuição.

## 3. Escopo do MVP

### O que o assistente FAZ:

- Acessa o painel web do Multi360 via automação de navegador;
- Lê conversas novas/não respondidas;
- Classifica cada mensagem por assunto previdenciário (ver Documento 3 — Regras de Negócio);
- Responde automaticamente mensagens de baixíssimo risco (confirmações, "recebemos seu documento", status genérico sem detalhe processual);
- Gera sugestão de resposta para mensagens de risco médio/alto, deixando pendente de aprovação humana;
- Sinaliza conversas sem colaborador vinculado para atribuição manual pelo Gestor de Conversas;
- Alimenta o painel com dados atualizados em intervalos curtos (ver Documento 4 — Especificação do Painel);
- Registra logs de tudo que fez (para auditoria e para detectar falhas da automação).

### O que o assistente NÃO FAZ (nesta fase):

- Não responde automaticamente nada que envolva prazo, valor, direito específico ou situação processual detalhada;
- Não substitui análise técnica previdenciária;
- Não integra com o PrevSystem/SIAP ou com o PrevAtendimento ainda (integração é fase futura, ver Documento 5);
- Não opera sem supervisão — se a automação falhar (sessão caiu, layout mudou, captcha), o sistema deve avisar, não falhar silenciosamente.

## 4. Método de extração — três camadas

A extração dos dados históricos do Multi360 (~2.000 protocolos) foi desenhada em três camadas independentes, da mais leve para a mais pesada. Detalhamento completo no **Documento 3 — Especificação da Extração**.

- **Camada A — Metadados (lista mestre de protocolos):** a tela de relatório do Multi360 exporta um arquivo (mediante preenchimento de um período) com todos os protocolos: status, protocolo, contato, telefone, atendente, departamento, datas de criação/última mensagem/finalização, avaliação e tags. É a espinha dorsal, obtida sem raspagem de tela.
- **Camada B — Conteúdo das mensagens:** para cada protocolo, leitura do HTML da conversa (remetente, texto, horário, direção cliente/colaborador). Exige rolagem para carregar o histórico completo.
- **Camada C — Mídia seletiva:** download apenas de PDFs e imagens para o Supabase Storage; áudios e demais tipos apenas registrados (nome + link), sem download. Ver regra completa no Documento 3.

## 5. Decisão de arquitetura — duas fases

### Fase 1 — Protótipo / validação (fatia de 20 protocolos ponta a ponta)

Objetivo: percorrer o fluxo inteiro (Camada A → Supabase → Camada B → Supabase → painel) numa escala mínima, para validar o método antes de rodar nos 2.000. Ver **Documento 6 — Plano de Fatia de Teste**.

- VPS Linux simples (ex: Hostinger KVM), sem necessidade de Windows;
- Claude Code / script Node com Playwright para a captura de mensagens (Camada B);
- Supabase como banco e storage desde o início.

**Critérios para considerar a fatia validada:**
- Metadados dos 20 protocolos importados corretamente (Camada A);
- Texto das mensagens capturado corretamente, incluindo rolagem e direção cliente/colaborador (Camada B);
- PDFs e imagens baixados; áudios apenas registrados (Camada C);
- Painel exibindo corretamente os 20 protocolos por papel.

### Fase 2 — Escala e operação contínua

Após validação da fatia:

- Rodar a extração completa dos ~2.000 protocolos;
- Serviço Node.js/TypeScript para captura incremental de novas mensagens (mesma stack do PrevAtendimento);
- Anthropic Messages API para classificação e sugestão de resposta;
- Deploy em Railway ou VPS dedicado;
- Painel alimentado a partir do Supabase.

## 6. Por que separar do PrevAtendimento por enquanto

- PrevAtendimento (Fase 2 do CRM) depende do briefing detalhado de funis por tipo de benefício, ainda não finalizado;
- Este projeto resolve uma dor imediata (Multi360 sem contexto e sem visibilidade) sem esperar o CRM completo ficar pronto;
- Arquitetura pensada desde já para convergir: mesma stack, mesmo banco de dados (Supabase), estrutura de dados compatível.

## 7. Documentos do projeto

0. **00 — LEIA PRIMEIRO** (instruções sobre o perfil do usuário — ler antes de tudo)
1. **01 — Visão do Projeto** (este documento)
2. **02 — Modelo de Dados (Supabase)**
3. **03 — Especificação da Extração**
4. **04 — Regras de Negócio de Atendimento**
5. **05 — Especificação do Painel**
6. **06 — Plano de Fatia de Teste (20 protocolos)**
7. **07 — Guia de Setup do Ambiente (para leigo)**
8. **08 — Monitoramento Diário (entrega rápida, prioridade antes do histórico)**

## 8. Nome de trabalho

**AtendeIA Previdenciário** (nome pode mudar antes do lançamento).
