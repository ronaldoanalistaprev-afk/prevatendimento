# PrevAtendimento — arquivo de contexto permanente

> Lido automaticamente a cada sessão. Contém **fatos verificados e regras permanentes**, não plano de
> trabalho. Onde algo mudar, **atualize aqui** — este é a fonte da verdade sobre o que o projeto é.
> Fatos conferidos em código, banco e Vercel em **15–16/11/2026**. As regras gerais do ecossistema
> (Documento Mestre, Laboratório de Design, Supabase, Vercel, parsers, backup) estão no **CLAUDE.md
> global** (`E:\Projetos\_Claude\CLAUDE-global.md`); aqui fica só o que é do PrevAtendimento.

---

## 1. Identidade — leia antes de qualquer coisa

**Este projeto é o PrevAtendimento.** Central de atendimento multicanal (WhatsApp) do escritório
**Aposentar**, dentro do ecossistema SIAP. Objetivo: **parar de perder cliente por falta de resposta**
— mostrar quem falou por último, quem está esperando o escritório, cobranças e desempenho da equipe.

- Pasta: `E:\Projetos\SIAP\PrevAtendimento` (o app web fica em `web/`)
- Supabase: **`cgnudnxivpeyzcurdzkt`** (organização GALEÃO PRODUTOS DIGITAIS, plano Pro; painel
  `ronaldo.analista@hotmail.com`)
- Publicado na Vercel: **https://web-siap.vercel.app** (projeto `siap/web`, conta APOSENTAR)
- GitHub (único SaaS com remoto): `https://github.com/ronaldoanalistaprev-afk/prevatendimento.git`
- Responsável: **Ronaldo**, advogado previdenciário. Não é programador; ele testa as telas.

### O que este projeto É e o que NÃO é

O PrevAtendimento **hoje é um espelho do Multi360**: um leitor puxa as conversas de WhatsApp que
acontecem no **Multi360** (plataforma de terceiros) e grava no nosso banco, e as telas mostram isso
para gestor/supervisor/atendentes. **O PrevAtendimento NÃO envia nem finaliza mensagem** — quem faz
isso é a equipe dentro do Multi360. O sistema é o **painel/auditoria** do antes-e-depois.

- **NÃO é** sistema de processos/benefícios (isso é PrevSystem/PrevControl). O "cliente" aqui é só
  nome + telefone vindos do Multi360 — não tem CPF, cadastro previdenciário nem documentos.
- **NÃO lê e-mail** nem documentos do INSS. Importação de PDF do INSS é **capacidade futura**
  (ver seção 6 e a memória `parsers-inss-planejado`), não construída.

## 2. Estado real — nunca entrou em uso

**O PrevAtendimento NUNCA foi usado pela equipe em produção** (confirmado pelo Ronaldo em 15/11/2026:
*"nunca usamos o PrevAtendimento"*). Está publicado e funcional, mas sem uso real.

- **Sincronização RELIGADA (token renovado pelo Ronaldo por volta de 16–17/11/2026).** Em 18/11/2026 o
  sistema está no ar e sincronizando (última extração e mensagem do próprio dia; ~4.757 conversas,
  ~513 mil mensagens). Ficou parada de 06/08 a ~16/11 (o token vence sozinho em poucos dias). O leitor
  foi **reiniciado em 18/11 com o código novo** (captura de participantes) — ver seção 5.
- **Banco vivo** (`ACTIVE_HEALTHY` em 15/11; tinha pausado uma vez em agosto e foi restaurado).
- **Decisão do Ronaldo (15/11/2026):** religar e alinhar o projeto ao **padrão de construção do
  PrevSystem** (ver seção 5 — é o trabalho em andamento).

### ⚠️ Como religar a sincronização (passo que depende do Ronaldo)

O leitor (`multi360-reader/`) precisa de um **token do Multi360** válido no `.env` (`MULTI360_TOKEN`).
Ele vence sozinho em poucos dias; quando vence, a sincronização para em silêncio (o Monitor "congela"
na última data). Renovar: Ronaldo abre o Multi360 logado → **F12** → Console → `copy(JSON.parse(
localStorage['ngStorage-token']))` → cola o token aqui → eu troco no `.env`, reinicio o leitor
(`cd multi360-reader && npm run start:local`) e ele puxa o atraso. Diagnóstico: `node ultima-sync.js`.
(A leitura automática do token pelo navegador é **bloqueada** por segurança — por isso depende dele.)

