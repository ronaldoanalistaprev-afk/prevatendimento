# PrevAtendimento

Sistema de atendimento do escritório Aposentar, parte do ecossistema SIAP.

**O que ele faz:** espelha tudo o que acontece no WhatsApp do escritório (que hoje roda no
**Multi360**) para o nosso banco, e responde a uma pergunta que o Multi360 não responde:
**quem falou por último?** Se foi o cliente, o relógio está correndo contra o escritório.

Desse sinal nasce o resto: quem está sem resposta, há quanto tempo, com qual atendente, e o
que o supervisor precisa cobrar.

> **O problema que ele já achou:** 810 conversas abertas, **319 clientes sem resposta há mais de
> 24 horas**, e **179 esquecidos há mais de 60 dias** — alguns desde 2023.

## Como está montado

```
WhatsApp do escritório
        │
        ▼
   Multi360 (plataforma de terceiros, é onde a equipe atende)
        │  API interna (token)
        ▼
   multi360-reader/   ← lê de 15 em 15 min e recalcula as métricas
        │
        ▼
   Supabase (Postgres, São Paulo)   ← a verdade fica aqui: ~457 mil mensagens
        ▲
        │
   web/  (Next.js)   ← as telas: Painel, Monitor, Auditoria, Cobranças...
```

- **`web/`** — as telas (Next.js 16 + React 19 + Supabase Auth). Roda com **webpack**
  (`npm run dev`), **não** Turbopack: o Turbopack estoura a memória desta máquina.
- **`multi360-reader/`** — o leitor. `node index.js` roda em laço de 15 em 15 minutos.
  Precisa ficar **acordado** para os dados não congelarem.
- **`sql/`** — as migrações aplicadas no Supabase, em ordem histórica.
- **`whatsapp-service/`** — a trilha do WhatsApp próprio (Baileys). **Engavetada**, ver abaixo.

## As telas

| Tela | Para que serve |
|---|---|
| **Início** (`/dashboard`) | O painel do gestor: o que precisa de decisão hoje, se estamos respondendo, e se o sistema está sendo usado. Quem não enxerga tudo cai no Monitor. |
| **Monitor** | Todas as conversas do Multi360, com quem está esperando primeiro. |
| **Auditoria** | Só quem ficou sem resposta, por marco de tempo (2h a 72h) e por atendente. |
| **Cobranças** | O supervisor cobra o atendente; métricas do que a cobrança produz. |
| **Desempenho** | Ranking por atendente. |
| **Colaboradores** | A equipe do WhatsApp e quem tem login. |
| **Configurações** | Papéis, permissões, modelos de cobrança e o catálogo previdenciário. |

## Papéis

Cada login tem um papel, e cada papel tem **poderes** (ver as conversas de todos / cobrar) mais
as **telas** liberadas. Os quatro de fábrica — Administrador, Gestor, Supervisor, Colaborador —
podem ser renomeados mas não excluídos. O Administrador cria outros em
Configurações → Papéis.

## Rodar na sua máquina

```bash
# 1) as telas            2) o leitor
cd web                   cd multi360-reader
npm install              npm install
npm run dev              node index.js
# http://localhost:3000
```

As senhas ficam em `web/.env.local` e `multi360-reader/.env` — veja os arquivos `.env.example`
de cada pasta para saber o que preencher. **Eles nunca vão para o GitHub.**

O **token do Multi360 vence a cada ~6 meses**. Quando o leitor parar, veja
`multi360-reader/README.md` para pegar um novo.

## Decisões que explicam o resto

- **Multi360 fica.** A ideia original era construir nosso próprio WhatsApp e não usar
  plataforma externa. Isso foi **abandonado**: o Multi360 mostra o telefone real do cliente e
  não tem risco de banimento. Nós lemos dele em vez de substituí-lo.
- **O WhatsApp próprio está engavetado, não morto.** O ciclo (receber → identificar →
  responder → entregar) foi provado em 08/07/2026 com o Baileys. Dois problemas ficaram sem
  solução: o telefone não aparece (identificador `@lid`) e há risco de banimento. O caminho
  definitivo é a **API oficial da Meta**, que exige o sistema publicado.
- **O robô não é a equipe.** Mensagem automática não conta como resposta e não para o relógio
  da espera do cliente.
- **Média mente.** O tempo médio de resposta dá ~15 horas; a mediana, ~20 minutos. A média é
  puxada por madrugada e fim de semana. A tela usa **% respondido em até 24h** e mediana.
- **Vocabulário:** "Pretenso Cliente", nunca "Lead". "Sem resposta", nunca "backlog" ou "SLA".

## Documentos

- **A memória do projeto** (histórico completo, decisões e números) fica em
  `C:\Users\Usuario\.claude\projects\D--Projetos-SIAP-PrevAtendimento\memory\`.
- `PROMPT_NOVA_CONVERSA.md` — o texto para começar uma conversa nova com o Claude Code.
- `docs/REFERENCIA_PREVIDENCIARIA.md` — ponteiro para a referência canônica do SIAP.
- `ARQUITETURA_SISTEMA_PREVIDENCIARIO.md`, `GUIA_SETUP.md`, `QUICK_START.md`,
  `MAPA_DOS_ARQUIVOS.md`, `CHECKLIST_EXECUTIVO.md`, `BRIEFING_*`, `CRI_MODELO_CONCEITUAL.html`
  — **documentos da fase de planejamento (2026-07), anteriores ao Multi360**. Guardados como
  histórico; **não são o sistema de hoje**.
