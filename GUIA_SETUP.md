# 🔧 GUIA DE SETUP - PASSO A PASSO

## ⏱️ TEMPO ESTIMADO: 1-2 HORAS

---

## PASSO 1: YCLOUD SETUP (15 minutos)

### 1.1 Criar Conta YCloud

1. Acesse: **https://app.ycloud.com/sign-up**
2. Email: `ronaldo.analistaprev@gmail.com`
3. Senha: crie uma segura
4. Verificar email

### 1.2 Obter API Key

1. Dashboard YCloud → Ir para **Settings**
2. Em **API Keys** → clique **+ Create New API Key**
3. Nome: `aposentar-mvp`
4. **COPIAR E GUARDAR** (vai usar no .env)

```
YCLOUD_API_KEY=sk_live_xxxxxxxxxxxxxx
```

### 1.3 Conectar Número WhatsApp

1. YCloud → **WhatsApp Numbers**
2. **+ Add Number**
3. Escolha: **Existing WhatsApp Number** (já tem)
4. Número: `75 98841-0521` (seu número de teste)
5. Seguir o fluxo de verificação Meta
   - YCloud vai gerar QR Code
   - Escanear com o número que vai usar
   - Confirmar

⚠️ **IMPORTANTE:** Use um número secundário, não seu número pessoal!

### 1.4 Webhook Setup

1. YCloud → **Webhooks**
2. **+ Add Webhook**
3. URL: `https://seu-railway-url.railway.app/api/webhooks/ycloud`
   (você vai atualizar depois que tiver Railway)
4. Events para ativar:
   - ✅ message.received
   - ✅ message.sent
   - ✅ message.failed
5. Secret: gerar um secret seguro

```
WEBHOOK_SECRET=webhook_secret_aqui
YCLOUD_WEBHOOK_ID=id_gerado
```

---

## PASSO 2: SUPABASE (Você já tem conta)

### 2.1 Criar Novo Projeto (ou usar existente)

1. Acesse: **https://supabase.com/dashboard**
2. Login com sua conta
3. **+ New Project**
4. Nome: `aposentar-atendimento`
5. Password: criar segura
6. Region: `South America (São Paulo)` - mais próximo
7. Clicar **Create New Project** (demora 2-3 min)

### 2.2 Obter Credenciais

Quando o projeto estiver pronto:

1. **Settings** → **API**
2. **Copiar:**
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE` (guardar bem!)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Criar Tabelas (SQL)

1. Supabase → **SQL Editor**
2. **+ New Query**
3. Copiar e rodar o arquivo: `/sql/schema.sql` (vou fornecer)

**Ou fazer manualmente:**

1. Supabase → **Table Editor**
2. **+ Create a new table**

Para cada tabela abaixo, criar com os campos indicados.

---

## PASSO 3: RAILWAY SETUP (Hospedagem)

### 3.1 Criar Conta Railway

1. Acesse: **https://railway.app**
2. Clique **Login with GitHub**
3. Autorizar (precisa de conta GitHub)
4. Conectar GitHub

### 3.2 Deploy Projeto

1. Você vai ter o repositório GitHub (`seu-username/aposentar-atendimento`)
2. Em Railway → **+ New Project**
3. Clicar **Deploy from GitHub repo**
4. Selecionar seu repositório
5. Railway vai detectar `package.json` e fazer deploy automático

### 3.3 Variáveis de Ambiente

No dashboard Railway:

1. **Variables**
2. Adicionar cada variável:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc...
YCLOUD_API_KEY=sk_live_xxxxx
WEBHOOK_SECRET=seu_secret_aqui
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://seu-railway-url.railway.app
```

### 3.4 Obter URL do Railway

1. Railway Dashboard → seu projeto
2. **Deployments** → clique na última
3. Em **Domains** → copiar URL gerada
   - Exemplo: `https://aposentar-mvp-production.railway.app`

⚠️ **IMPORTANTE:** Essa URL precisa ser atualizada no webhook do YCloud!

---

## PASSO 4: WEBHOOK - LINK FINAL

Agora que tem URL Railway:

1. Voltar ao YCloud → **Webhooks**
2. Editar o webhook que criou
3. Atualizar URL:
   ```
   https://seu-railway-url.railway.app/api/webhooks/ycloud
   ```
4. Salvar

---

## PASSO 5: TESTAR CONEXÃO

### 5.1 Enviar Mensagem de Teste

1. Seu WhatsApp pessoal
2. Procurar contato com o número `75 98841-0521` (aquele que registrou)
3. Mandar mensagem: `Olá teste`
4. Ir para o dashboard da sua aplicação
5. Verificar se a mensagem apareceu

### 5.2 Verificar Logs

Railway:

1. Railway Dashboard → seu projeto
2. **Logs**
3. Procurar por `message received` ou erros

Supabase:

1. Supabase → **Table Editor**
2. Tabela `mensagens`
3. Verificar se a mensagem foi inserida

---

## PASSO 6: CRIAR USUÁRIOS INICIAIS

Via SQL Supabase:

```sql
INSERT INTO usuarios (email, nome, telefone, role) VALUES
('ronaldo.analistaprev@gmail.com', 'Ronaldo Galeão', '75999898907', 'ADMIN'),
('breno@aposentar.com.br', 'Breno Tavares', '', 'COLABORADOR'),
('bruna@aposentar.com.br', 'Bruna Carvalho', '', 'COLABORADOR');
```

---

## ✅ CHECKLIST DE SETUP

```
YCLOUD:
□ Conta criada
□ API Key gerada e salva
□ Número registrado (75 98841-0521)
□ Webhook criado (URL incompleta ok por enquanto)

SUPABASE:
□ Projeto criado
□ Credenciais copiadas
□ Tabelas criadas (SQL rodado)
□ Usuários inseridos

RAILWAY:
□ Conta criada via GitHub
□ Repositório conectado
□ Variáveis de ambiente adicionadas
□ URL gerada
□ Deploy bem-sucedido

CONEXÃO:
□ URL Railway atualizada no webhook YCloud
□ Mensagem de teste enviada e recebida
□ Dados aparecem em Supabase
□ Sem erros nos logs

USUÁRIOS:
□ Você consegue fazer login (Ronaldo)
□ Pode convidar Breno e Bruna depois
```

---

## 🆘 TROUBLESHOOTING

### "Erro ao conectar Supabase"
- Verificar `SUPABASE_URL` e `SUPABASE_KEY` (copiar exatamente, sem espaços)
- Verificar se projeto Supabase está "Active"

### "Webhook não recebe mensagens"
- Verificar se URL está correta no YCloud
- Testar webhook com `curl`:
  ```bash
  curl -X POST https://seu-url/api/webhooks/ycloud \
    -H "Content-Type: application/json" \
    -d '{"type":"message.received","data":{}}'
  ```

### "Mensagem não aparece no WhatsApp"
- Verificar se número está verificado no YCloud
- Ver logs de erro no dashboard YCloud
- Verificar quota (se não excedeu limite grátis)

### "Railway deployment falhou"
- Ir em **Deployments** → ver erro detalhado
- Comum: falta `.env` ou erro no `package.json`

---

## 📞 SUPORTE

Se travar em algo:
1. Anotar EXATAMENTE o erro
2. Procurar em logs (Railway ou YCloud)
3. Descrever ao Claude Code

---

**Próximo passo:** Dar o prompt pro Claude Code construir!