## 2-A. TRAVA: estado vivo vence memória e CLAUDE.md (Ronaldo, 18/11/2026)

Em 18/11/2026 afirmei que a sincronização estava parada desde 06/08 e que o token tinha vencido, quando outra conversa
já tinha renovado o token ~16-17/11 e o sistema estava no ar. Eu tinha lido o estado numa nota velha e não conferi.
**Regra:** antes de dizer ao Ronaldo que algo está parado, vencido, quebrado, pendente ou "não existe", conferir ao vivo:

1. **Sincronização:** `select max(executado_em) from at_extracao_log` e `select max(ultima_mensagem_em) from at_protocolos`
   (Supabase `cgnudnxivpeyzcurdzkt`), e `node multi360-reader/ultima-sync.js`. Processo do leitor: `Get-CimInstance Win32_Process -Filter "Name='node.exe'"`.
2. **Publicação:** `vercel ls` / `vercel inspect` (o que está no ar), não "o que a memória diz".
3. **Banco/colunas:** consultar `information_schema`, não supor pelo SQL guardado em `sql/`.
4. **Outras conversas do projeto:** no começo da sessão, `list_sessions` filtrando `cwd` deste projeto; se houver conversa ativa
   nos últimos 3 dias, ler o final dela (transcrição) ou `git log -10` antes de afirmar o estado. Outra conversa pode ter mudado
   token, banco, deploy ou código sem eu saber.
5. **Datas:** `CLAUDE.md` e memória são fotografia datada. Ao citá-las, dizer a data ("segundo a nota de 16/11…") e conferir
   antes de agir. Informação sobre token/sincronização vale por horas, não por dias.

Memória e CLAUDE.md dizem onde procurar; **quem diz o estado é o banco e o processo rodando**.

## 3. Stack e estrutura

**Stack** (`web/package.json`): Next.js **16.2.6** (App Router) · React **19.2.4** · TypeScript 5 ·
`@supabase/ssr` 0.10.3 · Tailwind 4 (instalado, **quase não usado** — ver seção 5) · lucide-react ·
fontes Montserrat + Open Sans. Rodar em produção local: `cd web && npm run build && npm start`
(porta 3000; sem hot-reload — recompilar ao mudar). Publicar: `cd web && vercel --prod`.

```
web/                     o app (Next.js). Telas em src/app/dashboard/, loaders em src/lib/,
                         componentes ("ilhas" interativas) em src/components/
  src/proxy.ts           autenticação (no Next 16 o "middleware" chama-se proxy)
multi360-reader/         o LEITOR: lê a API interna do Multi360 e grava no Supabase (Node).
                         index.js = o leitor; ultima-sync.js = diagnóstico. Token no .env.
whatsapp-service/        gateway Baileys (WhatsApp não-oficial) — ENGAVETADO (deu ban). Reserva.
PROMPT_FRONTEND.md       como o front-end é feito hoje (inline styles) — para dar a outra conversa
```

## 4. Banco — o que existe

**Modelo vivo = espelho do Multi360, tabelas com prefixo `at_`:**
`at_clientes` (só id, telefone, nome, datas — **sem CPF/dados previdenciários**), `at_protocolos`
(as conversas; `status_multi360` ∈ ATIVO/AGUARDANDO/POTENCIAL = aberta, FINALIZADO = fechada;
`ultima_mensagem_direcao` = quem falou por último, o SLA do sistema), `at_mensagens`, `at_anexos`
(só links), `at_colaboradores`, `at_cobrancas`, `at_marco_zero`, `at_extracao_log`. Views `v_at_*`.

**Modelo CRI dormente:** `pessoas`/`identificadores`/`eventos`/`objetivos`/`missoes` (fases 1-3,
visão centrada na pessoa) existem no banco mas estão **vazias/sem uso**. É a base para o futuro
cadastro de cliente (quando o projeto crescer — inclusive para guardar documentos do INSS).

**Papéis:** ADMIN / GESTOR / SUPERVISOR / COLABORADOR (`lib/papel.ts`/`papeis.ts`). RLS por
`empresa_id` via funções SECURITY DEFINER (`at_ve_tudo()` etc.). Login do Ronaldo = ADMIN.

