-- ============================================================================
-- SCHEMA COMPLETO - SISTEMA DE GESTÃO DE ATENDIMENTO PREVIDENCIÁRIO
-- Para rodar no Supabase SQL Editor
-- ============================================================================

-- EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: USUARIOS
-- ============================================================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  
  -- AUTENTICAÇÃO
  password_hash VARCHAR(255),
  magic_link_token VARCHAR(255),
  magic_link_expires TIMESTAMP,
  
  -- PERMISSÕES
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'GESTOR', 'COLABORADOR')) DEFAULT 'COLABORADOR',
  ativo BOOLEAN DEFAULT TRUE,
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- ============================================================================
-- TABELA: CONTACTOS
-- ============================================================================

CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IDENTIFICAÇÃO
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  
  -- MÚLTIPLAS INSTÂNCIAS (NÚMEROS DE WHATSAPP)
  whatsapp_instancia_1 VARCHAR(20),
  whatsapp_instancia_2 VARCHAR(20),
  whatsapp_instancia_3 VARCHAR(20),
  whatsapp_instancia_4 VARCHAR(20),
  whatsapp_instancia_5 VARCHAR(20),
  
  -- QUALIFICAÇÃO
  tipo VARCHAR(20) CHECK (tipo IN ('LEAD', 'CLIENTE')) DEFAULT 'LEAD',
  data_primeiro_contato TIMESTAMP DEFAULT NOW(),
  data_ultima_msg TIMESTAMP,
  
  -- RESPONSABILIDADE
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  responsavel_nome VARCHAR(255),
  
  -- FLAGS DE GESTÃO
  flag_sem_resposta BOOLEAN DEFAULT FALSE,
  tempo_sem_resposta INTEGER, -- em horas
  flag_urgente BOOLEAN DEFAULT FALSE,
  flag_arquivado BOOLEAN DEFAULT FALSE,
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_contactos_cpf ON contactos(cpf);
CREATE INDEX idx_contactos_whatsapp_1 ON contactos(whatsapp_instancia_1);
CREATE INDEX idx_contactos_whatsapp_2 ON contactos(whatsapp_instancia_2);
CREATE INDEX idx_contactos_tipo ON contactos(tipo);
CREATE INDEX idx_contactos_responsavel ON contactos(responsavel_id);
CREATE INDEX idx_contactos_tempo_sem_resposta ON contactos(tempo_sem_resposta) WHERE flag_sem_resposta = TRUE;

-- ============================================================================
-- TABELA: CONVERSAS
-- ============================================================================

CREATE TABLE conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  
  -- IDENTIFICAÇÃO
  canal VARCHAR(20) CHECK (canal IN ('whatsapp', 'instagram')) DEFAULT 'whatsapp',
  instancia VARCHAR(20), -- qual número de WhatsApp recebeu
  
  -- RASTREABILIDADE (CRITICAL)
  ultima_resposta_quem VARCHAR(20) CHECK (ultima_resposta_quem IN ('CLIENTE', 'COLABORADOR')),
  ultimo_respondido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  ultimo_respondido_por_nome VARCHAR(255),
  
  -- TIMING (CRITICAL)
  data_inicio TIMESTAMP DEFAULT NOW(),
  data_ultima_msg_cliente TIMESTAMP,
  data_ultima_resposta_colaborador TIMESTAMP,
  tempo_sem_resposta_horas INTEGER DEFAULT 0, -- calculado automaticamente
  
  -- STATUS
  status VARCHAR(20) CHECK (status IN ('ABERTA', 'RESPONDIDA', 'FECHADA', 'PENDENTE')) DEFAULT 'ABERTA',
  
  -- METADATA
  assunto VARCHAR(255),
  notas_internas TEXT,
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_conversas_contacto_id ON conversas(contacto_id);
CREATE INDEX idx_conversas_status ON conversas(status);
CREATE INDEX idx_conversas_tempo_sem_resposta ON conversas(tempo_sem_resposta_horas) WHERE status = 'ABERTA';
CREATE INDEX idx_conversas_responsavel ON conversas(ultimo_respondido_por);
CREATE INDEX idx_conversas_data ON conversas(created_at DESC);

