-- Aplicar no painel do Supabase (SQL Editor) do projeto PrevAtendimento.
-- 1) Tabela de permissões editáveis (papel × tela)  2) Prévia mostra "[anexo]" quando não há texto.

-- 1) Permissões editáveis pelo Administrador
create table if not exists at_permissoes (
  tela text not null,
  role text not null,
  permitido boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (tela, role)
);
alter table at_permissoes enable row level security;
drop policy if exists at_permissoes_auth_all on at_permissoes;
create policy at_permissoes_auth_all on at_permissoes for all to authenticated using (true) with check (true);

-- 2) Prévia da última mensagem: usa o último texto; se não houver, mostra "[anexo]"
create or replace view v_at_monitor as
select
  p.id,
  p.numero_protocolo,
  p.departamento,
  p.atendente_nome,
  p.status_multi360,
  p.ultima_mensagem_em,
  p.ultima_mensagem_direcao,
  p.possui_anexo,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  coalesce(
    (select m.texto from at_mensagens m
       where m.protocolo_id = p.id and m.texto is not null
       order by m.enviado_em desc nulls last, m.ordem desc limit 1),
    (select case when m.tem_anexo then '[anexo]' end from at_mensagens m
       where m.protocolo_id = p.id
       order by m.enviado_em desc nulls last, m.ordem desc limit 1)
  ) as ultima_texto
from at_protocolos p
left join at_clientes c on c.id = p.cliente_id;
