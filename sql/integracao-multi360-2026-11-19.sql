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

-- OBS (aplicado ao vivo, não aqui, porque depende da URL real da função e do segredo no Vault):
--   1) create extension if not exists pg_cron;  create extension if not exists pg_net;
--   2) cron.schedule('sincronizar-multi360', '*/15 * * * *', <net.http_post para a Edge Function>);
--   Reverter o agendamento: select cron.unschedule('sincronizar-multi360');