## 5. Metodologia — alinhando ao padrão do PrevSystem (desde 15/11/2026)

O PrevAtendimento foi feito "direto" (protótipo que cresceu), **sem** o método maduro do PrevSystem.
A decisão do Ronaldo é trazê-lo para o mesmo padrão. Situação de cada pilar:

- **[✓ feito] Arquivo de verdade:** este CLAUDE.md.
- **[✓ feito] Controle de versões:** o trabalho (3 meses sem commit) foi salvo no git. Baseline =
  marca `publicada-01` = o que está no ar na Vercel. Daqui em diante: a **versão publicada** (que a
  equipe usaria) só muda quando o **Ronaldo** manda publicar; o Claude trabalha na **versão em
  construção** e publica sozinho só a entrega aprovada pelo conferente (autorização de 18/11/2026, seção 5-A item 5). Segredos ficam fora do git
  (`.gitignore` confere: `.env*`, `.mcp.json`, `whatsapp-service/auth_state/`).
- **[✓ feito] Conferente independente:** agente `.claude/agents/conferente-prevatendimento.md` —
  acionado antes de dar algo por pronto (só lê e aponta; o maestro corrige).
- **[código concluído — falta só a FOTO (Regra 54)] Documento Mestre de Padronização:** auditar as
  telas contra as regras (`...\Documentos Globais\Documento Mestre de Padronização - versão 2.txt`) e
  registrar em `...\Conformidade do Documento Mestre.txt` (seção PrevAtendimento) e em
  `docs/conformidade-telas.md` (detalhe por tela). **Rodada 1 (16/11/2026):** Regra 43 (diálogos
  nativos → `web/src/components/Confirmacao.tsx`/`useConfirmacao`), Regra 23 (nome não corta com "…"),
  Regra 52 (ícones lucide), Regra 45 (Monitor separa "sem resultado" de "primeiro uso"). **Rodada 2
  (18/11/2026, com o conferente):** Regra 45 (esqueleto de carregamento `loading.tsx` + índices de
  desempenho), Regra 1 (etiquetas de filtro removíveis no Monitor e Auditoria), Regra 55 (helper
  `web/src/lib/formulario.ts` — Enter avança campo, Ctrl+Enter salva — nos 7 formulários de
  cadastro/edição; não no login nem na busca), Regra 57 (setor e atendente viraram seletor pesquisável
  de várias opções, `web/src/components/SeletorMultiplo.tsx`); Regras 48/52 conferidas (ok). **Único
  item de conformidade ainda aberto: Regra 54** (a foto/teclado no aparelho, 390/1440/320 px — depende
  do Ronaldo abrir as telas). Lista em `docs/conformidade-telas.md`.
- **[18/11/2026] Participantes da conversa + tempo de espera (decisão "só mostrar" do Ronaldo):** a
  tela da conversa mostra o **responsável** (destacado) e os **participantes** adicionados, e traz o
  **tempo de espera** que só aparecia no Monitor ("Esperando há X"). O **gestor** pode acompanhar sem
  ser participante. Coluna `at_protocolos.participantes jsonb` (NULL até capturar); o leitor
  (`multi360-reader/`) preenche quando o **token do Multi360** for renovado (hoje vencido). Só
  exibição — não mexe em SLA nem cobrança.