-- ============================================================================
-- TABELA: MENSAGENS
-- ============================================================================

CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  
  -- ORIGEM
  quem VARCHAR(20) CHECK (quem IN ('CLIENTE', 'COLABORADOR')) NOT NULL,
  enviado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- NULL se cliente
  enviado_por_nome VARCHAR(255),
  
  -- CONTEÚDO
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('texto', 'imagem', 'arquivo', 'video', 'audio')) DEFAULT 'texto',
  
  -- ARQUIVOS
  arquivo_url VARCHAR(500),
  arquivo_nome VARCHAR(255),
  
  -- METADATA
  external_message_id VARCHAR(255), -- ID do WhatsApp/Instagram
  external_status VARCHAR(20) CHECK (external_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  -- AUDITORIA
  created_at TIMESTAMP DEFAULT NOW(),
  timestamp_recebido TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensagens_conversa_id ON mensagens(conversa_id);
CREATE INDEX idx_mensagens_quem ON mensagens(quem);
CREATE INDEX idx_mensagens_created_at ON mensagens(created_at DESC);

-- ============================================================================
-- TABELA: LOGS DE AUDITORIA
-- ============================================================================

CREATE TABLE logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_email VARCHAR(255),
  
  tabela VARCHAR(100),
  acao VARCHAR(50) CHECK (acao IN ('CREATE', 'UPDATE', 'DELETE', 'READ')),
  registro_id UUID,
  
  dados_antes JSONB,
  dados_depois JSONB,
  
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_tabela ON logs_auditoria(tabela);
CREATE INDEX idx_logs_data ON logs_auditoria(created_at DESC);

-- ============================================================================
-- TABELA: NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50), -- 'conversa_pendente', 'sla_violado', etc
  titulo VARCHAR(255),
  descricao TEXT,
  
  conversa_id UUID REFERENCES conversas(id) ON DELETE SET NULL,
  contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
  
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- ============================================================================
-- TABELA: CONFIGURAÇÕES
-- ============================================================================

CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20), -- 'string', 'integer', 'boolean', 'json'
  
  descricao TEXT,
  editavel BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA (DADOS INICIAIS)
-- ============================================================================

