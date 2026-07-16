-- ============================================================================
-- PrevAtendimento — SCHEMA (Supabase / PostgreSQL)
-- Rodar no Supabase → SQL Editor. Seguro para rodar novamente (idempotente).
-- Integrado com o Supabase Auth: usuarios.id = auth.users.id
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USUARIOS  (espelha auth.users; a linha é criada após o convite no Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'GESTOR', 'COLABORADOR')) DEFAULT 'COLABORADOR',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACTOS  (CPF opcional — leads de WhatsApp chegam sem CPF)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),

  whatsapp_instancia_1 VARCHAR(20),
  whatsapp_instancia_2 VARCHAR(20),
  whatsapp_instancia_3 VARCHAR(20),

  tipo VARCHAR(20) CHECK (tipo IN ('LEAD', 'CLIENTE')) DEFAULT 'LEAD',
  data_primeiro_contato TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_msg TIMESTAMPTZ,

  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  responsavel_nome VARCHAR(255),

  flag_sem_resposta BOOLEAN DEFAULT FALSE,
  tempo_sem_resposta INTEGER,
  flag_urgente BOOLEAN DEFAULT FALSE,
  flag_arquivado BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contactos_cpf ON contactos(cpf);
CREATE INDEX IF NOT EXISTS idx_contactos_wa1 ON contactos(whatsapp_instancia_1);
CREATE INDEX IF NOT EXISTS idx_contactos_wa2 ON contactos(whatsapp_instancia_2);
CREATE INDEX IF NOT EXISTS idx_contactos_tipo ON contactos(tipo);
CREATE INDEX IF NOT EXISTS idx_contactos_responsavel ON contactos(responsavel_id);

-- ============================================================================
-- CONVERSAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,

  canal VARCHAR(20) CHECK (canal IN ('whatsapp', 'instagram')) DEFAULT 'whatsapp',
  instancia VARCHAR(20),

  ultima_resposta_quem VARCHAR(20) CHECK (ultima_resposta_quem IN ('CLIENTE', 'COLABORADOR')),
  ultimo_respondido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  ultimo_respondido_por_nome VARCHAR(255),

  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_msg_cliente TIMESTAMPTZ,
  data_ultima_resposta_colaborador TIMESTAMPTZ,
  tempo_sem_resposta_horas INTEGER DEFAULT 0,

  status VARCHAR(20) CHECK (status IN ('ABERTA', 'RESPONDIDA', 'FECHADA', 'PENDENTE')) DEFAULT 'ABERTA',

  assunto VARCHAR(255),
  notas_internas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversas_contacto ON conversas(contacto_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas(status);
CREATE INDEX IF NOT EXISTS idx_conversas_sla ON conversas(tempo_sem_resposta_horas) WHERE status = 'ABERTA';
CREATE INDEX IF NOT EXISTS idx_conversas_data ON conversas(created_at DESC);

-- ============================================================================
-- MENSAGENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,

  quem VARCHAR(20) CHECK (quem IN ('CLIENTE', 'COLABORADOR')) NOT NULL,
  enviado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  enviado_por_nome VARCHAR(255),

  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('texto', 'imagem', 'arquivo', 'video', 'audio')) DEFAULT 'texto',

  arquivo_url VARCHAR(500),
  arquivo_nome VARCHAR(255),

  external_message_id VARCHAR(255),
  external_status VARCHAR(20) CHECK (external_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp_recebido TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW v_conversas_pendentes AS
SELECT
  c.id,
  c.contacto_id,
  co.nome  AS contacto_nome,
  co.cpf,
  co.tipo  AS contacto_tipo,
  c.canal,
  c.instancia,
  c.ultima_resposta_quem,
  c.tempo_sem_resposta_horas,
  c.status,
  c.ultimo_respondido_por,
  c.ultimo_respondido_por_nome,
  c.data_ultima_msg_cliente,
  c.data_ultima_resposta_colaborador,
  c.created_at,
  CASE
    WHEN c.tempo_sem_resposta_horas > 24 THEN 'CRÍTICO'
    WHEN c.tempo_sem_resposta_horas > 8  THEN 'URGENTE'
    WHEN c.tempo_sem_resposta_horas > 2  THEN 'ALTO'
    ELSE 'NORMAL'
  END AS nivel_urgencia
FROM conversas c
LEFT JOIN contactos co ON c.contacto_id = co.id
WHERE c.status IN ('ABERTA', 'PENDENTE')
ORDER BY c.tempo_sem_resposta_horas DESC, c.created_at DESC;

CREATE OR REPLACE VIEW v_stats_colaboradores AS
SELECT
  u.id,
  u.nome,
  u.email,
  COUNT(DISTINCT c.id) AS total_conversas,
  COUNT(DISTINCT CASE WHEN c.status = 'ABERTA' THEN c.id END) AS conversas_abertas,
  COUNT(DISTINCT CASE WHEN c.status = 'ABERTA' AND c.tempo_sem_resposta_horas > 2 THEN c.id END) AS conversas_pendentes,
  ROUND(AVG(c.tempo_sem_resposta_horas)::numeric, 1) AS tempo_medio_resposta
FROM usuarios u
LEFT JOIN conversas c ON u.id = c.ultimo_respondido_por
WHERE u.role IN ('COLABORADOR', 'GESTOR', 'ADMIN')
GROUP BY u.id, u.nome, u.email
ORDER BY conversas_pendentes DESC;

-- ============================================================================
-- TRIGGER: reset do SLA quando o cliente responde
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tempo_sem_resposta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ultima_resposta_quem = 'CLIENTE' THEN
    NEW.tempo_sem_resposta_horas := 0;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sla ON conversas;
CREATE TRIGGER trg_sla BEFORE UPDATE ON conversas
  FOR EACH ROW EXECUTE FUNCTION update_tempo_sem_resposta();

-- ============================================================================
-- FUNÇÃO AGENDÁVEL: recalcular horas sem resposta (rodar via pg_cron a cada hora)
-- ============================================================================
CREATE OR REPLACE FUNCTION recalcular_sla()
RETURNS void AS $$
  UPDATE conversas
  SET tempo_sem_resposta_horas =
        GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - data_ultima_msg_cliente)) / 3600))
  WHERE status = 'ABERTA'
    AND ultima_resposta_quem = 'CLIENTE'
    AND data_ultima_msg_cliente IS NOT NULL;
$$ LANGUAGE sql;

-- ============================================================================
-- RLS — tool interno: qualquer usuário autenticado enxerga/opera.
-- (Ingestão usa a service_role, que ignora RLS.) Refinar por colaborador depois.
-- ============================================================================
ALTER TABLE usuarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_all_usuarios  ON usuarios;
DROP POLICY IF EXISTS auth_all_contactos ON contactos;
DROP POLICY IF EXISTS auth_all_conversas ON conversas;
DROP POLICY IF EXISTS auth_all_mensagens ON mensagens;

CREATE POLICY auth_all_usuarios  ON usuarios  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_all_contactos ON contactos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_all_conversas ON conversas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_all_mensagens ON mensagens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- COMO CRIAR OS USUÁRIOS (rodar DEPOIS de convidar no Authentication → Users)
-- ============================================================================
-- Depois que o e-mail existir em auth.users, ligue-o à tabela usuarios:
--
-- INSERT INTO usuarios (id, email, nome, role)
-- SELECT id, email, 'Ronaldo Galeão', 'ADMIN'
-- FROM auth.users WHERE email = 'ronaldo.analistaprev@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, role = EXCLUDED.role;
--
-- Repita para Breno e Bruna com role 'COLABORADOR'.
-- ============================================================================
