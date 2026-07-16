> ⚠️ **DOCUMENTO HISTÓRICO — NÃO É O SISTEMA DE HOJE.**
> Escrito na fase de planejamento (julho/2026), **antes** da decisão de usar o Multi360.
> Ele descreve um WhatsApp próprio (Baileys/YCloud) que foi **engavetado**, e usa a palavra
> "Lead", que é **proibida** no projeto (o certo é "Pretenso Cliente").
> **Leia o `README.md`** para saber como o sistema realmente funciona.

# 🗺️ MAPA DOS 5 ARQUIVOS - GUIA RÁPIDO

Você tem 5 arquivos. Vamos deixar claro quando usar cada um.

---

## 📋 ARQUIVO 1: `ARQUITETURA_SISTEMA_PREVIDENCIARIO.md`

### O que é?
Documento técnico completo que explica:
- Como o sistema funciona
- Banco de dados (tabelas)
- Endpoints (URLs do sistema)
- Fluxos de funcionamento
- Stack de tecnologias

### Quando ler?
- **Se quiser entender 100%** como tudo funciona internamente
- **Se tiver dúvidas técnicas** durante construção
- **Opcional** — você não precisa de verdade, é para referência

### Quem lê?
- Você (opcional)
- Claude Code (automático)

---

## 🔧 ARQUIVO 2: `GUIA_SETUP.md`

### O que é?
Passo-a-passo simples de como configurar as ferramentas:
- YCloud (WhatsApp)
- Railway (hospedagem)
- Supabase (banco de dados)

### Quando usar?
**HOJE (Próximas 4 horas)** — VOCÊ TEM QUE FAZER ISSO

Siga linha por linha:
1. YCloud → cria conta, copia chave
2. Supabase → copia credenciais
3. Railway → cria conta
4. Supabase SQL → cola `sql_schema.sql`

### Resultado?
Você tem credenciais prontas para passar ao Claude Code

---

## 🤖 ARQUIVO 3: `PROMPT_CLAUDE_CODE.txt`

### O que é?
O PROMPT MASTER que você vai colar no Claude Code

Ele diz ao Claude Code:
- Que você quer construir
- Como deve ser estruturado
- Qual é o objetivo
- Quais são as prioridades

### Quando usar?
**DEPOIS de fazer o setup** (Arquivo 2)

1. Abre Claude Code
2. Copia TODO o conteúdo de `PROMPT_CLAUDE_CODE.txt`
3. Cola no chat
4. Claude Code começa a construir

### Resultado?
Backend + Frontend pronto em 1-2 horas

---

## 💾 ARQUIVO 4: `sql_schema.sql`

### O que é?
Arquivo SQL com estrutura do banco de dados:
- Tabelas
- Campos
- Relacionamentos
- Índices
- Views

### Quando usar?
**Durante o setup (Arquivo 2)**

1. Abre Supabase
2. Vai em SQL Editor
3. Cola TODO conteúdo de `sql_schema.sql`
4. Clica "Run"
5. Pronto — banco criado

**Não modifique este arquivo!**

---

## 📋 ARQUIVO 5: `BRIEFING_CRM_PREVIDENCIARIO_TEMPLATE.md`

### O que é?
Template para você preencher com informações do seu negócio previdenciário:
- Tipos de benefício que trabalha
- Funil de vendas de cada um
- Documentos que precisa
- Acompanhamento após venda
- Datas críticas
- Etc.

### Quando usar?
**NÃO USE AGORA!**

Use DEPOIS:
- Fase 1 (MVP) estar funcionando (dia 7-10)
- Você testou com Breno e Bruna
- Você tem certeza do que quer

**Como usar:**
1. Abra o arquivo
2. Preencha COMPLETAMENTE
3. **Seja ESPECÍFICO** (não genérico)
4. Passe para Claude Code
5. Claude Code constrói Fase 2

### Resultado?
CRM que é ESPELHO 100% do seu negócio (sem chutes)

---

## 🗓️ TIMELINE DOS ARQUIVOS

```
DIA 1 (HOJE):
├─ Leia: GUIA_SETUP.md
├─ Faça: Setup YCloud, Railway, Supabase
├─ Execute: sql_schema.sql no Supabase
└─ Resultado: Credenciais prontas

DIA 2-7 (CONSTRUÇÃO):
├─ Leia: PROMPT_CLAUDE_CODE.txt
├─ Cole: No Claude Code
├─ Faça: Claude Code constrói MVP
└─ Resultado: Sistema pronto

DIA 8-10 (TESTES):
├─ Use: Sistema com Breno e Bruna
├─ Teste: Multi-atendimento
└─ Valide: Resolve problema de falta de resposta

DIA 11+ (FASE 2):
├─ Preencha: BRIEFING_CRM_PREVIDENCIARIO_TEMPLATE.md
├─ Cole: No Claude Code
└─ Claude Code: Constrói CRM previdenciário
```

---

## 🎯 RÁPIDA REFERÊNCIA

| Arquivo | O que faz | Quando | Quem |
|---------|-----------|--------|------|
| ARQUITETURA | Explica tudo tecnicamente | Opcional | Você/Devs |
| GUIA_SETUP | Como configurar ferramentas | HOJE | Você |
| PROMPT_CLAUDE_CODE | Instrução para construir | Dia 2+ | Claude Code |
| sql_schema.sql | Banco de dados | HOJE | Você (colar) |
| BRIEFING_CRM | Info sobre negócio previdenciário | Dia 11+ | Você (preencher) |

---

## ✅ O QUE VOCÊ PRECISA FAZER AGORA

1. **Entendeu o mapa?** (Leia este arquivo)
2. **Tem todos os 5 arquivos?** (Verifique pasta)
3. **Pronto para começar?** (Siga GUIA_SETUP.md)

---

## 🚀 PRÓXIMO PASSO

Comece por: **GUIA_SETUP.md** (hoje, próximas 4h)

---

**Dúvidas? Que arquivo?** 🎯
