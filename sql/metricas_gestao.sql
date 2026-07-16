-- ============================================================================
-- PrevAtendimento — MÉTRICAS DE GESTÃO (tempo de resposta + linha de base)
-- Cole no Supabase -> SQL Editor -> Run.
-- SEGURO RODAR QUANTAS VEZES QUISER: só cria o que ainda não existe e
-- recalcula números. NÃO apaga mensagem, protocolo nem cliente.
--
-- O que este arquivo faz, em português:
--   1) Cria índices (deixa as contas rápidas).
--   2) Cria a tabela at_metricas_mensais = "tempo de resposta mês a mês".
--   3) Cria a função at_recalcular_metricas() que preenche essa tabela.
--   4) Cria a tabela at_linha_base = "foto do antes" (retrato de cada dia).
--   5) Cria a função at_registrar_linha_base() que tira a foto do dia.
--   6) Roda tudo uma vez no final.
--
-- CONCEITO CENTRAL — "RODADA":
--   Uma RODADA é uma espera do cliente: o cliente escreve (5 mensagens
--   seguidas contam como UMA espera só) e o cronômetro corre até alguém DA
--   EQUIPE responder. Mensagem de robô (bot) NÃO para o cronômetro.
--   Se ninguém respondeu, a rodada NÃO entra na média: ela é contada
--   separadamente como "nunca respondida" (senão a média mentiria).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ÍNDICES — sem isso as contas ficam lentas.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_msg_proto_tempo
  ON at_mensagens (protocolo_id, enviado_em, id);

CREATE INDEX IF NOT EXISTS idx_msg_tipo
  ON at_mensagens (remetente_tipo);

CREATE INDEX IF NOT EXISTS idx_proto_status_ultima
  ON at_protocolos (status_multi360, ultima_mensagem_em);

-- ----------------------------------------------------------------------------
-- 2) TABELA: tempo de resposta mês a mês (competência)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS at_metricas_mensais (
  competencia            DATE PRIMARY KEY,   -- 1º dia do mês (fuso de São Paulo)
  rodadas                INTEGER NOT NULL,   -- quantas esperas do cliente houve
  rodadas_respondidas    INTEGER NOT NULL,
  rodadas_sem_resposta   INTEGER NOT NULL,   -- ninguém respondeu até hoje
  pct_resposta_24h       NUMERIC(5,2),       -- % respondido em até 24h  <- MÉTRICA PRINCIPAL
  mediana_min            NUMERIC(10,1),      -- mediana em minutos (entre respondidas em até 7 dias)
  media_min              NUMERIC(10,1),      -- média em minutos (mesma janela) — poluída por madrugada
  p90_min                NUMERIC(10,1),      -- 90% das respostas vieram até aqui
  calculado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE at_metricas_mensais IS
  'Tempo de resposta por mês. Preenchida por at_recalcular_metricas(). Uma linha por competência.';
COMMENT ON COLUMN at_metricas_mensais.pct_resposta_24h IS
  'Métrica mais honesta para comparar meses: nao sofre com o mes recente ainda ser novo.';

-- ----------------------------------------------------------------------------
-- 3) FUNÇÃO: recalcula o tempo de resposta mês a mês
--    Chame depois de cada sincronização (o leitor roda de 15 em 15 min).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION at_recalcular_metricas()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  linhas INTEGER;
BEGIN
  WITH base AS (
    -- Só cliente e equipe. O robô é ignorado: ele não atende ninguém.
    SELECT id, protocolo_id, enviado_em, remetente_tipo
    FROM at_mensagens
    WHERE remetente_tipo IN ('cliente', 'colaborador')
      AND enviado_em IS NOT NULL
  ),
  calc AS (
    SELECT
      protocolo_id,
      enviado_em,
      remetente_tipo,
      -- quem falou logo antes (para colapsar a rajada do cliente)
      LAG(remetente_tipo) OVER (
        PARTITION BY protocolo_id ORDER BY enviado_em, id
      ) AS tipo_anterior,
      -- a PRÓXIMA mensagem da equipe depois desta linha
      MIN(CASE WHEN remetente_tipo = 'colaborador' THEN enviado_em END) OVER (
        PARTITION BY protocolo_id ORDER BY enviado_em, id
        ROWS BETWEEN 1 FOLLOWING AND UNBOUNDED FOLLOWING
      ) AS proxima_da_equipe
    FROM base
  ),
  rodadas AS (
    -- Início de cada espera: 1ª mensagem do cliente depois de a equipe ter falado.
    SELECT
      DATE_TRUNC('month', enviado_em AT TIME ZONE 'America/Sao_Paulo')::DATE AS competencia,
      EXTRACT(EPOCH FROM (proxima_da_equipe - enviado_em)) / 60.0 AS minutos
    FROM calc
    WHERE remetente_tipo = 'cliente'
      AND tipo_anterior IS DISTINCT FROM 'cliente'
  )
  INSERT INTO at_metricas_mensais AS a (
    competencia, rodadas, rodadas_respondidas, rodadas_sem_resposta,
    pct_resposta_24h, mediana_min, media_min, p90_min, calculado_em
  )
  SELECT
    competencia,
    COUNT(*),
    COUNT(minutos),
    COUNT(*) - COUNT(minutos),
    ROUND(100.0 * COUNT(*) FILTER (WHERE minutos <= 1440) / NULLIF(COUNT(*), 0), 2),
    ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY minutos)
            FILTER (WHERE minutos <= 10080))::NUMERIC, 1),
    ROUND((AVG(minutos) FILTER (WHERE minutos <= 10080))::NUMERIC, 1),
    ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY minutos)
            FILTER (WHERE minutos <= 10080))::NUMERIC, 1),
    NOW()
  FROM rodadas
  GROUP BY competencia
  ON CONFLICT (competencia) DO UPDATE SET
    rodadas              = EXCLUDED.rodadas,
    rodadas_respondidas  = EXCLUDED.rodadas_respondidas,
    rodadas_sem_resposta = EXCLUDED.rodadas_sem_resposta,
    pct_resposta_24h     = EXCLUDED.pct_resposta_24h,
    mediana_min          = EXCLUDED.mediana_min,
    media_min            = EXCLUDED.media_min,
    p90_min              = EXCLUDED.p90_min,
    calculado_em         = NOW();

  GET DIAGNOSTICS linhas = ROW_COUNT;
  RETURN linhas;
