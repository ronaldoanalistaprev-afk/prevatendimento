> ⚠️ **DOCUMENTO HISTÓRICO — NÃO É O SISTEMA DE HOJE.**
> Escrito na fase de planejamento (julho/2026), **antes** da decisão de usar o Multi360.
> Ele descreve um WhatsApp próprio (Baileys/YCloud) que foi **engavetado**, e usa a palavra
> "Lead", que é **proibida** no projeto (o certo é "Pretenso Cliente").
> **Leia o `README.md`** para saber como o sistema realmente funciona.

# ✅ CHECKLIST EXECUTIVO - PRÓXIMOS PASSOS

## 📋 VOCÊ ESTÁ AQUI

Você tem:
✅ Planejamento técnico completo
✅ Guia de setup passo-a-passo
✅ Prompt master para Claude Code
✅ Schema SQL pronto
✅ Arquitetura detalhada

---

## 🚀 PRÓXIMAS 4 HORAS (HOJE)

### Passo 1: Setup Infraestrutura (1h 30min)

- [ ] Crie conta **YCloud** com seu email
  - https://app.ycloud.com/sign-up
  - Email: `ronaldo.analistaprev@gmail.com`
  - Obtenha API Key

- [ ] Registre número WhatsApp no YCloud
  - Número: `75 98841-0521`
  - Escaneie QR Code com outro WhatsApp

- [ ] Crie projeto **Railway**
  - https://railway.app
  - Login com GitHub
  - (Precisa ter conta GitHub, se não tiver crie)

- [ ] Crie projeto **Supabase** (ou use existente)
  - Obtenha credenciais (URL + Key)

**Resultado esperado:** Você tem 3 contas prontas + credenciais

---

### Passo 2: Preparar Claude Code (30 min)

- [ ] Abra seu **Claude Code** (ou Cursor/VS Code com extensão)

- [ ] Crie uma pasta nova:
  ```bash
  mkdir aposentar-atendimento
  cd aposentar-atendimento
  ```

- [ ] Copie os 4 arquivos que criei para essa pasta:
  1. `ARQUITETURA_SISTEMA_PREVIDENCIARIO.md`
  2. `GUIA_SETUP.md`
  3. `PROMPT_CLAUDE_CODE.txt`
  4. `sql_schema.sql`

- [ ] Abra o **Claude Code** nessa pasta

**Resultado esperado:** Claude Code está pronto para construir

---

### Passo 3: Executar Prompt Master (2h)

- [ ] No Claude Code, copie o conteúdo completo de `PROMPT_CLAUDE_CODE.txt`

- [ ] Cole no chat do Claude Code e mande assim:

```
[Cole o conteúdo inteiro do PROMPT_CLAUDE_CODE.txt aqui]
```

- [ ] Claude Code vai começar a construir tudo automaticamente

⏱️ **Tempo estimado:** 30-60 minutos (ele constrói enquanto você aguarda)

**Resultado esperado:** 
- ✅ Pasta `/backend` criada com Express + TypeScript
- ✅ Pasta `/frontend` criada com React + TypeScript
- ✅ Arquivos de configuração (package.json, tsconfig.json, etc)
- ✅ Estrutura de rotas
- ✅ Estrutura de componentes

---

### Passo 4: Setup Supabase (30 min)

- [ ] Abra seu projeto Supabase

- [ ] Vá para **SQL Editor**

- [ ] Crie uma nova query

- [ ] Copie **TODO** o arquivo `sql_schema.sql` e cole

- [ ] Execute (clique "Run")

**Resultado esperado:**
- ✅ Todas as tabelas criadas
- ✅ Views criadas
- ✅ Índices criados
- ✅ Usuários iniciais inseridos

---

## 📝 HOJE À NOITE (Resumo)

Se fez tudo acima, seu status é:

```
✅ YCloud configurado
✅ Railway pronto
✅ Supabase com tabelas (básicas, apenas para Fase 1)
✅ Backend gerado (estrutura - multi-atendimento)
✅ Frontend gerado (estrutura - dashboard de pendências)
✅ FASE 1 pronto para ser testado

⏳ FASE 2 (CRM Previdenciário) → Aguardando seu Briefing
```

---

## 🔄 FASES DO PROJETO

### FASE 1: MULTI-ATENDIMENTO (7 DIAS) ← VOCÊ ESTÁ AQUI
```
✅ Setup infraestrutura
✅ Backend + Frontend construído
✅ Webhook WhatsApp funcionando
✅ Rastreamento de SLA
✅ Dashboard de pendências
✅ Deploy em produção
```

**Resultado:** Sistema pronto para seus 11 colaboradores usarem

---

### FASE 2: CRM PREVIDENCIÁRIO (Semana 2-3) ← PRÓXIMO
```
⏳ Você preenche: BRIEFING_CRM_PREVIDENCIARIO_TEMPLATE.md
   (Com TODAS as informações do seu negócio previdenciário)

⏳ Claude Code lê tudo e constrói:
   ├─ Formulários de pré-contrato (conforme seus tipos)
   ├─ Funis de vendas (um para cada tipo de benefício)
   ├─ Checklist de acompanhamento (customizado por tipo)
   ├─ Campos de dados previdenciários (EXATOS do seu negócio)
   └─ Workflows de cada tipo de benefício

⏳ Integrado com o dashboard da Fase 1
```

**Resultado:** CRM que é ESPELHO 100% do seu negócio, sem chutes

