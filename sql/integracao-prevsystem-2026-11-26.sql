-- Integração de colaboradores PrevSystem → PrevAtendimento: configuração (26/11/2026)
-- A tabela guarda a configuração e o estado da leitura (DA-64 / NR-173). A NOSSA chave secreta e a
-- chave pública do PrevSystem são GRAVADAS À PARTE (consulta direta, não neste arquivo nem no git).
-- Lida só pela Edge Function `sincronizar-prevsystem` com a chave de serviço.

create table if not exists public.at_integracao_prevsystem (
  empresa_slug  text primary key,
  empresa_id    uuid references public.empresas(id) on delete cascade,
  endpoint_url  text not null,     -- RPC do PrevSystem (rascunho hoje; produção depois)
  apikey        text not null,     -- chave pública (anon) do banco do PrevSystem (cabeçalho apikey)
  chave         text not null,     -- NOSSA chave secreta (p_chave); o PrevSystem guarda só o hash SHA-256
  cron_secret   text not null,     -- protege o disparo da nossa Edge Function (x-cron-secret)
  ultima_versao bigint not null default 0,  -- última versão lida (p_desde)
  ultima_sync   timestamptz,
  ultimo_erro   text,
  ligado        boolean not null default true,
  atualizado_em timestamptz not null default now()
);
comment on table public.at_integracao_prevsystem is 'Configuração e estado da leitura dos colaboradores do PrevSystem (ponte NR-173/DA-64). Guarda a NOSSA chave secreta e a chave pública do PrevSystem. Lida só pela Edge Function com a chave de serviço.';

alter table public.at_integracao_prevsystem enable row level security;
-- Sem políticas de usuário: só a chave de serviço (Edge Function) lê e escreve.

-- Os VALORES (endpoint, apikey, chave, cron_secret) foram gravados à parte, por consulta direta, para
-- o segredo não entrar no histórico de migrações nem no git. Modelo:
--   insert into public.at_integracao_prevsystem (empresa_slug, empresa_id, endpoint_url, apikey, chave, cron_secret)
--   select 'aposentar', (select id from empresas where slug='aposentar'),
--     'https://<rascunho>.supabase.co/rest/v1/rpc/integracao_prevatendimento_ler',
--     '<anon do PrevSystem>', '<nossa chave 32 bytes hex>', encode(extensions.gen_random_bytes(24),'hex');

-- Reverter: drop table if exists public.at_integracao_prevsystem;
