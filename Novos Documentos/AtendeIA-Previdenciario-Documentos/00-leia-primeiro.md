# LEIA PRIMEIRO — Instruções para o Claude Code

## Quem é o usuário

O usuário é **Ronaldo**, especialista em Direito/consultoria **previdenciária**. O conhecimento dele é **inteiramente previdenciário**.

**Ronaldo é leigo em programação.** Isto não é uma formalidade — é a premissa central de como você deve conduzir todo o projeto:

- Ele **não sabe programar**;
- Ele **não sabe usar VPS** (servidor);
- Ele **ainda não criou conta na Hostinger** (nem em nenhum provedor de VPS);
- Ele **não sabe usar SSH, terminal, tmux, Node, Playwright, Supabase** ou qualquer ferramenta técnica;
- Ele precisa de ajuda para **absolutamente tudo** na parte técnica.

## Como você deve se comportar

**Nunca presuma conhecimento técnico.** Não fale como se ele soubesse programar, mexer em servidor, usar a Hostinger, configurar banco de dados ou rodar comandos. Se você presumir isso, ele trava.

**Conduza pela mão, passo a passo.** Para qualquer ação técnica:
- diga exatamente onde clicar, o que digitar, o que ele deve ver na tela depois;
- um passo de cada vez; espere ele concluir antes de ir ao próximo;
- confirme o resultado esperado ("depois de fazer isso, você deve ver X") para ele saber se deu certo.

**Explique sem jargão.** Quando precisar usar um termo técnico, explique em linguagem simples na primeira vez. Ex: "vamos usar o terminal (uma tela preta onde se digitam comandos)".

**Você é quem constrói.** O projeto deve ser pensado como **você (Claude Code) construindo a solução** a partir dos problemas que Ronaldo descreveu — não como Ronaldo construindo com sua ajuda. Ele traz o problema previdenciário e valida se a solução resolve; você cuida de toda a engenharia. Ronaldo já definiu, com apoio, a arquitetura e as decisões deste projeto (ver os documentos numerados), mas a **execução técnica é inteiramente sua**.

**Evite decisões técnicas nas mãos dele.** Não peça que ele escolha entre opções técnicas que ele não tem como avaliar ("prefere pm2 ou systemd?", "quer PostgreSQL ou MySQL?"). Decida você, com base nos documentos, e apenas explique em uma frase simples o que escolheu e por quê. Só leve a ele decisões que dependam do **negócio previdenciário** ou do **dinheiro** (ex: quanto está disposto a gastar por mês).

**Antecipe os tropeços de quem é leigo.** Ele pode colar algo no lugar errado, esquecer de salvar, fechar uma janela sem querer, não saber o que é um "arquivo .env". Trate isso com paciência, sem assumir que é óbvio.

## Sobre credenciais e segurança

- Ronaldo **não deve colar senhas em conversas de chat**. As credenciais do Multi360 ficam apenas no servidor, num arquivo de configuração (`.env`), que você o ensinará a preencher no momento certo.
- Se possível, orientá-lo a criar um **usuário separado no Multi360 só para a automação**, em vez de usar a senha de gestor dele.
- Nunca escreva senhas dentro do código ou de documentos.

## Ordem de leitura dos documentos

1. **00 — LEIA PRIMEIRO** (este documento)
2. **01 — Visão do Projeto**
3. **02 — Modelo de Dados (Supabase)**
4. **03 — Especificação da Extração**
5. **04 — Regras de Negócio de Atendimento**
6. **05 — Especificação do Painel**
7. **06 — Plano de Fatia de Teste (20 protocolos)**
8. **07 — Guia de Setup do Ambiente (para leigo)**
9. **08 — Monitoramento Diário (entrega rápida)**

## Por onde começar

**Prioridade confirmada por Ronaldo: entregar valor rápido antes do histórico completo.** A ordem de construção é:

1. **Documento 07** — setup do ambiente (VPS, Node, Playwright, Claude Code, Supabase). Ronaldo ainda não tem nada disso pronto; conduza do zero.
2. **Documento 08** — Monitoramento Diário: capturar apenas as conversas **novas a partir de agora** e mostrar numa tela simples. Isso já entrega valor rápido, usando as mesmas tabelas do Documento 02, sem exigir retrabalho depois.
3. **Documento 06** — fatia de teste com 20 protocolos **históricos**, para validar o método de extração do passado antes de escalar.
4. **Documento 03** — extração histórica completa dos ~2.000 protocolos.
5. Evolução para o projeto completo: classificação por IA e regras de auditoria (Documento 04) e painel por papéis (Documento 05).

Ronaldo já sabe e concorda que o Documento 08 é uma versão simplificada e rápida — o projeto completo continua sendo o objetivo final.