---

---

## 🔧 AMANHÃ (Dias 1-2 da Construção)

### Completar Backend

Claude Code vai pediros para completar:

- [ ] Conexão com Supabase (testar)
- [ ] Webhook YCloud (implementar handlers)
- [ ] CRUD de contactos (endpoints)
- [ ] CRUD de conversas (endpoints)
- [ ] Autenticação magic link (gerador de tokens)
- [ ] Middleware de validação
- [ ] Testes rápidos (testar endpoints com curl)

**Quando Claude Code terminar:** Pedir para ele fazer testes

---

## 📱 DIAS 2-3 (Frontend)

Claude Code vai criar:

- [ ] Página de Login (magic link simples)
- [ ] Dashboard principal (métricas + conversas pendentes)
- [ ] Tela de conversa (detalhe + chat)
- [ ] Painel de gestor (opcional para MVP)

**Quando terminar:** Você consegue fazer login + ver dashboard

---

## 🚀 DIA 4-7 (Deploy e Testes)

- [ ] Executar `npm install` no backend
- [ ] Executar `npm run build` no frontend
- [ ] Conectar Railway (ele puxa do GitHub)
- [ ] Testar webhook (enviar mensagem WhatsApp)
- [ ] Convitar Breno e Bruna para testar
- [ ] Ajustes rápidos baseado em feedback

---

## 📋 FASE 2: CRM PREVIDENCIÁRIO (Depois do MVP)

### Quando fazer?
- ✅ Após Fase 1 estar funcionando (dia 7-10)
- ✅ Após testar com Breno e Bruna
- ✅ Após ter certeza que multi-atendimento resolve o problema de falta de resposta

### O que você precisa fazer?

1. **Preencher o BRIEFING** (arquivo: `BRIEFING_CRM_PREVIDENCIARIO_TEMPLATE.md`)
   - Para CADA tipo de benefício que trabalha
   - Com detalhes do funil, documentos, acompanhamento, checkpoints, etc.
   - Sendo ESPECÍFICO (não genérico)

2. **Passar para Claude Code**
   - Cola o briefing preenchido no chat
   - Claude Code lê e constrói CRM EXATAMENTE como você quer

3. **Testar e ajustar**
   - Fase 2 fica pronta em 7-10 dias
   - Testado com Breno e Bruna

### ⚠️ GARANTIA: NADA será chutado

Claude Code vai ler seu briefing e construir:
- ✅ EXATAMENTE os campos que você listou
- ✅ EXATAMENTE o funil que você descreveu
- ✅ EXATAMENTE as ações que você definiu
- ✅ SEM suposição, SEM invenção

Se algo estiver faltando no briefing, Claude Code pergunta para clarificar.

---

## 📞 COMUNICAÇÃO COM CLAUDE CODE

### Quando está construindo...

**Se vai lento:**
- Peça: "Claude, me mostra o progresso até agora"
- Ou: "Próximo passo é X, certo?"

**Se há erro:**
- Copie a mensagem de erro exata
- Colar de volta: "Erro: [erro aqui]. Como resolver?"

**Se precisa mudar algo:**
- "Mudei de ideia, ao invés de X, faça Y"
- Claude Code adapta

---

## ⚠️ PONTOS CRÍTICOS

🔴 **NÃO ESQUEÇA:**

1. **Credenciais no .env** 
   - Guardar em lugar seguro
   - Nunca commitar no GitHub (usar .env.example)

2. **Webhook URL**
   - Quando Railway der URL, atualizar no YCloud

3. **Magic Link Email**
   - Configurar SMTP (Gmail ou SendGrid)
   - Ou usar simple auth por hora

4. **CPF como unique**
   - Validar formato antes de inserir
   - Remover pontos/hífens

5. **Número WhatsApp**
   - Colocar sem caracteres especiais
   - Formato: 75988410521 (ou com +55 na frente)

---

## ✨ BÔNUS: SE QUISER IR MAIS RÁPIDO

Se Claude Code tiver pronto antes do previsto:

- Adicionar segunda instância (mais um número)
- Adicionar filtragem por tipo de contacto
- Adicionar export CSV
- Adicionar busca avançada
- Adicionar webhooks de notificação (Discord/Telegram)

---

## 📞 VOCÊ FICOU COM DÚVIDA?

Responda estas perguntas:

1. **Entendeu o plano?** (Sim/Não/Parcial)
2. **Tem as credenciais prontas?** (Sim/Não)
3. **Conseguiu instalar Claude Code?** (Sim/Não)
4. **Quer que eu ajuste algo na arquitetura?** (Sim/Não/O quê)

---

## 🎯 OBJETIVO FINAL (DIA 7)

Você vai ter:

✅ **Dashboard funcionando** com seus 11 colaboradores  
✅ **Multi-instância WhatsApp** (seu número de teste)  
✅ **Rastreamento completo** (quem respondeu, tempo sem resposta)  
✅ **Diferenciação automática** (cliente vs lead)  
✅ **Deploy em produção** (Railway)  
✅ **Pronto para migrar clientes** do Multi360

---

## 🚀 COMEÇAR AGORA!

**Faça Passo 1 (Setup) hoje.**

Depois volta aqui com as credenciais prontas e a gente começa a construir no Claude Code.

---

**Você está pronto? 🚀**

Se sim, comece agora! Se precisa de ajuda em qualquer passo, me avisa!
