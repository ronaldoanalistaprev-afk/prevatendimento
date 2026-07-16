> ⚠️ **DOCUMENTO HISTÓRICO — NÃO É O SISTEMA DE HOJE.**
> Escrito na fase de planejamento (julho/2026), **antes** da decisão de usar o Multi360.
> Ele descreve um WhatsApp próprio (Baileys/YCloud) que foi **engavetado**, e usa a palavra
> "Lead", que é **proibida** no projeto (o certo é "Pretenso Cliente").
> **Leia o `README.md`** para saber como o sistema realmente funciona.

# 🏗️ ARQUITETURA TÉCNICA - FASE 1: MULTI-ATENDIMENTO

## 📌 INFORMAÇÕES DO PROJETO

**Cliente:** Ronaldo Galeão - Aposentar Soluções Previdenciárias  
**Email:** ronaldo.analistaprev@gmail.com  
**WhatsApp Test:** 75 99989-8907  
**Gestor:** Ronaldo (você)  
**Colaboradores:** Breno Tavares, Bruna Carvalho  
**Prioridade MVP:** Parar hemorragia de clientes (SLA + Rastreamento)

⚠️ **IMPORTANTE:** 
- Este documento descreve **APENAS FASE 1 (MVP)** - Multi-Atendimento
- **FASE 2** (CRM Previdenciário) será desenvolvida DEPOIS baseada em BRIEFING específico seu
- Nada será chutado sobre estrutura previdenciária

---

## 🎯 ESCOPO MVP - FASE 1 (7 DIAS)

### O que o sistema vai fazer:
✅ Multi-instância WhatsApp (número: 75 98841-0521)  
✅ Contactos unificados por CPF  
✅ Dashboard: quem respondeu por último  
✅ Flag: "Sem resposta há X horas"  
✅ Diferenciação: CLIENTE vs LEAD  
✅ Claude sugere respostas baseado em contexto  
✅ Rastreamento de SLA (tempo de resposta)

### O que NÃO faz no MVP (vem depois):
❌ CRM previdenciário (FASE 2 - baseado em seu briefing)
❌ Tipos de benefício  
❌ Estrutura de funis previdenciários  
❌ Automação de respostas específicas  
❌ Instagram (vem depois)  
❌ Relatórios avançados (vem depois)

---

## 🗄️ BANCO DE DADOS (PostgreSQL via Supabase)

### Tabela: `contactos`
```sql
CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  
  -- MÚLTIPLAS INSTÂNCIAS
  whatsapp_instancia_1 VARCHAR(20),
  whatsapp_instancia_2 VARCHAR(20),
  whatsapp_instancia_3 VARCHAR(20),
  
  -- QUALIFICAÇÃO
  tipo VARCHAR(20) CHECK (tipo IN ('LEAD', 'CLIENTE')),
  data_primeiro_contato TIMESTAMP DEFAULT NOW(),
  data_ultima_msg TIMESTAMP,
  
  -- RESPONSÁVEL ATUAL
  responsavel_id UUID REFERENCES usuarios(id),
  
  -- FLAGS
  flag_sem_resposta BOOLEAN DEFAULT FALSE,
  tempo_sem_resposta INTEGER, -- em horas
  flag_urgente BOOLEAN DEFAULT FALSE,
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cpf ON contactos(cpf);
CREATE INDEX idx_whatsapp_1 ON contactos(whatsapp_instancia_1);
```

### Tabela: `conversas`
```sql
CREATE TABLE conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES contactos(id),
  
  -- IDENTIFICAÇÃO
  canal VARCHAR(20) CHECK (canal IN ('whatsapp', 'instagram')),
  instancia VARCHAR(20), -- qual número de WhatsApp
  
  -- RASTREABILIDADE (CORE DO MVP)
  ultima_resposta_quem VARCHAR(20) CHECK (ultima_resposta_quem IN ('CLIENTE', 'COLABORADOR')),
  ultimo_respondido_por UUID REFERENCES usuarios(id),
  
  -- TIMING (CRÍTICO)
  data_inicio TIMESTAMP DEFAULT NOW(),
  data_ultima_msg_cliente TIMESTAMP,
  data_ultima_resposta_colaborador TIMESTAMP,
  tempo_sem_resposta INTEGER, -- em horas
  
  -- STATUS
  status VARCHAR(20) CHECK (status IN ('ABERTA', 'RESPONDIDA', 'FECHADA', 'PENDENTE')),
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacto_id ON conversas(contacto_id);
CREATE INDEX idx_tempo_sem_resposta ON conversas(tempo_sem_resposta) WHERE status = 'ABERTA';
```

