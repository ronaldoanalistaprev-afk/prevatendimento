# AtendeIA Previdenciário — Especificação do Painel

O painel é a camada de visualização sobre os dados do Supabase. Substitui relatórios estáticos por uma visão viva do que está acontecendo nas conversas. Serve a três papéis, cada um com uma visão própria.

Stack sugerida (alinhada ao PrevAtendimento): React + TypeScript + Tailwind, lendo do Supabase.

---

## Papéis e permissões

| Papel | Escopo do que vê | Ação principal |
|-------|------------------|----------------|
| **Colaborador** | Só as conversas atribuídas a ele | Atender, usar sugestões da IA |
| **Gestor de Conversas** (cargo novo) | Todas as conversas | Garantir que todo cliente seja atendido; atribuir conversas sem responsável |
| **Gestor Geral** (Ronaldo) | Tudo + auditoria | Auditar o trabalho do Gestor de Conversas e dos colaboradores |

---

## Visão do Colaborador

Lista apenas os protocolos onde ele é o **Responsável**. Para cada conversa:
- nome do cliente, telefone, número do protocolo;
- assunto previdenciário (classificação da IA);
- estado de atendimento (pendente / promessa pendente / resolvido / etc.);
- última movimentação e há quanto tempo;
- sugestão de resposta da IA, quando houver (com botão de aprovar/editar antes de enviar).

Objetivo: o colaborador sabe, de relance, quais dos seus clientes estão esperando e o que fazer.

---

## Visão do Gestor de Conversas

Painel de toda a operação, com foco em **nenhum cliente ficar sem atendimento**.

Blocos principais:
1. **Conversas sem responsável** — destaque máximo; lista com botão de **atribuir** manualmente a um colaborador (a IA pode sugerir um, mas quem decide é o gestor).
2. **Pendentes por tempo de espera** — conversas cuja última mensagem foi do cliente, ordenadas da mais antiga para a mais recente (quem espera há mais tempo aparece primeiro).
3. **Promessas não cumpridas** — protocolos em estado `promessa_pendente`.
4. **Fila de sugestões pendentes de aprovação** — respostas geradas pela IA aguardando validação humana.
5. **Distribuição por colaborador** — quantas conversas abertas/pendentes cada um tem (para reequilibrar carga).

---

## Visão do Gestor Geral (auditoria)

Tudo o que o Gestor de Conversas vê, mais os indicadores de auditoria. Prioridades de exibição (as quatro que você definiu como críticas):

1. **Tempo de resposta por colaborador/conversa (SLA)** — quanto cada colaborador demora, em média, para responder; e conversas fora do SLA.
2. **Conversas paradas há X tempo sem resposta** — parâmetro X configurável (ex: sem resposta há mais de 24h).
3. **Sentimento / risco de reclamação** — protocolos em estado `risco_reclamacao`, com destaque.
4. **Volume de conversas por colaborador** — carga de trabalho e distribuição.

5. **Placar de ocorrências auditáveis por colaborador** — a partir de `ocorrencias_auditoria` (ver Documento 4, seções 4A/4B). Mostra, por colaborador:
   - total de ocorrências e distribuição por tipo (resposta sem sequência, promessa não cumprida, fechamento indevido, fora de SLA, risco não tratado);
   - **taxa** (ocorrências ÷ conversas atendidas), para comparar de forma justa quem atende volumes diferentes;
   - evolução no tempo (o padrão importa mais que o evento isolado);
   - destaque para ocorrências de gravidade alta (ex: fechamento indevido).

6. **Auditoria "resposta do cliente sem sequência"** — lista direta dos protocolos onde o cliente já respondeu e o colaborador não deu sequência há mais de X tempo, com data/hora da resposta do cliente e tempo parado. É a versão automática da auditoria que hoje é feita manualmente.

Complementos úteis:
- volume de conversas por assunto previdenciário;
- total de pendentes vs. resolvidas ao longo do tempo;
- protocolos por status (Ativo/Finalizado) e por departamento.

---

## Elementos transversais (todas as visões)

- **Filtros:** por status, departamento, colaborador, assunto previdenciário, período, tag.
- **Busca:** por telefone, nome ou número de protocolo.
- **Visão do cliente (360º):** ao abrir um cliente, ver **todos os seus protocolos** em ordem cronológica (aproveitando a hierarquia cliente → protocolos → mensagens), com anexos e responsáveis de cada um.
- **Indicador de saúde da extração:** um aviso visível se a última rodada de extração falhou (lido de `extracao_log`), para o problema não passar despercebido.

---

## Atualização dos dados

Nesta fase, o painel reflete o que está no Supabase, atualizado a cada rodada de extração/captura incremental (não é streaming em tempo real literal). A frequência de atualização é configurável conforme a estabilidade da captura for confirmada.

---

## Observação sobre a fatia de teste

Na validação inicial (20 protocolos — Documento 6), o painel já deve renderizar essas visões, mesmo que com poucos dados. É assim que se confirma que o modelo de dados alimenta o painel corretamente antes de escalar.
