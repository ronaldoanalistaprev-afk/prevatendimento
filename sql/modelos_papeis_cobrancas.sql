-- ============================================================
-- PrevAtendimento — Modelos de cobrança, Papéis editáveis e
-- controle de edição das cobranças.
-- Colar INTEIRO no SQL Editor do Supabase (projeto PrevAtendimento).
-- Pode rodar mais de uma vez sem quebrar nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1) MODELOS DE COBRANÇA (textos pré-escritos reutilizáveis)
-- ------------------------------------------------------------
create table if not exists at_modelos_cobranca (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid,
  titulo text not null,
  texto text not null,
  prazo_dias int check (prazo_dias is null or prazo_dias between 1 and 5),
  ativo boolean not null default true,
  ordem int not null default 0,
  vezes_usado int not null default 0,
  criado_por uuid,
  criado_por_nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);

alter table at_modelos_cobranca enable row level security;

drop policy if exists at_modelos_cobranca_auth on at_modelos_cobranca;
create policy at_modelos_cobranca_auth on at_modelos_cobranca
  for all to authenticated using (true) with check (true);

-- Modelos iniciais (só entram se a tabela estiver vazia).
insert into at_modelos_cobranca (titulo, texto, prazo_dias, ordem)
select * from (values
  ('Cliente sem resposta',
   'O cliente falou por último e está sem resposta. Favor responder e registrar o retorno.', 1, 1),
  ('Cliente cobrando retorno do processo',
   'O cliente pediu notícia do processo e não teve resposta. Verifique o andamento e responda com a situação atual.', 2, 2),
  ('Documento pendente com o cliente',
   'Combine com o cliente o envio do documento pendente e registre o prazo aqui na conversa.', 3, 3),
  ('Fila antiga — verificar se ainda é necessário',
   'Esta conversa está parada há bastante tempo. Verifique se o cliente ainda precisa de algo e finalize ou responda.', 5, 4)
) as v(titulo, texto, prazo_dias, ordem)
where not exists (select 1 from at_modelos_cobranca);

-- ------------------------------------------------------------
-- 2) COBRANÇAS — marcas de edição e vínculo com o modelo usado
-- ------------------------------------------------------------
alter table at_cobrancas add column if not exists editado_em timestamptz;
alter table at_cobrancas add column if not exists editado_por uuid;
alter table at_cobrancas add column if not exists editado_por_nome text;
alter table at_cobrancas add column if not exists modelo_id uuid references at_modelos_cobranca(id) on delete set null;

-- Acelera as métricas por período.
create index if not exists at_cobrancas_criado_em_idx on at_cobrancas (criado_em desc);
create index if not exists at_cobrancas_status_idx on at_cobrancas (status);

-- ------------------------------------------------------------
-- 3) PAPÉIS EDITÁVEIS (Administrador cria/edita/exclui)
-- ------------------------------------------------------------
create table if not exists at_papeis (
  codigo text primary key,
  nome text not null,
  descricao text,
  -- sistema = papel de fábrica; não pode ser excluído (o ADMIN também não muda poderes)
  sistema boolean not null default false,
  -- PODERES (é o que o papel PODE FAZER, além das telas liberadas em Permissões)
  pode_ver_tudo boolean not null default false,   -- ve as conversas de todos (false = só as suas)
  pode_cobrar   boolean not null default false,   -- cria, edita, cancela e exclui cobranças
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);

alter table at_papeis enable row level security;

drop policy if exists at_papeis_auth on at_papeis;
create policy at_papeis_auth on at_papeis
  for all to authenticated using (true) with check (true);

-- Os 4 papéis que já existem hoje, com os poderes que o código já aplicava.
insert into at_papeis (codigo, nome, descricao, sistema, pode_ver_tudo, pode_cobrar, ordem) values
  ('ADMIN',       'Administrador', 'Acesso total. Gerencia logins, papéis e permissões.',                 true,  true,  true,  1),
  ('GESTOR',      'Gestor',        'Enxerga tudo e cobra. Não gerencia acessos do sistema.',              true,  true,  true,  2),
  ('SUPERVISOR',  'Supervisor',    'Garante que todo cliente seja respondido. Enxerga tudo e cobra.',     true,  true,  true,  3),
  ('COLABORADOR', 'Colaborador',   'Atendente: vê apenas as próprias conversas e as suas cobranças.',     true,  false, false, 4)
on conflict (codigo) do nothing;

-- O papel do login deixa de ser uma lista fixa no banco (agora quem manda é at_papeis).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'usuarios'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table usuarios drop constraint %I', c.conname);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 4) Conferência rápida (o resultado aparece na tela do Supabase)
-- ------------------------------------------------------------
select 'modelos de cobrança' as tabela, count(*)::text as registros from at_modelos_cobranca
union all
select 'papéis', count(*)::text from at_papeis
union all
select 'papéis de fábrica', string_agg(codigo, ', ' order by ordem) from at_papeis where sistema;
