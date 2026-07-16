# AtendeIA Previdenciário — Modelo de Dados (Supabase)

Este documento define a estrutura de tabelas no Supabase. A hierarquia central é:

**Cliente (telefone) → Protocolos → Mensagens**, com Anexos e Colaboradores relacionados.

Toda a modelagem é pensada para convergir futuramente com o PrevAtendimento (mesma stack, mesmo banco).

---

## Princípios

- O **cliente** é a pessoa real, identificada pelo **telefone**. Um cliente tem muitos protocolos.
- O **protocolo** é um atendimento/sessão do Multi360, com número único, status, responsável e datas próprias.
- A **mensagem** pertence a um protocolo e tem direção (cliente ou colaborador/bot).
- **Anexos** pertencem a mensagens (ou ao protocolo) e podem estar baixados no Storage ou apenas referenciados por link.
- Todos os IDs internos usam UUID; os identificadores do Multi360 (protocolo, telefone) são guardados como campos próprios para rastreabilidade.

---

## Tabela: `clientes`

Representa a pessoa real. Um registro por telefone.

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | gerado internamente |
| telefone | text (único) | identificador natural vindo do Multi360 (ex: 5575983261548) |
| nome | text | nome do contato (pode variar entre protocolos; guardar o mais recente) |
| total_protocolos | int | contador derivado (quantos protocolos o cliente tem) |
| primeiro_contato_em | timestamptz | data de criação do protocolo mais antigo |
| ultimo_contato_em | timestamptz | data da última mensagem mais recente entre todos os protocolos |
| criado_em | timestamptz | default now() |
| atualizado_em | timestamptz | |

> Observação previdenciária: campos como CPF, NIT/PIS, NB, profissão e categoria **não** vêm do Multi360. Ficam previstos para a fase de integração com PrevAtendimento, mas não são preenchidos por esta extração. Podem ser adicionados depois sem quebrar o modelo.

---

## Tabela: `colaboradores`

Atendentes/responsáveis internos (ex: Gabriel Paranhos, Breno Tavares, Iury Santos, Iasmim Rialy, Vanessa Nunes).

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| nome | text | nome como aparece no Multi360 |
| ativo | boolean | se ainda faz parte da equipe |
| criado_em | timestamptz | |

> O vínculo formal de "Responsável" pelo protocolo vem da aba *Participantes* do Multi360. O extrator deve capturar o nome do Responsável e associá-lo aqui (criando o colaborador se ainda não existir).

---

## Tabela: `protocolos`

Cada atendimento/sessão do Multi360. É o nível onde vivem status, responsável e departamento.

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| numero_protocolo | text (único) | número do Multi360 (ex: 535926256) |
| cliente_id | uuid (FK → clientes) | |
| responsavel_id | uuid (FK → colaboradores, nullable) | Responsável da aba Participantes |
| departamento | text | ex: "Gestão com o cliente", "Benefícios", "Financeiro" |
| status_multi360 | text | valor cru do Multi360: "Ativo" / "Finalizado" |
| status_atendimento | text | valor derivado pela IA (ver Documento 4): aguardando_primeira_resposta / promessa_pendente / resolvido / nao_requer_acao / risco_reclamacao |
| canal | text | ex: WhatsApp |
| total_mensagens | int | contador (vem do Multi360 e/ou contado na extração) |
| total_atendimentos_cliente | int | o contador "Atendimentos: N" do Multi360 (redundante, para conferência) |
| avaliacao | text | campo "Avaliação" do relatório, se houver |
| criado_em_multi360 | timestamptz | Data de Criação |
| ultima_mensagem_em | timestamptz | Data da Última Mensagem |
| finalizado_em | timestamptz (nullable) | Data de Finalização (nulo se ainda ativo) |
| ultima_mensagem_direcao | text | "cliente" ou "colaborador" — usado pela regra "quem falou por último" |
| importado_em | timestamptz | quando este protocolo foi extraído |

---

## Tabela: `mensagens`

Cada mensagem dentro de um protocolo.

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| protocolo_id | uuid (FK → protocolos) | |
| remetente_tipo | text | "cliente" / "colaborador" / "bot" |
| remetente_nome | text | nome exibido no balão (ex: "Gabriel Paranhos", "Bot", nome do cliente) |
| colaborador_id | uuid (FK → colaboradores, nullable) | preenchido quando remetente_tipo = colaborador |
| texto | text (nullable) | conteúdo textual; nulo se for só mídia |
| tem_anexo | boolean | |
| enviado_em | timestamptz | horário da mensagem |
| ordem | int | sequência dentro do protocolo (para preservar a ordem de leitura) |
| classificacao_assunto | text (nullable) | assunto previdenciário atribuído pela IA (ver Documento 4) |

