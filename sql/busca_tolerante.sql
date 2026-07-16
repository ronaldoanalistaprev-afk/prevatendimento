-- Busca tolerante (Documento Mestre SIAP — Regras 4 a 7).
-- Colar no SQL Editor do projeto PrevAtendimento. Depois eu re-rodo o leitor p/ preencher a coluna.

-- 1) Coluna com o nome canonizado foneticamente (o leitor preenche via normalizarFonetico)
alter table at_clientes add column if not exists nome_normalizado text;

-- 2) v_at_monitor: expõe o nome normalizado (por ÚLTIMO — CREATE OR REPLACE só deixa
--    adicionar colunas no fim) + mantém a prévia com "[anexo]".
create or replace view v_at_monitor as
select
  p.id, p.numero_protocolo, p.departamento, p.atendente_nome, p.status_multi360,
  p.ultima_mensagem_em, p.ultima_mensagem_direcao, p.possui_anexo,
  c.nome as cliente_nome, c.telefone as cliente_telefone,
  coalesce(
    (select m.texto from at_mensagens m where m.protocolo_id = p.id and m.texto is not null
       order by m.enviado_em desc nulls last, m.ordem desc limit 1),
    (select case when m.tem_anexo then '[anexo]' end from at_mensagens m where m.protocolo_id = p.id
       order by m.enviado_em desc nulls last, m.ordem desc limit 1)
  ) as ultima_texto,
  c.nome_normalizado as cliente_nome_normalizado
from at_protocolos p
left join at_clientes c on c.id = p.cliente_id;

-- 3) Índice para acelerar a busca por trecho (pesquisa em tempo real)
create extension if not exists pg_trgm;
create index if not exists idx_at_clientes_nome_norm on at_clientes using gin (nome_normalizado gin_trgm_ops);
