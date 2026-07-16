# AtendeIA Previdenciário — Plano de Fatia de Teste (20 protocolos)

Roteiro para construir e validar o fluxo **ponta a ponta** numa escala mínima antes de rodar nos ~2.000 protocolos. Este é o primeiro trabalho a ser executado pelo Claude Code.

**Princípio:** percorrer o cano inteiro (extração → banco → captura → mídia → painel) com 20 protocolos. Se entupir em algum ponto, o conserto é barato. Só depois se "abre a torneira" para o volume total.

---

## Pré-requisitos

- Projeto Supabase criado (banco + storage).
- Tabelas do **Documento 2** criadas.
- Acesso logado ao Multi360 disponível para a captura.
- Ambiente Node/TypeScript com Playwright configurado (para as Camadas B e C).

---

## Seleção dos 20 protocolos

Escolher uma amostra que exercite os casos difíceis, não só os fáceis:
- alguns **ativos** e alguns **finalizados**;
- pelo menos um cliente com **múltiplos protocolos** (para validar a hierarquia cliente → protocolos);
- pelo menos uma conversa **longa** (muitas mensagens, para testar a rolagem/lazy-load);
- pelo menos uma com **anexos** (PDF, imagem e áudio, para testar a Camada C e a regra de download seletivo);
- pelo menos uma **sem responsável** e uma em provável **risco de reclamação** (para testar a classificação);
- pelo menos uma onde o **cliente respondeu e o colaborador não deu sequência** (para testar a regra de auditoria 4A e o registro de ocorrência) — o caso da confirmação de endereço é um exemplo ideal.

---

## Passo a passo

### Passo 1 — Camada A (metadados) para a amostra
- Exportar (ou raspar) os metadados dos 20 protocolos da tela de relatório.
- Importar para `clientes`, `colaboradores`, `protocolos`, `tags`, `protocolo_tags`.
- **Validar:** os 20 protocolos aparecem no Supabase com status, responsável, departamento e datas corretos; clientes deduplicados por telefone; o cliente com múltiplos protocolos aparece uma vez em `clientes` e N vezes em `protocolos`.

### Passo 2 — Camada B (mensagens)
- Para cada um dos 20, abrir a conversa, rolar até o topo, capturar todas as mensagens.
- Gravar em `mensagens` com `ordem`, `remetente_tipo` e `enviado_em`.
- Confirmar o **Responsável** pela aba Participantes e vincular.
- Atualizar `ultima_mensagem_direcao`.
- **Validar:** a conversa longa veio completa (nenhuma mensagem faltando por causa de lazy-load); direção cliente/colaborador/bot correta; ordem preservada.

### Passo 3 — Camada C (mídia seletiva)
- Ler anexos de Arquivos/Imagens Compartilhados dos 20.
- Registrar todos em `anexos` (com link).
- Baixar só PDF e imagem para o Storage; áudio fica só registrado.
- **Validar:** PDFs e imagens acessíveis no Storage com `storage_path` preenchido; áudios com `baixado = false` e `link_origem` presente.

### Passo 4 — Classificação por IA
- Rodar a regra mecânica ("quem falou por último") sobre os 20.
- Rodar a IA sobre os candidatos a pendentes: atribuir `status_atendimento` e `classificacao_assunto`.
- Rodar a auditoria da regra 4A: detectar protocolos com **resposta do cliente sem sequência do colaborador** e gravar em `ocorrencias_auditoria`.
- **Validar por amostragem manual:** os estados fazem sentido (o "ok, obrigado" virou `nao_requer_acao`; a promessa não cumprida virou `promessa_pendente`; a insatisfação virou `risco_reclamacao`); e o caso de resposta-sem-sequência gerou a ocorrência correta, atribuída ao colaborador certo, com data/hora da resposta do cliente.

### Passo 5 — Painel
- Renderizar as três visões (Colaborador, Gestor de Conversas, Gestor Geral) sobre esses 20.
- **Validar:** conversas sem responsável aparecem no bloco de atribuição; pendentes ordenadas por tempo de espera; indicadores de SLA e volume calculam corretamente; a visão 360º do cliente com múltiplos protocolos mostra todos em ordem.

---

## Critérios de aprovação da fatia

A fatia está validada quando, para os 20 protocolos:
1. metadados corretos no banco;
2. mensagens completas e na ordem certa, com direção correta;
3. mídia baixada conforme a regra (PDF/imagem sim, áudio só registrado);
4. classificação da IA coerente na amostragem manual;
5. painel exibindo tudo corretamente por papel;
6. falhas (se houver) registradas em `extracao_log`, sem falha silenciosa.

---

## Depois da fatia

Com os 6 critérios atendidos, abrir para os ~2.000:
- rodar a Camada A completa (por período, possivelmente em fatias de data);
- rodar B e C em lote, priorizando **ativos primeiro**, depois finalizados;
- monitorar `extracao_log` e a estabilidade da sessão;
- só então planejar a captura **incremental** de novas mensagens (delta) e a operação contínua descrita no Documento 1.

---

## Riscos a observar durante a fatia

- **Sessão do Multi360 caindo** durante execuções longas (prever re-login).
- **Mudança de layout** da plataforma quebrando os seletores de leitura.
- **Lazy-load** não carregando todo o histórico em conversas muito longas.
- **Volume de mídia** maior que o esperado (reforça a decisão de não baixar áudio).
- **LGPD:** dados sensíveis (CPF, situação de saúde, documentos) passando pelo VPS e pelo Supabase — tratar acesso, criptografia e retenção com cuidado desde a fatia.