### Tabela: `mensagens`
```sql
CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id),
  
  -- ORIGEM
  quem VARCHAR(20) CHECK (quem IN ('CLIENTE', 'COLABORADOR')),
  enviado_por UUID REFERENCES usuarios(id), -- NULL se cliente
  
  -- CONTEÚDO
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('texto', 'imagem', 'arquivo', 'video')),
  
  -- METADATA
  external_message_id VARCHAR(255), -- ID do WhatsApp
  timestamp_recebido TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversa_id ON mensagens(conversa_id);
```

### Tabela: `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  
  -- PERMISSÕES
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'GESTOR', 'COLABORADOR')),
  
  -- DADOS PESSOAIS
  data_criacao TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 INTEGRAÇÕES EXTERNAS

### YCloud API
**Endpoint Base:** `https://api.ycloud.com/v1`

**Autenticação:** Bearer Token (salvar em env)

**Webhooks Necessários:**
```
POST /webhook/ycloud
- message.received → nova mensagem recebida
- message.sent → mensagem enviada com sucesso
- message.failed → falha no envio
```

**Endpoints a usar:**
- `POST /messages` → Enviar mensagem
- `GET /messages/{id}` → Status da mensagem
- `GET /contacts` → Listar contatos

---

## 🎨 FLUXO PRINCIPAL (MVP)

```
CLIENTE ENVIA MENSAGEM (WhatsApp)
        ↓
YCloud WEBHOOK → Seu Backend (Node.js)
        ↓
NORMALIZAR MENSAGEM
        ↓
PROCURAR CONTACTO (por número + instância)
        ├─ Encontrou? → Carregar histórico
        └─ Não encontrou? → CRIAR NOVO (LEAD)
        ↓
PROCURAR CONVERSA ABERTA
        ├─ Existe? → Adicionar mensagem
        └─ Não existe? → CRIAR NOVA
        ↓
ATUALIZAR FLAGS
        ├─ ultima_resposta_quem = 'CLIENTE'
        ├─ data_ultima_msg_cliente = NOW()
        ├─ status = 'ABERTA'
        └─ tempo_sem_resposta = 0
        ↓
NOTIFICAR COLABORADORES
        ├─ Dashboard refresh
        └─ Alert se pendente há >2h
```

---

## 🖥️ BACKEND (Node.js + Express)

### Estrutura de Pastas
```
backend/
├── src/
│   ├── index.js (Express app)
│   ├── config/
│   │   ├── database.js (Supabase client)
│   │   ├── ycloud.js (YCloud client)
│   │   └── env.js
│   ├── routes/
│   │   ├── webhooks.js (YCloud webhook)
│   │   ├── contactos.js (CRUD)
│   │   ├── conversas.js (CRUD)
│   │   └── usuarios.js (CRUD)
│   ├── controllers/
│   │   ├── webhookController.js
│   │   ├── contactoController.js
│   │   └── conversaController.js
│   ├── services/
│   │   ├── ycloud.service.js
│   │   ├── contacto.service.js
│   │   └── conversa.service.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validateWebhook.js
│   └── utils/
│       └── formatters.js
├── .env.example
├── package.json
└── docker-compose.yml (para local)
```

### Key Endpoints (MVP)

**Webhook YCloud**
```
POST /api/webhooks/ycloud
Body: {
  type: "message.received",
  data: { 
    from: "75988410521",
    text: "Olá",
    timestamp: 1234567890
  }
}
```

**Obter Contacto**
```
GET /api/contactos/:cpf
Response: { contacto, conversas_abertas, ultima_msg, tempo_sem_resposta }
```

**Obter Conversas Pendentes (Para Dashboard)**
```
GET /api/conversas/pendentes
Response: [
  { contacto, conversa, tempo_sem_resposta, ultimo_respondido_por },
  ...
]
```

**Enviar Mensagem (Colaborador)**
```
POST /api/mensagens/enviar
Body: { conversa_id, conteudo, enviado_por }
```

---

## 📱 FRONTEND (React)

### Componentes Principais (MVP)

**1. Dashboard Principal**
```
┌─────────────────────────────────────┐
│  Bem-vindo, Ronaldo                 │
├─────────────────────────────────────┤
│                                      │
│  📊 MÉTRICAS RÁPIDAS                │
│  ├─ Conversas abertas: 47           │
│  ├─ Sem resposta há >2h: 12         │
│  ├─ Leads novos hoje: 3             │
│  └─ Taxa resposta: 85%              │
│                                      │
│  ⚠️ PENDENTES (URGENTE)             │
│  ├─ João Silva - 4 horas            │
│  ├─ Maria Santos - 3 horas          │
│  └─ Carlos Lima - 2 horas           │
│                                      │
│  💬 ÚLTIMAS CONVERSAS              │
│  └─ [Lista com 10 últimas]          │
└─────────────────────────────────────┘
```