END;
$$;

COMMENT ON FUNCTION at_recalcular_metricas() IS
  'Recalcula at_metricas_mensais a partir de at_mensagens. Idempotente. Chamar apos cada sync.';

-- ----------------------------------------------------------------------------
-- 4) TABELA: LINHA DE BASE — a "foto do antes"
--    Uma linha por dia. Daqui a 30 dias o gestor compara com hoje.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS at_linha_base (
  dia                 DATE PRIMARY KEY DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE,
  conversas_abertas   INTEGER,
  -- sem_resposta/sem_resposta_24h saem de ultima_mensagem_direcao.
  -- O robô já foi corrigido em 15/07/2026 (o leitor não marca mais resposta de
  -- robô como se fosse a equipe), então estes números já são os reais.
  sem_resposta        INTEGER,
  sem_resposta_24h    INTEGER,  -- o indicador que o gestor cobra
  -- "Fila antiga (esquecidos)" — mesma conta da tela Auditoria: o cliente falou
  -- por último E está esperando há mais de 60 dias.
  fila_antiga_60d     INTEGER,
  cobrancas_abertas   INTEGER,
  cobrancas_vencidas  INTEGER,
  pct_resposta_24h    NUMERIC(5,2),  -- do mês corrente
  mediana_min         NUMERIC(10,1), -- do mês corrente
  observacao          TEXT,
  medido_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE at_linha_base IS
  'Retrato diario dos indicadores. Serve para provar o "antes e depois" do sistema.';

-- ----------------------------------------------------------------------------
-- 5) FUNÇÃO: tira a foto do dia (roda quantas vezes quiser; regrava o dia)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION at_registrar_linha_base(nota TEXT DEFAULT NULL)
RETURNS at_linha_base
LANGUAGE plpgsql
AS $$
DECLARE
  r at_linha_base;
  mes DATE := DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