-- Usuário Admin (Ronaldo)
INSERT INTO usuarios (email, nome, telefone, role) VALUES
('ronaldo.analistaprev@gmail.com', 'Ronaldo Galeão', '75999898907', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Colaboradores
INSERT INTO usuarios (email, nome, role) VALUES
('breno@aposentar.com.br', 'Breno Tavares', 'COLABORADOR'),
('bruna@aposentar.com.br', 'Bruna Carvalho', 'COLABORADOR')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Conversas Pendentes (para dashboard)
CREATE OR REPLACE VIEW v_conversas_pendentes AS
SELECT 
  c.id,
  c.contacto_id,
  co.nome as contacto_nome,
  co.cpf,
  co.tipo as contacto_tipo,
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
  -- Calcular urgência
  CASE 
    WHEN c.tempo_sem_resposta_horas > 24 THEN 'CRÍTICO'
    WHEN c.tempo_sem_resposta_horas > 8 THEN 'URGENTE'
    WHEN c.tempo_sem_resposta_horas > 2 THEN 'ALTO'
    ELSE 'NORMAL'
  END as nivel_urgencia
FROM conversas c
LEFT JOIN contactos co ON c.contacto_id = co.id
WHERE c.status IN ('ABERTA', 'PENDENTE')
ORDER BY c.tempo_sem_resposta_horas DESC;

-- View: Contatos sem resposta há muito tempo
CREATE OR REPLACE VIEW v_contactos_sem_resposta AS
SELECT 
  id,
  cpf,
  nome,
  tipo,
  responsavel_nome,
  tempo_sem_resposta,
  flag_urgente,
  data_ultima_msg,
  created_at
FROM contactos
WHERE flag_sem_resposta = TRUE
ORDER BY tempo_sem_resposta DESC;

-- View: Estatísticas por colaborador
CREATE OR REPLACE VIEW v_stats_colaboradores AS
SELECT 
  u.id,
  u.nome,
  u.email,
  COUNT(DISTINCT c.id) as total_conversas,
  COUNT(DISTINCT CASE WHEN c.status = 'ABERTA' THEN c.id END) as conversas_abertas,
  COUNT(DISTINCT CASE WHEN c.tempo_sem_resposta_horas > 2 THEN c.id END) as conversas_pendentes,
  ROUND(AVG(c.tempo_sem_resposta_horas)::numeric, 1) as tempo_medio_resposta
FROM usuarios u
LEFT JOIN conversas c ON u.id = c.ultimo_respondido_por
WHERE u.role IN ('COLABORADOR', 'GESTOR')
GROUP BY u.id, u.nome, u.email
ORDER BY conversas_pendentes DESC;

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- Função: Atualizar tempo sem resposta automaticamente
CREATE OR REPLACE FUNCTION update_tempo_sem_resposta()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cliente respondeu, reseta o contador
  IF NEW.ultima_resposta_quem = 'CLIENTE' THEN
    NEW.tempo_sem_resposta_horas := 0;
    NEW.flag_sem_resposta := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tempo_sem_resposta
BEFORE UPDATE ON conversas
FOR EACH ROW
EXECUTE FUNCTION update_tempo_sem_resposta();

-- Função: Log de auditoria automático
CREATE OR REPLACE FUNCTION log_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO logs_auditoria (tabela, acao, registro_id, dados_antes)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, row_to_json(OLD));
  ELSE
    INSERT INTO logs_auditoria (tabela, acao, registro_id, dados_antes, dados_depois)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoria em tabelas principais
CREATE TRIGGER trigger_audit_contactos AFTER INSERT OR UPDATE OR DELETE ON contactos
  FOR EACH ROW EXECUTE FUNCTION log_auditoria();

CREATE TRIGGER trigger_audit_conversas AFTER INSERT OR UPDATE OR DELETE ON conversas
  FOR EACH ROW EXECUTE FUNCTION log_auditoria();

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - Para multi-tenant
-- ============================================================================

-- Habilitar RLS
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Policy: Admin vê tudo
CREATE POLICY admin_all ON contactos
  AS PERMISSIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY admin_all_conversas ON conversas
  AS PERMISSIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'ADMIN'));

-- Policy: Colaborador vê conversas atribuídas ou suas
CREATE POLICY colaborador_conversas ON conversas
  AS PERMISSIVE FOR ALL
  USING (
    ultimo_respondido_por = auth.uid() 
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================================================
-- CONFIGURAÇÕES INICIAIS
-- ============================================================================

INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
('sla_aviso_horas', '2', 'integer', 'Horas para avisar que conversa está pendente'),
('sla_critico_horas', '8', 'integer', 'Horas para marcar como crítico'),
('max_conversas_por_colaborador', '30', 'integer', 'Máximo de conversas ativas por colaborador'),
('notificar_sem_resposta', 'true', 'boolean', 'Ativar notificações de conversas sem resposta')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================================
-- GRANTS E PERMISSÕES (para Supabase)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON contactos, conversas, mensagens TO authenticated;
GRANT INSERT ON notificacoes TO authenticated;
GRANT SELECT ON v_conversas_pendentes, v_contactos_sem_resposta, v_stats_colaboradores TO authenticated;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Executar este arquivo completo no Supabase SQL Editor
-- Depois, suas tabelas estão prontas para o backend!
