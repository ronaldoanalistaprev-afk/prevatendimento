# AtendeIA Previdenciário — Regras de Negócio de Atendimento

Define como o sistema decide se um cliente foi atendido, como classifica cada conversa e o que pode ou não ser respondido automaticamente.

---

## 1. Detecção de pendência — duas camadas

### Camada 1 — Regra mecânica: "quem falou por último?"

Barata, roda sobre todos os protocolos, sem IA. Baseada em `protocolos.ultima_mensagem_direcao`:

- Última mensagem foi do **cliente** → conversa **candidata a pendente**.
- Última mensagem foi de **colaborador/bot** → conversa **provavelmente respondida**.

Resolve a maioria dos casos e serve de primeiro filtro. Só as candidatas a pendentes seguem para a Camada 2, economizando chamadas de IA.

### Camada 2 — IA: "foi respondido de verdade?"

A regra mecânica erra em casos reais. A IA analisa **apenas as candidatas** e classifica o estado real. Casos que a regra mecânica não resolve sozinha:

- Colaborador respondeu "já verifico pra você" e sumiu → tecnicamente respondido, mas é **promessa não cumprida**.
- Cliente encerrou com "ok, obrigado" → tecnicamente pendente, mas **não requer ação**.
- Cliente fez 3 perguntas, colaborador respondeu 1 → **ficou pergunta no ar**.

---

## 2. Estados de atendimento (`protocolos.status_atendimento`)

A IA classifica cada protocolo (candidato) em um destes estados:

| Estado | Significado | Vai para o painel como |
|--------|-------------|------------------------|
| `aguardando_primeira_resposta` | Cliente escreveu e ninguém respondeu ainda | Pendente (prioridade alta) |
| `promessa_pendente` | Houve promessa/retorno prometido não cumprido | Pendente (atenção) |
| `pergunta_em_aberto` | Colaborador respondeu parcialmente; restou pergunta | Pendente |
| `resolvido` | Solicitação atendida / conversa concluída | Ok |
| `nao_requer_acao` | Última fala do cliente é agradecimento/encerramento | Ok |
| `risco_reclamacao` | Cliente demonstra insatisfação, cobrança, irritação | Alerta (prioridade máxima) |

O estado é recalculado a cada nova leitura da conversa.

---

## 3. Classificação de assunto previdenciário (`mensagens.classificacao_assunto`)

A IA classifica o assunto de cada conversa/mensagem para alimentar filtros e indicadores do painel. Categorias:

andamento de benefício · restituição · salário-maternidade · aposentadoria · pensão por morte · benefício por incapacidade · revisão · recurso · exigência · CNIS · PPP · contribuição em atraso · planejamento previdenciário · documentação · dúvida financeira · reclamação · urgência · novo direito possível.

> Estas categorias derivam do levantamento previdenciário já feito para a CRI. Podem ser ajustadas conforme o volume real observado.

---

## 4. Resposta automática — o que pode e o que não pode

Princípio geral: **em contexto previdenciário, o risco de uma resposta errada é alto** (prazo, valor, direito, situação processual). Por isso o padrão é conservador.

### Pode responder automaticamente (baixíssimo risco)

Apenas mensagens repetitivas, genéricas e sem compromisso técnico. Exemplos:
- Confirmação de recebimento ("Recebemos seu documento, obrigado.").
- Saudação/abertura sem pergunta técnica.
- Aviso genérico de que a equipe dará andamento, **sem** afirmar prazo, valor ou situação processual específica.

### NÃO pode responder automaticamente (escala para humano)

Qualquer coisa que envolva:
- prazo ("quando sai meu benefício?");
- valor ("quanto vou receber / restituir?");
- direito específico ("tenho direito a X?");
- situação processual detalhada ("meu processo está em que fase?");
- reclamação ou insatisfação;
- qualquer promessa de retorno.

Nesses casos, a IA **gera uma sugestão de resposta** que fica **pendente de aprovação humana** — nunca é enviada sozinha.

### Regra de segurança

Na dúvida entre responder e escalar, **sempre escalar**. Nenhuma resposta automática deve afirmar prazo, valor ou direito. Toda ação automática é registrada em log para auditoria.