BEGIN
  INSERT INTO at_linha_base AS b (
    dia, conversas_abertas, sem_resposta, sem_resposta_24h, fila_antiga_60d,
    cobrancas_abertas, cobrancas_vencidas, pct_resposta_24h, mediana_min, observacao, medido_em
  )
  SELECT
    (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE,
    (SELECT COUNT(*) FROM at_protocolos
      WHERE status_multi360 IN ('ATIVO','AGUARDANDO')),
    (SELECT COUNT(*) FROM at_protocolos
      WHERE status_multi360 IN ('ATIVO','AGUARDANDO')
        AND ultima_mensagem_direcao = 'cliente'),
    (SELECT COUNT(*) FROM at_protocolos
      WHERE status_multi360 IN ('ATIVO','AGUARDANDO')
        AND ultima_mensagem_direcao = 'cliente'
        AND ultima_mensagem_em < NOW() - INTERVAL '24 hours'),
    -- igual à tela Auditoria ("Fila antiga"): sem resposta há mais de 60 dias
    (SELECT COUNT(*) FROM at_protocolos
      WHERE status_multi360 IN ('ATIVO','AGUARDANDO')
        AND ultima_mensagem_direcao = 'cliente'
        AND ultima_mensagem_em < NOW() - INTERVAL '60 days'),
    (SELECT COUNT(*) FROM at_cobrancas WHERE status = 'ABERTA'),
    (SELECT COUNT(*) FROM at_cobrancas WHERE status = 'ABERTA' AND prazo < NOW()),
    (SELECT pct_resposta_24h FROM at_metricas_mensais WHERE competencia = mes),
    (SELECT mediana_min      FROM at_metricas_mensais WHERE competencia = mes),
    nota,
    NOW()
  ON CONFLICT (dia) DO UPDATE SET
    conversas_abertas  = EXCLUDED.conversas_abertas,
    sem_resposta       = EXCLUDED.sem_resposta,
    sem_resposta_24h   = EXCLUDED.sem_resposta_24h,
    fila_antiga_60d    = EXCLUDED.fila_antiga_60d,
    cobrancas_abertas  = EXCLUDED.cobrancas_abertas,
    cobrancas_vencidas = EXCLUDED.cobrancas_vencidas,
    pct_resposta_24h   = EXCLUDED.pct_resposta_24h,
    mediana_min        = EXCLUDED.mediana_min,
    observacao         = COALESCE(EXCLUDED.observacao, b.observacao),
    medido_em          = NOW()
  RETURNING * INTO r;
  RETURN r;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6) SEGURANÇA (RLS) — quem está logado no sistema pode LER as métricas.
-- ----------------------------------------------------------------------------
ALTER TABLE at_metricas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE at_linha_base       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS at_metricas_leitura ON at_metricas_mensais;
CREATE POLICY at_metricas_leitura ON at_metricas_mensais
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS at_linha_base_leitura ON at_linha_base;
CREATE POLICY at_linha_base_leitura ON at_linha_base
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 6b) PRÉVIA DA CONVERSA SEM O ROBÔ
--     A tela escreve "Cliente: ..." ou "Equipe: ..." antes da prévia, olhando
--     quem falou por último. Como o robô não conta mais como equipe, a prévia
--     também precisa ignorá-lo — senão a tela mostraria o texto do robô com o
--     rótulo "Cliente:". (Mesmas colunas e mesma ordem de antes.)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_at_monitor AS
SELECT
  p.id, p.numero_protocolo, p.departamento, p.atendente_nome, p.status_multi360,
  p.ultima_mensagem_em, p.ultima_mensagem_direcao, p.possui_anexo,
  c.nome AS cliente_nome, c.telefone AS cliente_telefone,
  COALESCE(
    (SELECT m.texto FROM at_mensagens m
      WHERE m.protocolo_id = p.id AND m.texto IS NOT NULL
        AND m.remetente_tipo IN ('cliente','colaborador')
      ORDER BY m.enviado_em DESC NULLS LAST, m.ordem DESC LIMIT 1),
    (SELECT CASE WHEN m.tem_anexo THEN '[anexo]' END FROM at_mensagens m
      WHERE m.protocolo_id = p.id
        AND m.remetente_tipo IN ('cliente','colaborador')
      ORDER BY m.enviado_em DESC NULLS LAST, m.ordem DESC LIMIT 1)
  ) AS ultima_texto,
  c.nome_normalizado AS cliente_nome_normalizado
FROM at_protocolos p
LEFT JOIN at_clientes c ON c.id = p.cliente_id;

-- ----------------------------------------------------------------------------
-- 7) RODA UMA VEZ AGORA
-- ----------------------------------------------------------------------------
SELECT at_recalcular_metricas() AS meses_calculados;
SELECT * FROM at_registrar_linha_base('linha de base inicial — antes do sistema');

-- Confira o resultado:
SELECT competencia, rodadas, pct_resposta_24h, mediana_min, media_min, rodadas_sem_resposta
FROM at_metricas_mensais
ORDER BY competencia DESC
LIMIT 18;
