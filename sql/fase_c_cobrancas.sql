-- Fase C: Painel de Cobrança do Supervisor.
-- O supervisor, ao ver uma conversa parada, "cobra" o colaborador responsável.
-- Aplicar no projeto Supabase PrevAtendimento (cgnudnxivpeyzcurdzkt).

create table if not exists at_cobrancas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  protocolo_id uuid references at_protocolos(id) on delete cascade,
  cliente_id uuid references at_clientes(id) on delete set null,
  -- atendente do Multi360 cobrado
  colaborador_id uuid references at_colaboradores(id) on delete set null,
  colaborador_nome text,
  -- quem criou (supervisor/gestor) — login do nosso sistema
  criado_por uuid references usuarios(id) on delete set null,
  criado_por_nome text,
  mensagem text not null,
  prazo timestamptz,
  status text not null default 'ABERTA' check (status in ('ABERTA','RESOLVIDA','CANCELADA')),
  resolvido_por uuid references usuarios(id) on delete set null,
  resolvido_em timestamptz,
  nota_resolucao text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_cobrancas_colaborador on at_cobrancas(colaborador_id, status);
create index if not exists idx_cobrancas_protocolo on at_cobrancas(protocolo_id);
create index if not exists idx_cobrancas_status on at_cobrancas(status, criado_em desc);

alter table at_cobrancas enable row level security;
drop policy if exists at_cobrancas_auth_all on at_cobrancas;
create policy at_cobrancas_auth_all on at_cobrancas
  for all to authenticated using (true) with check (true);
