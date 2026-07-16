# AtendeIA Previdenciário — Guia de Setup do Ambiente (para leigo)

Este documento orienta o Claude Code a conduzir Ronaldo — que **nunca mexeu em servidor, programação ou Hostinger** — desde o zero absoluto até o ambiente pronto para construir o projeto.

**Regra de ouro para o Claude Code:** um passo de cada vez, dizendo exatamente onde clicar e o que digitar, e confirmando o que ele deve ver depois de cada passo. Nunca presuma que ele sabe algo técnico.

Este guia descreve **o que** precisa acontecer, na ordem certa. O Claude Code deve traduzir cada etapa em instruções miúdas e acompanhar Ronaldo em tempo real.

---

## Visão geral (explicar a Ronaldo em linguagem simples)

Antes de qualquer comando, vale explicar a ele, sem jargão, o que vai acontecer:

- **VPS** = um computador que fica ligado o tempo todo na internet, alugado por mês. É onde o projeto vai "morar" para funcionar sozinho, sem depender do computador dele.
- **Claude Code** = a ferramenta que realmente escreve e roda o projeto dentro desse computador.
- **Supabase** = onde os dados das conversas vão ficar guardados (o "banco de dados") e os arquivos (PDFs, imagens).
- **Multi360** = de onde os dados são lidos.

O caminho é: alugar o VPS → preparar o VPS → instalar o Claude Code nele → conectar ao Supabase → começar a construir.

---

## Etapa 1 — Criar a conta e o VPS na Hostinger

Ronaldo ainda não tem conta. Conduzir:

1. Criar conta na Hostinger.
2. Escolher um plano de **VPS** (não hospedagem compartilhada — VPS). O Claude Code deve indicar um porte inicial adequado (ex: KVM com pelo menos 4 GB de RAM, para dar conta de navegador headless) e explicar em uma frase por quê.
3. No momento de escolher o sistema operacional, selecionar **Ubuntu** (uma versão recente com suporte). Explicar que é o "tipo de sistema" do servidor.
4. A Hostinger vai pedir para criar uma **senha de root** (a senha principal do servidor) — orientar a guardar num gerenciador de senhas, não em papel solto, e **não colar em chat**.
5. Ao final, a Hostinger mostra o **endereço IP** do VPS. Explicar que é como o "endereço" do computador na internet, e que ele vai precisar dele.

> Observação: a Hostinger costuma ter um modelo/template relacionado ao Claude Code. Se existir e estiver disponível, o Claude Code deve avaliar usá-lo para encurtar a instalação — mas sempre explicando cada passo a Ronaldo.

**Decisão que é de Ronaldo (negócio/dinheiro):** qual plano/custo mensal aceitar. O Claude Code recomenda o porte técnico; Ronaldo decide o quanto gastar.

---

## Etapa 2 — Conectar ao VPS

Ronaldo nunca usou terminal nem SSH. Conduzir com muito cuidado:

1. Explicar o que é o **terminal** (uma tela onde se digitam comandos) e o que é **SSH** (a forma de entrar no VPS a partir do computador dele).
2. Indicar como abrir o terminal no sistema dele (o Claude Code deve perguntar se ele usa Windows ou Mac — essa é uma pergunta que ele sabe responder — e adaptar).
3. Ensinar o comando de conexão usando o IP e a senha de root, mostrando exatamente o que ele deve ver quando conectar com sucesso.
4. Antecipar o aviso de "primeira conexão" (fingerprint) e dizer o que responder.

> Se a conexão por terminal se mostrar difícil demais para ele, o Claude Code pode orientar o uso da **console do navegador** que a própria Hostinger oferece (acesso ao VPS direto pelo site, sem instalar nada) como alternativa mais simples.

---

## Etapa 3 — Preparar o VPS (instalar o necessário)

Tudo isto o Claude Code conduz comando a comando, explicando cada um em uma linha:

1. Atualizar o sistema do VPS.
2. Instalar o **Node.js** (a base para rodar o projeto).
3. Instalar o **Claude Code** no VPS.
4. Instalar o **Playwright** e as **dependências de navegador headless** no Linux (bibliotecas que o Chrome invisível precisa para funcionar num servidor sem tela). Este ponto costuma exigir pacotes extras no Ubuntu — o Claude Code deve tratar isso, não Ronaldo.
5. Instalar o **tmux** (programa que mantém o projeto rodando mesmo depois que ele fecha o terminal) e explicar, em uma frase, para que serve.

Ao final de cada instalação, confirmar com um teste simples se aquilo ficou instalado, e dizer a Ronaldo o que ele deve ver.

---

## Etapa 4 — Autenticar o Claude Code

1. Conduzir o login/autenticação do Claude Code no VPS (associando ao plano de Ronaldo).
2. Explicar o que está acontecendo em linguagem simples.

---

## Etapa 5 — Criar o projeto no Supabase

1. Explicar o que é o Supabase (banco de dados + storage de arquivos) em uma frase.
2. Conduzir a criação da conta e de um novo projeto no Supabase.
3. Guardar as chaves de acesso do Supabase **no VPS**, no arquivo `.env` (ver Etapa 6), nunca em chat.
4. O Claude Code cria as tabelas conforme o **Documento 02 — Modelo de Dados**.

---

## Etapa 6 — Configurar as credenciais com segurança (`.env`)

1. Explicar o que é o arquivo **`.env`**: um arquivo escondido onde ficam as senhas e chaves, que o programa lê, mas que **nunca** é compartilhado nem colado em lugar nenhum.
2. O Claude Code cria o `.env` no VPS e ensina Ronaldo a **colar os valores reais ali dentro, no próprio servidor** (login do Multi360, chaves do Supabase). Os valores reais nunca aparecem nos documentos nem no chat.
3. Reforçar: se possível, criar um **usuário dedicado no Multi360 só para a automação**, em vez da senha de gestor de Ronaldo.

---

## Etapa 7 — Manter rodando 24/7

1. Explicar (uma frase) por que o projeto precisa continuar rodando mesmo com o computador dele desligado — é para isso que serve o VPS + tmux.
2. Configurar a execução contínua e ensiná-lo a, quando quiser, reconectar ao VPS e ver como está.

---

## Depois do setup

Com o ambiente pronto, seguir para o **Documento 06 — Plano de Fatia de Teste (20 protocolos)**. O Claude Code conduz a construção; Ronaldo valida se a solução resolve o problema previdenciário — sem precisar entender o código.

---

## Lembretes permanentes para o Claude Code

- Ronaldo é **leigo total** em tudo que for técnico. Paciência e passo a passo sempre.
- Decisões técnicas são suas; leve a ele apenas decisões de **negócio** ou de **custo**.
- Nunca peça senha em chat; credenciais só no `.env`, dentro do VPS.
- Confirme o resultado esperado a cada passo, para ele saber se deu certo.
- Se algo der errado, assuma que pode ter sido um tropeço comum de iniciante e ajude a diagnosticar com calma, sem culpar.