---

## 4A. Auditoria: "resposta do cliente sem sequência do colaborador"

Regra criada a partir de um caso real: um colaborador pediu ao cliente que confirmasse o endereço; o cliente respondeu no mesmo dia; a conversa parou; e, ao ser questionado, o colaborador afirmou que o cliente **não** havia respondido — o que o registro desmentiu. O processo ficou parado à toa.

O objetivo desta regra é transformar essa auditoria (hoje feita manualmente) em verificação automática e contínua.

**Detecção:**
- O colaborador fez um **pedido/pergunta** ao cliente;
- O **cliente respondeu** (há mensagem do cliente posterior ao pedido);
- **Não houve retorno** do colaborador após a resposta do cliente, por mais de **X tempo** (parâmetro configurável, ex: 24h).

Quando os três se confirmam, o protocolo recebe a marcação de auditoria **`resposta_sem_sequencia`** (além do `status_atendimento`), registrando:
- data/hora da resposta do cliente;
- há quanto tempo está parado desde então;
- colaborador responsável no momento.

**Valor probatório:** o sistema não lê a intenção do colaborador, mas cria o **contraditório factual** — o registro objetivo de que o cliente respondeu em determinada data/hora. Qualquer afirmação do colaborador sobre o andamento pode ser conferida contra esse registro.

**Distinção importante a capturar** (ajuda a separar esquecimento de fechamento indevido):
- protocolo **ainda aberto**, colaborador segue como responsável e não deu sequência → *esquecimento/negligência de acompanhamento*;
- protocolo **finalizado/resolvido** apesar de haver resposta do cliente pendente de tratamento → *fechamento indevido* (mais grave).

Ambos entram na auditoria; o segundo caso deve ser sinalizado com prioridade maior.

## 4B. Registro de frequência de problemas por colaborador

O sistema mantém um **placar de ocorrências auditáveis por colaborador**, para o Gestor Geral acompanhar padrões (não é um evento isolado — é a recorrência que importa).

Cada ocorrência auditável é registrada e atribuída ao colaborador responsável no momento. Tipos de ocorrência contabilizados:
- `resposta_sem_sequencia` (cliente respondeu e não houve retorno — regra 4A);
- `promessa_nao_cumprida` (retorno prometido e não entregue);
- `fechamento_indevido` (protocolo finalizado com pendência real do cliente em aberto);
- `fora_de_sla` (resposta além do tempo-limite configurado);
- `risco_reclamacao_nao_tratado` (cliente demonstrou insatisfação e não houve tratamento).

Para cada colaborador, o sistema consolida: total de ocorrências, ocorrências por tipo, e evolução no tempo. Isso alimenta um indicador no painel do Gestor Geral (ver Documento 5).

> Princípio de uso justo: este placar é ferramenta de gestão e acompanhamento, baseada em registros objetivos das conversas. Deve considerar o volume de atendimento de cada colaborador (uma ocorrência em 10 conversas é diferente de uma em 300) — por isso o painel mostra também a **taxa** (ocorrências ÷ conversas atendidas), não só o número absoluto.

## 5. Atribuição de conversas sem responsável

Conversas sem colaborador vinculado ficam em destaque no painel do **Gestor de Conversas**, que **atribui manualmente**. A IA **pode sugerir** um colaborador (ex: por departamento ou por histórico do cliente), mas **não atribui sozinha** — a decisão é humana.

---

## 6. Estilo das respostas sugeridas

As sugestões geradas pela IA devem:
- usar linguagem clara e acolhedora (o cliente costuma estar ansioso e depender financeiramente do resultado);
- considerar o contexto (tipo de benefício, etapa, se há movimentação, se há pendência do cliente, se houve promessa anterior);
- evitar respostas vagas do tipo "estamos verificando".

Exemplo de sugestão adequada, em vez de "Estamos verificando":
> "Seu pedido continua em análise no INSS. Até o momento não houve nova movimentação no sistema. Nossa equipe segue acompanhando e, caso surja exigência ou decisão, entraremos em contato."

> Importante: sugestões que mencionem situação processual, prazo ou valor **sempre** passam por aprovação humana antes do envio.
