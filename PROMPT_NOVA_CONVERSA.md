# Prompt para iniciar a nova conversa no Claude Code

Copie tudo abaixo da linha e cole como primeira mensagem.

---

Sou o Ronaldo, advogado previdenciário e **leigo total em tecnologia** — fale comigo em português simples, sem jargão, e me explique o "porquê" de cada coisa antes de fazer.

Estamos continuando o projeto **PrevAtendimento** (pasta `D:\Projetos\SIAP\PrevAtendimento`), parte do ecossistema SIAP.

**Antes de responder qualquer coisa, faça isto:**

1. Leia a memória do projeto em `C:\Users\Usuario\.claude\projects\D--Projetos-SIAP-PrevAtendimento\memory\prevatendimento-projeto.md` — ela tem TODO o histórico, as decisões e os números. Não me peça para reexplicar o projeto.
2. Leia `D:\Projetos\SIAP\Documento Mestre de Padronização.txt` (as 39 regras obrigatórias de todo SaaS do SIAP).
3. **Religue as duas coisas que precisam estar no ar** (pararam quando reiniciei o Claude Code):
   - o servidor: na pasta `web`, rodar em segundo plano `npm run dev` (é webpack de propósito — Turbopack trava nesta máquina por falta de memória; a porta é a 3000);
   - o leitor do Multi360: na pasta `multi360-reader`, rodar em segundo plano `node index.js` (loop de 15 em 15 minutos, traz as conversas novas e resolve cobranças automaticamente).
   - Depois me confirme que os dois subiram e qual foi a hora da última sincronização.

**Regras de segurança que você deve respeitar (não negocie comigo isso):**
- Nunca me peça senha, e-mail ou credencial no chat. Credenciais ficam só no `.env`. Você não digita minha senha, então **não consegue entrar no sistema logado** — quem testa as telas sou eu.
- Os dados são sensíveis (LGPD): ~149 mil mensagens reais de clientes.

---

## O que já está pronto (não precisa refazer)

O sistema espelha **todo o Multi360** no nosso banco (Supabase): 4.453 protocolos, 2.792 clientes, 149.296 mensagens. Telas prontas e funcionando: **Monitor**, **Auditoria**, **Cobranças**, **Desempenho**, **Colaboradores**, **Configurações** (com Permissões e Catálogo Previdenciário). Papéis definidos: Admin (eu), Gestor, Supervisor, Colaborador.

## O ponto em que paramos

Na sessão anterior eu perguntei "o que devo fazer?" e a recomendação foi clara e eu concordei:

> **Pare de construir e comece a usar.** O sistema já achou o problema real — **297 clientes sem resposta há mais de 24 horas**, sendo **160 esquecidos há mais de 60 dias** (alguns desde 2023). Mas o sistema tem **zero usuários reais**: ninguém da equipe nunca entrou. Continuar polindo tela é lapidar algo que ninguém usa.

## O que você deve me pedir AGORA, nesta conversa

Assim que o servidor e o leitor estiverem no ar, **me conduza no teste dos 5 casos reais**. Não me deixe escolher outra tarefa antes disso — se eu tentar mudar de assunto para melhorias de tela, me lembre desta combinação.

O teste é assim:
1. Me diga para abrir `http://localhost:3000` e entrar na tela **Auditoria**.
2. Me oriente a pegar **5 clientes reais** da lista de quem está sem resposta e tentar, de verdade, resolver cada um (ver o histórico da conversa, entender o que o cliente pediu, decidir o que fazer, e usar o botão **Cobrar** quando for o caso).
3. Para cada caso, me pergunte especificamente:
   - A informação na tela foi **suficiente para você agir**, ou faltou alguma coisa?
   - O que te fez perder tempo?
   - O que você quis fazer e a tela **não deixou**?
4. Vá anotando minhas respostas.

**Essa é a pergunta que o teste responde:** *a tela me dá o que preciso para agir?* Se sim, o sistema se pagou. Se não, aí sim descobrimos o que consertar — com problema real, não com palpite.

## Depois do teste (nesta ordem, só depois)

1. **Consertar o que os 5 casos revelarem** (isso tem prioridade sobre qualquer lista antiga de melhorias).
2. **Decidir a publicação (deployment)** — é o que destrava tudo o que é real. Hoje o sistema roda só no meu PC, o que significa: a equipe não acessa; os colaboradores não veem "Minhas cobranças" (o ciclo da cobrança não fecha); os dados congelam quando desligo o PC; e celular está fora de questão. Quando chegarmos aqui, **me explique as opções de hospedagem em linguagem simples, com os custos em reais**, para eu decidir com base em números.
3. Depois de publicado: eu crio os logins da equipe (pela tela Colaboradores — eu digito os e-mails e senhas lá, nunca no chat) e o supervisor usa por uma semana.

## O que NÃO fazer agora

- **P2/P3 do agente de UI/UX** (badge de cobrança no menu, histórico de cobranças resolvidas, filtros no Desempenho, etc.) — é acabamento antes de saber o que dói.
- **Migrar do Multi360** (construir nosso próprio WhatsApp) — são semanas de trabalho e risco na linha principal do escritório, para um sistema que a equipe ainda nem usou.
- **PWA / responsividade completa** — só faz sentido depois de publicar.

## Agentes disponíveis

Agora que o Claude Code reiniciou, dois agentes devem estar carregados — confirme e me avise se algum não aparecer:
- `padronizacao-siap` — guardião das 39 regras do Documento Mestre.
- `ui-ux-siap` — para eu chamar quando quiser melhorar uma tela ("usa o agente de UI/UX nessa tela").

---

**Comece agora:** leia a memória, religue o servidor e o leitor, me confirme que está tudo no ar e a hora da última atualização — e então me conduza no teste dos 5 casos da Auditoria.