**2. Tela de Conversa**
```
┌──────────────────────────────────────┐
│ João Silva (CPF: 123.456.789-00)     │
│ Tipo: CLIENTE | Responsável: Breno   │
├──────────────────────────────────────┤
│                                       │
│ HISTÓRICO:                           │
│ [16:30] João: Qual o status?        │
│ [16:35] Breno: Estou analisando...  │
│ [Sem resposta por 2h 15min]          │
│                                       │
├──────────────────────────────────────┤
│ [Input] Sua resposta...              │
│ [Enviar] [Salvar rascunho]           │
└──────────────────────────────────────┘
```

**3. Painel de Gestão**
```
┌──────────────────────────────────────┐
│ GESTÃO DE PENDÊNCIAS                 │
├──────────────────────────────────────┤
│ Colaborador | Conversas | Pendentes  │
├──────────────────────────────────────┤
│ Breno       |    25     |      8     │
│ Bruna       |    22     |      4     │
│ (Você)      |    47     |     12     │
└──────────────────────────────────────┘
```

---

## 🔐 AUTENTICAÇÃO & PERMISSÕES

### Roles
- **ADMIN** (você): Acesso total, gestão de usuários
- **GESTOR** (você + futuros): Ver dashboard, cobrar pendências
- **COLABORADOR** (Breno, Bruna): Ver próprias conversas + dashboard simples

### Auth Flow
- Magic Link (email) para MVP
- Depois: OAuth com Google
- Session em JWT (salva em localStorage)

---

## 📊 MÉTRICAS E ALERTAS (MVP)

### Alertas Críticos
- ⚠️ Conversa sem resposta > 2h → Dashboard marca RED
- ⚠️ Colaborador com 5+ conversas pendentes → Flag notificação
- ⚠️ Lead não contactado em 24h → Notificação

### Dashboard KPIs
- Tempo médio de resposta
- % de conversas respondidas em <1h
- Conversas pendentes por colaborador
- Tipos de contacto (CLIENTE vs LEAD)

---

## 🚀 VARIÁVEIS DE AMBIENTE (.env)

```
# SUPABASE
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxxxxxxxxxxxxx
SUPABASE_JWT_SECRET=xxxxxxxx

# YCLOUD
YCLOUD_API_KEY=xxxxxxxx
YCLOUD_API_URL=https://api.ycloud.com/v1

# WEBHOOK
WEBHOOK_SECRET=seu_secret_aqui
WEBHOOK_URL=https://seu-railway.railway.app/api/webhooks/ycloud

# APP
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://seu-railway.railway.app

# USUÁRIOS INICIAIS (para seed)
ADMIN_EMAIL=ronaldo.analistaprev@gmail.com
COLABORADOR_1_EMAIL=breno@example.com
COLABORADOR_2_EMAIL=bruna@example.com
```

---

## 📋 FASE 1: IMPLEMENTAÇÃO (7 DIAS)

### Dia 1-2: Infraestrutura
- [ ] Clonar repositório base (`whatsapp-agentkit` customizado)
- [ ] Configurar Supabase (criar tabelas, migrations)
- [ ] Setup YCloud API (obter credenciais)
- [ ] Setup Railway (conectar repo)
- [ ] Variáveis de ambiente

### Dia 3-4: Backend Core
- [ ] Webhook YCloud funcionando
- [ ] CRUD de contactos
- [ ] CRUD de conversas
- [ ] Rastreamento de timing (sem resposta)
- [ ] Diferenciação CLIENTE/LEAD

### Dia 5-6: Frontend MVP
- [ ] Login simples (magic link)
- [ ] Dashboard com metrics
- [ ] Tela de conversa
- [ ] Painel de pendências

### Dia 7: Testes & Deploy
- [ ] Testes com seu número (75 98841-0521)
- [ ] Convite para Breno e Bruna testarem
- [ ] Ajustes rápidos
- [ ] Deploy para produção

---

## ⚠️ RISCOS & MITIGAÇÕES

| Risco | Mitigação |
|-------|-----------|
| YCloud API instável | Usar Whapi como fallback |
| Webhook não recebe | Logs detalhados, retry logic |
| Performance com 1000+ msgs | Database indexes, pagination |
| Colaboradores não entendem | Documentação visual simples |

---

## 📝 PRÓXIMOS PASSOS (DEPOIS DO MVP)

**Semana 2:**
- [ ] CRM Previdenciário (tipo benefício, status, etc)
- [ ] Base de conhecimento (vector DB)
- [ ] Claude com RAG

**Semana 3:**
- [ ] Automação de respostas (Claude)
- [ ] Dashboard Gestor avançado
- [ ] Relatórios

**Semana 4+:**
- [ ] Instagram integrado
- [ ] Multi-tenant SaaS

---

## 🔗 RECURSOS

- YCloud Docs: https://ycloud.com/docs
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
- whatsapp-agentkit: https://github.com/Hainrixz/whatsapp-agentkit

---

**Criado para:** Ronaldo Galeão  
**Data:** Junho 2026  
**Status:** Pronto para Claude Code construir
