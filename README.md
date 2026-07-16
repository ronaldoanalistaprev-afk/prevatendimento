# PrevAtendimento

Central de atendimento multicanal (WhatsApp) **self-hosted** para a Aposentar — sem plataformas
externas de atendimento. Recebe mensagens, unifica contatos, rastreia SLA ("quem respondeu por
último" / "sem resposta há X horas") e diferencia LEAD × CLIENTE.

## Arquitetura

```
WhatsApp ──▶ whatsapp-service (Baileys, Node)  ──POST──▶  web /api/webhook/whatsapp
   ▲             (lê QR Code, roda no seu PC)                    │ (grava no Supabase)
   │                                                            ▼
   └────────── POST /send ◀── web (colaborador responde) ── Dashboard Next.js + Supabase
```

- **`web/`** — App Next.js 16 + Supabase (dashboard, auth, API de ingestão e envio).
- **`whatsapp-service/`** — Worker Baileys: conecta um número via QR Code e faz a ponte com o app.
  É um **adaptador**: amanhã trocamos por WhatsApp Cloud API (Meta) sem mexer no `web/`.
- **`sql/schema.sql`** — Estrutura do banco (rodar no Supabase SQL Editor).

## Passo a passo (primeira vez)

### 1. Banco (Supabase)
1. Crie um projeto no [Supabase](https://supabase.com/dashboard) (região São Paulo).
2. **SQL Editor** → cole e rode `sql/schema.sql`.
3. **Authentication → Users** → convide/crie os usuários (Ronaldo, Breno, Bruna) e defina senha.
4. **SQL Editor** → ligue cada e-mail à tabela `usuarios` (exemplo comentado no fim do schema).

### 2. App web
```bash
cd web
npm install
copy .env.local.example .env.local   # (Windows)  |  cp no Linux/Mac
# preencha .env.local com as chaves do Supabase (Settings → API) e um INGEST_SECRET aleatório
npm run dev
```
Acesse http://localhost:3000 → login com o usuário criado no Supabase.
O app **sobe mesmo sem o banco** (mostra aviso e dados zerados) — mas para dados reais precisa do Supabase.

### 3. WhatsApp (Baileys)
```bash
cd whatsapp-service
npm install
copy .env.example .env               # use o MESMO INGEST_SECRET do web
npm start
```
Escaneie o **QR Code** que aparece no terminal com o WhatsApp do número de teste
(**Aparelhos conectados**). A partir daí, mensagens recebidas aparecem no dashboard, e as
respostas enviadas pelo dashboard saem por este número.

> Use um número **secundário** nos testes — a conexão não-oficial pode levar a bloqueio.

## Migração para a Cloud API oficial (depois)
Basta apontar o webhook oficial da Meta para `/api/webhook/whatsapp` (com um pequeno tradutor de
payload) e usar o endpoint oficial no envio. Banco, dashboard e SLA continuam iguais.