---

## Tabela: `anexos`

Arquivos compartilhados (documentos, imagens, áudios).

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| protocolo_id | uuid (FK → protocolos) | |
| mensagem_id | uuid (FK → mensagens, nullable) | quando for possível associar à mensagem exata |
| tipo | text | "pdf" / "imagem" / "audio" / "outro" |
| nome_arquivo | text | ex: Procuracao_para_Rep_..._30_08_2024.pdf |
| link_origem | text | URL do arquivo no Multi360 |
| baixado | boolean | true se o arquivo foi salvo no Supabase Storage |
| storage_path | text (nullable) | caminho no Supabase Storage (quando baixado) |
| criado_em | timestamptz | |

> **Regra de download (ver Documento 3):** PDF e imagem → baixar (baixado = true). Áudio e outros → apenas registrar (baixado = false), guardando o link_origem para download sob demanda futuro.

---

## Tabela: `tags`

As etiquetas coloridas do Multi360 (ex: ANALISADO E RESPONDIDO, CLIENTE, PRECISA DE ATENÇÃO, MSG ALT ENDEREÇO, COM RESPOSTA, ANALISADA CONVERSA).

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| nome | text (único) | texto da etiqueta |
| criado_em | timestamptz | |

## Tabela: `protocolo_tags` (associativa)

| Campo | Tipo | Observação |
|-------|------|------------|
| protocolo_id | uuid (FK → protocolos) | |
| tag_id | uuid (FK → tags) | |

> Chave primária composta (protocolo_id, tag_id).

---

## Tabela: `ocorrencias_auditoria`

Registra cada problema auditável atribuído a um colaborador (ver Documento 4, seções 4A e 4B). É a base do placar de frequência de problemas por colaborador.

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| protocolo_id | uuid (FK → protocolos) | conversa onde ocorreu |
| colaborador_id | uuid (FK → colaboradores) | responsável no momento da ocorrência |
| tipo | text | resposta_sem_sequencia / promessa_nao_cumprida / fechamento_indevido / fora_de_sla / risco_reclamacao_nao_tratado |
| cliente_respondeu_em | timestamptz (nullable) | data/hora da resposta do cliente (para a regra 4A) |
| parado_desde | timestamptz (nullable) | desde quando está parado |
| gravidade | text | "baixa" / "media" / "alta" (ex: fechamento_indevido = alta) |
| detalhe | text | descrição/contexto da ocorrência |
| detectado_em | timestamptz | quando o sistema detectou |
| resolvido | boolean | se a pendência já foi tratada depois |
| resolvido_em | timestamptz (nullable) | |

> Uma mesma conversa pode gerar mais de uma ocorrência ao longo do tempo. O placar por colaborador é derivado desta tabela (contagem por `colaborador_id` e por `tipo`), cruzado com o total de conversas atendidas para calcular a **taxa**.

## Tabela: `extracao_log`

Registro de cada rodada de extração, para auditoria e para detectar falhas silenciosas.

| Campo | Tipo | Observação |
|-------|------|------------|
| id | uuid (PK) | |
| camada | text | "A" / "B" / "C" |
| protocolo_id | uuid (nullable) | quando aplicável |
| status | text | "sucesso" / "falha" / "parcial" |
| detalhe | text | mensagem de erro, contagem de itens, etc. |
| executado_em | timestamptz | |

---

## Relacionamentos (resumo)

```
clientes 1---N protocolos 1---N mensagens 1---N anexos
colaboradores 1---N protocolos (responsavel_id)
colaboradores 1---N mensagens (colaborador_id)
colaboradores 1---N ocorrencias_auditoria
protocolos 1---N ocorrencias_auditoria
protocolos N---N tags (via protocolo_tags)
```

## Índices recomendados

- `clientes.telefone` (único)
- `protocolos.numero_protocolo` (único)
- `protocolos.cliente_id`
- `protocolos.status_multi360`, `protocolos.status_atendimento`
- `mensagens.protocolo_id`, `mensagens.enviado_em`
- `anexos.protocolo_id`, `anexos.tipo`
- `ocorrencias_auditoria.colaborador_id`, `ocorrencias_auditoria.tipo`, `ocorrencias_auditoria.protocolo_id`
