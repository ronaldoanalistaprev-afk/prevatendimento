-- Integração Multi360 na nuvem (19/11/2026)
-- O token do Multi360 deixa de morar no .env do computador do Ronaldo e passa a morar aqui,
-- numa tabela por escritório. A função de sincronização (Edge Function) lê o token daqui com a
-- chave de serviço; a telinha de administrador atualiza o token quando ele vencer.
-- Nada de token aparece para quem não é administrador, e a telinha nunca MOSTRA o token (só troca).

create table if not exists public.at_integracao_multi360 (
  empresa_id    uuid primary key references public.empresas(id) on delete cascade,
  token         text,                                           -- segredo: acesso ao Multi360
  base_url      text not null default 'https://painel.multi360.com.br/api',
  dominio       text,
  empresa_slug  text not null default 'aposentar',
  token_status  text not null default 'desconhecido',           -- 'ok' | 'vencido' | 'desconhecido'
  ultimo_erro   text,
  ultima_sync   timestamptz,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);

comment on table public.at_integracao_multi360 is 'Token e estado da sincronização com o Multi360, por escritório. Token lido pela Edge Function (service role); trocado pela tela de administrador.';

alter table public.at_integracao_multi360 enable row level security;

-- Só o administrador do escritório atualiza (para colar um token novo). A Edge Function usa a chave
-- de serviço, que passa por cima da RLS. Ninguém mais lê nem escreve esta tabela.
-- Escritório único hoje (Aposentar); a trava é "ser administrador". A Edge Function usa a chave de
-- serviço e passa por cima da RLS. (Quando houver mais de um escritório, acrescentar o empresa_id.)
drop policy if exists at_integracao_admin on public.at_integracao_multi360;
create policy at_integracao_admin on public.at_integracao_multi360
  for all to authenticated
  using ((select public.at_sou_admin()))
  with check ((select public.at_sou_admin()));

-- Visão de ESTADO, sem o token, para a tela de administrador mostrar "em dia / vencido / última sync"
-- sem nunca trazer o segredo ao navegador.
create or replace view public.v_at_integracao_status
with (security_invoker = on) as
  select empresa_id, token_status, ultima_sync, ultimo_erro, atualizado_em,
         (token is not null and length(token) > 0) as tem_token
  from public.at_integracao_multi360;

-- Semente: uma linha para o escritório Aposentar, ainda sem token (o Ronaldo cola pela tela).
insert into public.at_integracao_multi360 (empresa_id, dominio, empresa_slug)
select e.id, null, 'aposentar'
from public.empresas e
where e.slug = 'aposentar'
on conflict (empresa_id) do nothing;

-- ── Segredo do agendador (aplicado em 19/11/2026) ────────────────────────────
-- O pg_cron (dentro do banco) lê este segredo e o manda no cabeçalho x-cron-secret;
-- a Edge Function compara com ele. Não vem de variável de ambiente (não dá para
-- defini-la pelo MCP). A view v_at_integracao_status NÃO expõe esta coluna.
alter table public.at_integracao_multi360 add column if not exists cron_secret text;
update public.at_integracao_multi360
set cron_secret = encode(gen_random_bytes(24), 'hex')
where cron_secret is null;

-- ── Extensões + agendamento (aplicado em 19/11/2026) ─────────────────────────
-- A função responde em ~1,4s (202) e sincroniza em SEGUNDO PLANO (até 400s, plano
-- Pro). O pg_net só dispara e não espera o ciclo terminar.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- A cada 15 min: POST na Edge Function com o segredo lido fresco da tabela.
-- (Idempotente: se um ciclo for cortado aos 400s, o próximo retoma.)
select cron.schedule('sincronizar-multi360', '*/15 * * * *', $cron$
  select net.http_post(
    url := 'https://cgnudnxivpeyzcurdzkt.supabase.co/functions/v1/sincronizar-multi360',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select cron_secret from public.at_integracao_multi360 where empresa_slug = 'aposentar')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 8000
  );
$cron$);

-- Reverter o agendamento:  select cron.unschedule('sincronizar-multi360');
-- Ver o histórico:         select * from cron.job_run_details where jobid =
--                            (select jobid from cron.job where jobname='sincronizar-multi360')
--                            order by start_time desc limit 10;
