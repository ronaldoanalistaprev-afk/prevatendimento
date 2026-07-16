# AtendeIA Previdenciário — Especificação da Extração

Extração dos dados históricos do Multi360 (~2.000 protocolos). Organizada em três camadas independentes, da mais leve para a mais pesada. Cada camada pode ser executada e validada separadamente.

O Multi360 **não tem API**. Os métodos abaixo usam (A) exportação nativa de relatório e (B/C) leitura do HTML renderizado.

---

## Contexto da plataforma (o que já foi mapeado)

**Tela de atendimento** (uma conversa por vez):
- Cabeçalho: nome do cliente + telefone.
- Corpo: mensagens com remetente nomeado, texto, horário. Balão azul/direita = enviado (colaborador ou "Bot"); balão branco/esquerda = recebido (cliente).
- Painel direito: número do **Protocolo**, contadores **Atendimentos** e **Mensagens**, aba **Participantes** (contém o **Responsável**), e **Arquivos Compartilhados** / **Imagens Compartilhadas** com os anexos (links de .pdf, .mp3, imagens).
- O histórico longo exige **rolagem para baixo/para cima** para carregar todas as mensagens (lazy-load).

**Tela de relatório/busca** (a chave da Camada A):
- Filtros: Canal, Origem, Protocolo, Número, Nome, Status, Atendentes, Departamentos, Motivos, Datas (criação, última mensagem, finalização), Tags.
- Retorna tabela com: Status, Protocolo, Canal, Contato (nome+telefone), Atendente + Departamento, Data de Criação, Data da Última Mensagem, Data de Finalização, Avaliação, Tags.
- Filtrando por **Número**, retorna **todos os protocolos daquele cliente** (ativos e finalizados).
- Botão verde de **download** (exportação) exige um **período** preenchido (senão retorna erro 400 "Informe um período para filtrar o relatório").
- Sem filtro de telefone, lista todos os protocolos paginados (botão "MAIS" para carregar as próximas páginas).

---

## Camada A — Metadados (lista mestre de protocolos)

**Objetivo:** obter a lista completa dos ~2.000 protocolos com seus metadados, sem ler mensagens.

**Método preferencial — exportação nativa:**
1. Abrir a tela de relatório.
2. Definir **Status = Todos**.
3. Preencher **Data de Criação (de/até)** com um intervalo amplo (ex: 01/01/2020 até hoje). Se houver limite de volume por exportação, fatiar por período (ano a ano, ou semestre a semestre).
4. Clicar no botão verde de download.
5. Guardar o arquivo exportado. **(A confirmar: formato do arquivo — CSV ou XLSX.)**

**Importação para o Supabase:**
- Ler o arquivo e popular `clientes` (por telefone, criando se novo), `colaboradores` (pelo Atendente), `protocolos` (um por linha), `tags` e `protocolo_tags`.
- Deduplicar clientes por telefone e colaboradores por nome.
- Registrar a rodada em `extracao_log` (camada = "A").

**Fallback (se a exportação não servir):** raspar a tabela da tela, clicando em "MAIS" para paginar até o fim, lendo cada linha. Mais lento, mas mesmo resultado.

**Resultado da Camada A:** o "esqueleto" completo — todo cliente, todo protocolo, responsável, departamento, status e datas — sem nenhuma mensagem ainda.

---

## Camada B — Conteúdo das mensagens

**Objetivo:** para cada protocolo, capturar o texto das mensagens.

**Método (leitura de HTML, via Playwright):**
1. A partir da lista de protocolos do Supabase (Camada A), iterar protocolo a protocolo — priorizando por ordem definida no plano (ativos primeiro; ver Documento 6).
2. Abrir o protocolo. A forma mais robusta de localizar o protocolo exato: buscar pelo **telefone** e, quando o cliente tiver múltiplos protocolos, selecionar pelo **número do protocolo** (via os "3 pontinhos" da linha na tela de busca, ou navegando pela conversa correspondente).
3. **Rolar até o topo** para forçar o carregamento de todo o histórico (lazy-load), depois percorrer de cima para baixo.
4. Para cada mensagem, capturar: remetente (nome), tipo (cliente / colaborador / bot — inferido pela direção do balão e pelo nome), texto, horário, e se tem anexo.
5. Ler a aba **Participantes** para confirmar o **Responsável** do protocolo e vincular em `protocolos.responsavel_id`.
6. Gravar as mensagens em `mensagens` (com campo `ordem` preservando a sequência).
7. Atualizar `protocolos.ultima_mensagem_direcao` conforme a última mensagem (base da regra "quem falou por último" — Documento 4).
8. Registrar em `extracao_log` (camada = "B", por protocolo).

**Cuidados:**
- Mensagens só de mídia (áudio/imagem sem texto) entram com `texto = null` e `tem_anexo = true`.
- Reações ("Fulano reagiu com 🙏") podem ser ignoradas ou registradas como metadado — não são mensagens.
- Mensagens do "Bot" entram com `remetente_tipo = bot`.

---

## Camada C — Mídia seletiva

**Objetivo:** baixar apenas o que tem valor previdenciário provável, sem inchar o storage.

**Regra de decisão:**

| Tipo | Ação | Motivo |
|------|------|--------|
| PDF | Baixar para o Supabase Storage | Documento previdenciário de alto valor (procuração, CNIS, laudo, PPP) |
| Imagem | Baixar para o Supabase Storage | Pode ser documento fotografado; classificar/filtrar depois |
| Áudio (.mp3) | Só registrar (nome + link), **não** baixar | Raramente relevante; arquivo pesado |
| Outros | Só registrar (nome + link) | Avaliar caso a caso |

**Método:**
1. A partir de **Arquivos Compartilhados** e **Imagens Compartilhadas** de cada protocolo, ler o nome e o **link de origem** de cada anexo.
2. Gravar todos em `anexos` (inclusive áudios), com `link_origem` sempre preenchido.
3. Para PDF e imagem: baixar o arquivo pelo link e salvar no Supabase Storage; preencher `storage_path` e `baixado = true`.
4. Para áudio/outros: `baixado = false` (link fica guardado para download sob demanda futuro).
5. Registrar em `extracao_log` (camada = "C").

**Nota:** nenhum arquivo é perdido de forma irreversível — mesmo os não baixados mantêm o link. Um passo futuro de IA poderá classificar imagens (documento vs. descartável) e transcrever áudios sob demanda.

---

## Ordem de execução recomendada

1. **Camada A** completa (ou da fatia de teste) → Supabase.
2. **Camada B** sobre os protocolos já em base.
3. **Camada C** sobre os mesmos protocolos.

Para a validação inicial, tudo isso roda primeiro sobre **20 protocolos** (Documento 6), e só depois é aberto para os ~2.000.

---

## Pontos a confirmar antes de rodar em escala

- Formato exato do arquivo exportado na Camada A (CSV/XLSX) e se há limite de linhas por exportação.
- Se a busca por telefone + seleção por número de protocolo é o caminho mais estável para abrir o protocolo exato na Camada B.
- Estabilidade da sessão logada durante execuções longas (sessão caindo, necessidade de novo login/2FA).