- **[decidido 16/11/2026 — em andamento] Design: skill Apple Design.** O Ronaldo decidiu incluir o
  PrevAtendimento na exceção da skill Apple Design (*"vamos usar nesse e no PrevControl o Apple
  Design"*). A skill está instalada em `.claude\skills\apple-design` (idêntica à do PrevSystem).
  **Ponto de partida:** as 15 telas da Apple Design na rodada do PrevSystem, em
  `E:\Projetos\SIAP\Laboratório de Design\entregas\prevsystem\` (mesmo escritório, mesma base). O visual
  "na mão" de hoje (estilos inline) é **refeito com a Apple Design, a começar pelo Monitor** (tela mais
  usada). Regras que não mudam: o Documento Mestre vence a skill; **não se inventa aparência fora da
  skill**; o Ronaldo aprova pela **foto** (390/1440/320 px — Regra 54); texto com trava jurídica e regra
  previdenciária não mudam por design. (Isto substitui o antigo "pende decisão do Ronaldo".)
  - **Como aplicar:** a folha `web/src/app/apple-design.css` (cópia do `estilo.css` do PrevSystem) é
    global (importada no root layout, com a fonte Inter). O pacote de referência fica em
    `docs/apple-design/` (estilo.css, comportamento.js, monitor-referencia.html + fotos).
  - **Progresso: front-end INTEIRO convertido em 16/11/2026** ✅ — não há mais tela no visual antigo.
    Casca (menu lateral + topo do celular), Entrar, Nova senha, Início, Monitor (+ conversa aberta),
    Ações, Desempenho, Auditoria, Cobranças (+ Nova cobrança, Cobrar atendente, Ações da cobrança),
    Colaboradores (+ acessos, cadastro, sem-conversa), Configurações e todas as sub-telas (Situação,
    Permissões, Papéis, Modelos, Catálogo), Marco Zero, Minha conta, Laboratório WhatsApp, Pessoas; a
    janela de confirmação do sistema e todos os filtros/avisos. Build limpo. **`UsuarioLogado.tsx`
    ficou órfão** (o rodapé do menu passou a ser inline no `Sidebar`) — dá para apagar.
  - **18/11/2026: auditoria tela a tela e correção** (`docs/auditoria-ux-apple-2026-11-18.md`, 93 achados), publicada como `publicada-02`. Peças comuns: `components/AvisoPe.tsx` (aviso do pé com Desfazer — toda ação nova usa), `components/SemPermissao.tsx`, classes `.chip`/`.avatar`/`.grade-numeros`. Tela nova já nasce com elas.
  - **Falta ainda (pós-conversão):** a conferência na FOTO pelo Ronaldo (Regra 54, 390/1440/320 px) e
    os itens de comportamento que a Rodada 1 do Documento Mestre deixou abertos (esqueleto de
    carregamento = Regra 45; Enter avança campo nos formulários = Regra 55) — ver
    `docs/conformidade-telas.md`.
- **[⚠️ pende "sim" do Ronaldo — custa ~US$ 10/mês] Banco-rascunho:** cópia de teste do banco (branch
  Supabase) como o PrevSystem tem. Não criar sem o OK dele (regra de custo do CLAUDE global).

## 5-A. Método de construção — o mesmo do PrevSystem (Ronaldo, 18/11/2026)

Pedido do Ronaldo: *"pergunte ao PrevSystem quais metodologias de construção estamos usando lá … e aplique aqui a todo o
projeto, desde o início e de agora em diante"*. O que vale aqui, em ordem de uso:

1. **Maestro e ajudantes.** O Claude da conversa é o único interlocutor do Ronaldo e coordena. Ajudantes só quando rendem:
   - o **conferente independente** (`conferente-prevatendimento`), antes de dar algo por pronto;
   - o `conferente-de-dados` global, quando o projeto passar a ler documento;
   - subagentes para leitura longa ou trabalho paralelo, que devolvem o resultado ao maestro;
   - **conversas laterais** para tarefa própria e longa, com o ícone ⚫ no nome.
2. **Memória que não se perde** (o "fio" entre conversas):
   - **Ao abrir conversa:** ler este arquivo, o índice da memória e a **última seção** de `estado-do-projeto.md` (memória).
     Ler também `docs/pendencias-do-ronaldo.md` e o `docs/continuar-na-prevatendimento-NN.md` mais recente. Depois, `git log -10`,
     a lista de conversas deste projeto (`list_sessions`, pasta deste projeto) e a **conferência ao vivo da seção 2-A**. Só então
     dizer ao Ronaldo, em poucas linhas, onde as coisas estão.
   - **Durante:** decisão nova vai na hora para `docs/decisoes.md` (DA-xx; o número nunca muda; a substituída fica marcada).
     Pendência dele vai para `docs/pendencias-do-ronaldo.md` e só sai resolvida. Automação, aviso ou trava vai para
     `docs/gatilhos-e-automacoes.md`.
   - **Ao fechar ou trocar de conversa (comando 111 ou 222):** acrescentar uma seção datada ao fim de `estado-do-projeto.md` com
     onde parou, o que está rodando e o que falta. Escrever `docs/continuar-na-prevatendimento-NN.md` com a primeira mensagem
     pronta para a conversa nova, e fazer o commit. **Nada fica só na conversa.**
3. **Regra-mãe: automatizar, avisar ou impedir** (NR-95 do PrevSystem). Toda tela ou etapa nova passa pelas três perguntas e
   entra em `docs/gatilhos-e-automacoes.md`.
4. **Banco:**
   - toda mudança vira arquivo em `sql/`, com data, motivo e como reverter;
   - só acrescenta, e é compatível com a versão no ar;
   - consulta lenta se mede antes e depois (`pg_stat_statements`, `explain analyze` como usuário logado);
   - o banco-rascunho espera o "sim" do Ronaldo (custo).
5. **Versões — autorização permanente de 18/11/2026 (DA-61):** o Claude **publica sozinho** na Vercel (`vercel --prod`) toda entrega que o conferente aprovar, marca `publicada-NN` e avisa o Ronaldo depois; se der errado, volta à versão anterior. **Não** foram autorizados de forma permanente (continuam pedindo o "sim" a cada vez): mudança no banco de produção, banco-rascunho (custo) e apagar arquivos ou contas.
6. **"Sim" e "pronto" só com verificação** completa. Parte não verificada → a resposta é "não", dizendo o que falta. Pronto é
   o que foi conferido (Regra 54: foto em 390/1440/320 px; teclado).
7. **Perguntas ao Ronaldo:** uma por vez, completa, com opções numeradas, a sugerida primeiro e "Outra" por último
   (CLAUDE global).
8. **Aparência:** skill Apple Design sobre a base das 15 telas do PrevSystem (item "Design" da seção 5). Tela nova já nasce nela.

9. **Práticas que o PrevSystem confirmou em 18/11/2026** (resposta da "🟦 PrevSystem 19"):
   - **Teste de banco** sempre numa transação desfeita (`begin … rollback`), agindo como o usuário com
     `set_config('request.jwt.claims', …)` e `set local role authenticated`. Relatório só com contagens.
   - **Conferente em segundo plano**. Depois das correções, uma segunda leitura só dos acertos. Commit só depois.
   - **Contexto:** conferir o uso (`get_usage`) a cada entrega. Aos 70%, gravar o estado, avisar e propor a troca (comando 111).
   - **Pasta compartilhada:** cada conversa faz commit só dos próprios arquivos e nunca usa stash, reset ou troca de branch.
   - **Dado pessoal entre projetos** fica só em pasta fora do git. Recados levam só contagens e o caminho.
   - **Subagente** só para conferir ou para busca grande. **Conversa lateral** só quando o Ronaldo pede ou na troca de conversa.
   - `.gitattributes` com `*.sql eol=lf`.
   - **Vitrine** (telas reais com dados fictícios, sem login, para fotografar em 1440/390/320 px e medir rolagem lateral e toque
     < 44 px): o PrevSystem tem. Aqui ainda não existe — está na lista de construção.

## 6. Pendências operacionais

1. **Religar a sincronização** (token do Multi360 — seção 2). É o que destrava o sistema.
2. **WhatsApp próprio (Cloud API oficial da Meta):** construído (`lib/cloudwhatsapp.ts`, webhook em
   `api/whatsapp/cloud/webhook`), mas **travado** no passo do **SMS** (a Meta pediu um número antigo
   que o Ronaldo não tinha em mãos). Número real: Phone Number ID 1280898318429607. Token permanente
   (System User) ficou de ser gerado. Baileys engavetado (deu ban). Detalhe na memória.
3. **Parsers de PDF do INSS:** capacidade **futura** (não construir agora — não há cadastro para
   guardar). Specs na pasta global; ver memória `parsers-inss-planejado`.
4. **Decisão do Ronaldo:** banco-rascunho (seção 5). O design já foi decidido em 16/11/2026 (skill
   Apple Design — seção 5, em andamento).

## 7. Como trabalhar com Ronaldo

Vale o CLAUDE global ("Como conduzo o trabalho"): ele não programa (explique finalidade, não jargão;
trate por "você"); decisão técnica é do Claude, só volta a ele o previdenciário/jurídico/gosto visual
(e o visual vai como foto); uma coisa por vez; alerte antes de ação destrutiva. **Pendência que só
existe na conversa vira commit/memória antes de encerrar.**
