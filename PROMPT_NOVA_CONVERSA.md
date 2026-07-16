# Prompt para iniciar uma conversa nova no Claude Code

Atualizado em **16/07/2026**. Copie tudo abaixo da linha e cole como primeira mensagem.

---

Sou o Ronaldo, advogado previdenciário e **leigo total em tecnologia** — fale comigo em português simples, sem jargão, e me explique o "porquê" de cada coisa antes de fazer.

Estamos continuando o **PrevAtendimento** (pasta `D:\Projetos\SIAP\PrevAtendimento`), do ecossistema SIAP.

**ANTES DE RESPONDER QUALQUER COISA:**

1. Leia a memória do projeto em `C:\Users\Usuario\.claude\projects\D--Projetos-SIAP-PrevAtendimento\memory\prevatendimento-projeto.md` — ela tem TODO o histórico, as decisões e os números. **Leia o arquivo inteiro** (ele é longo e o começo é história antiga; o que vale para hoje está no fim, nos blocos que começam com `>>>`). Não me peça para reexplicar o projeto.
2. Leia `D:\Projetos\SIAP\Documento Mestre de Padronização.txt` (as 39 regras obrigatórias de todo SaaS do SIAP) e o `README.md` do projeto.
3. Religue as duas coisas que param quando eu fecho o Claude Code, **em segundo plano**:
   - as telas: na pasta `web`, `npm run dev` (é **webpack de propósito** — Turbopack trava esta máquina; porta 3000);
   - o leitor: na pasta `multi360-reader`, `node index.js` (laço de 15 em 15 min; traz conversas novas, resolve cobranças e recalcula as métricas).
   - Depois me confirme que os dois subiram e a hora da última sincronização (`node multi360-reader/ultima-sync.js`).

**REGRAS DE SEGURANÇA (não negocie comigo isso):**
- Nunca me peça senha, e-mail ou credencial no chat. Credenciais ficam só no `.env`. Você não digita minha senha, então não consegue entrar no sistema logado — **quem testa as telas sou eu**.
- Os dados são sensíveis (LGPD): ~457 mil mensagens reais de clientes.
- **Antes de aplicar qualquer SQL, rode `mcp__supabase__get_project_url`.** Tem que voltar `cgnudnxivpeyzcurdzkt` (PrevAtendimento). Se voltar `gwctwcqaciamwxewqjwq`, é o **PrevFinanças** — pare, porque a pasta-mãe `D:\Projetos\SIAP\.mcp.json` aponta para lá e o projeto herda.

**ONDE PARAMOS (16/07/2026):**

O sistema está pronto e funcionando **no meu computador**. Espelha o Multi360 no Supabase: 4.460 protocolos, 2.792 clientes, ~457 mil mensagens. Telas prontas: Início (painel do gestor), Monitor, Auditoria, Cobranças (com modelos de texto, CRUD e métricas), Desempenho, Colaboradores, Configurações (Papéis, Permissões, Modelos, Catálogo).

**O que os dados já provaram** (não repita esse trabalho, está tudo na memória):
- **319 clientes sem resposta há +24h**; **179 esquecidos há +60 dias**.
- O problema **não é demora**: a mediana de resposta é ~20 minutos e está estável há 4 anos. O problema é **abandono** — 1 em cada 3 clientes não recebe resposta em 24h.
- A cobertura despencou de **78,3% (nov/2025) para 63,4% (dez/2025)** e nunca voltou (hoje ~66%). **Causa: saíram duas pessoas** e a carteira delas foi redistribuída. Por isso o `atendente_nome` é quem tem a conversa **agora**, não quem a atendeu — **o ranking por atendente é injusto e não serve para cobrar ninguém**.
- **Nunca use média** de tempo de resposta (dá ~15h; a mediana dá ~20min). Use **% respondido em 24h**.

**A DECISÃO EM ANDAMENTO — PUBLICAR (é o portão de tudo):**

Hoje só eu acesso o sistema. A equipe não entra, o supervisor não existe no sistema, os dados congelam quando desligo o PC, e a API oficial do WhatsApp não tem onde entregar mensagem. Escolhi o caminho: **Vercel Pro** (as telas, ~US$20/mês, cobre também o PrevFinanças) + **Railway** (o leitor, ~US$5/mês) + **Supabase** (o banco, já pago). ~R$131/mês de novidade.

Já está feito: o projeto virou repositório git na raiz (commit `9900cd0`, 139 arquivos), com `.gitignore` auditado — nenhuma senha vai junto (`.env`, `.mcp.json` e a sessão do WhatsApp ficam fora), e existem `.env.example` em `web/` e `multi360-reader/` listando o que cada servidor precisa.

**O QUE VOCÊ DEVE ME PEDIR AGORA, NESTA ORDEM:**

1. **O endereço do repositório no GitHub.** Eu preciso criar em github.com: nome `prevatendimento`, **Private**, sem README. Me cobre isso — sem ele você não faz nada. (Eu já tenho GitHub: `ronaldoanalistaprev-afk`, e o PrevFinanças já está lá.)
2. Aí você liga o repositório e envia o código (`git remote add` + `push`). **Vai abrir uma janela do GitHub pedindo minha autenticação** — é esperado (`credential.helper=manager`); eu aprovo.
3. Depois me guie na **Vercel**: importar o repo, **Root Directory = `web`**, região São Paulo, e colar as variáveis (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_SECRET`, `WHATSAPP_SERVICE_URL`). **Eu colo os valores** — eles estão no meu `web/.env.local`.
4. E na **Railway**: novo serviço do mesmo repo, **Root = `multi360-reader`**, comando `node index.js`, variáveis (`MULTI360_TOKEN`, `MULTI360_BASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EMPRESA_SLUG=aposentar`, `POLL_INTERVAL_MIN=15`).
5. Publicado: **eu crio os logins da equipe** (tela Colaboradores — eu digito e-mails e senhas lá, nunca no chat) e o supervisor usa por uma semana. **Só então** o painel consegue responder se colocar gestor e supervisor deu resultado.

**COMBINAÇÕES ANTIGAS QUE VOCÊ DEVE ME LEMBRAR (eu já adiei duas vezes):**
- **O teste dos 5 casos reais na Auditoria.** Caso 1 = **Eraldo José de Moura Ferreira, protocolo 534808401**, atendente Breno Tavares, parado há ~58 dias. A pergunta do teste: a tela me dá o que preciso para agir? Eu já criei 1 cobrança de verdade (15/07). Se eu tentar fugir para melhoria de tela, me lembre disto.
- **O colaborador fictício** para testar permissões: 1 Supervisor + 1 Colaborador vinculado a um atendente pequeno (Yago, 8 abertas). Adiável — e melhor fazer já publicado, testando do celular.

**O QUE NÃO FAZER AGORA:**
- Refazer o teste do WhatsApp próprio com Baileys: o ciclo **já foi provado** em 08/07 e não resolve o problema do telefone (`@lid`), que é meu critério de abandono. A API oficial da Meta **depende de publicar** — mesma decisão do item acima. Vou providenciar um chip novo, e devo mantê-lo **virgem** (sem instalar WhatsApp).
- Polir tela (P2/P3 do agente de UI/UX) antes de a equipe usar o sistema.
- Migrar do Multi360.

**AGENTES:** `padronizacao-siap` (guardião das 39 regras) e `ui-ux-siap` (quando eu pedir para melhorar uma tela). Confirme que os dois carregaram.

**COMECE AGORA:** leia a memória e o Documento Mestre, religue as telas e o leitor, me confirme que está tudo no ar e a hora da última atualização — e então me peça o endereço do repositório no GitHub.
