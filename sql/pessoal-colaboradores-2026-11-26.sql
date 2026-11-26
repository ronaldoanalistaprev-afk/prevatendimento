-- Cadastro de pessoal: departamentos, dados do colaborador, férias e afastamentos (26/11/2026)
-- Pedido do Ronaldo (DA-64): o colaborador vira um cadastro rico (CPF, admissão, departamentos,
-- ausências). Para a Aposentar, esses dados são LIDOS do PrevSystem pela ponte (NR-173); para um
-- escritório que só tem o PrevAtendimento, são cadastrados aqui (cadastro local).
--
-- PRINCÍPIO DE PRIVACIDADE: hoje `at_colaboradores` é lido por TODOS (lista de nomes, policy
-- `qual = true`). Por isso CPF/endereço/contato NÃO podem ficar nessa tabela — vazariam para
-- qualquer atendente. Os dados sensíveis vão para `at_colaborador_detalhe`, que só quem "vê tudo"
-- (gestor/supervisor/admin, função at_ve_tudo()) lê. Departamentos e ausências idem.
--
-- Só ACRESCENTA (tabelas e colunas novas). Compatível com a versão no ar. O leitor da integração
-- grava com a chave de serviço (passa por cima da RLS).

-- ───────────────────────────────────────────────────────────────────────────
-- 1) at_colaboradores: colunas de VÍNCULO com a fonte (não sensíveis; podem ficar na tabela aberta)
-- ───────────────────────────────────────────────────────────────────────────
alter table public.at_colaboradores
  add column if not exists fonte text not null default 'multi360',   -- 'multi360' | 'prevsystem' | 'local'
  add column if not exists externo_id uuid,                           -- id do colaborador no PrevSystem (fonte='prevsystem')
  add column if not exists versao bigint,                             -- última versão lida da integração (p_desde)
  add column if not exists ausente_desde timestamptz;                 -- saiu da equipe (integração): marca, nunca apaga

comment on column public.at_colaboradores.fonte is 'De onde vem este colaborador: multi360 (nome visto nas conversas), prevsystem (equipe lida da ponte) ou local (cadastrado aqui).';
comment on column public.at_colaboradores.externo_id is 'Id do colaborador no PrevSystem, quando a fonte é a ponte (NR-173). Serve para casar e atualizar sem duplicar.';
comment on column public.at_colaboradores.ausente_desde is 'Quando a pessoa saiu da equipe (sumiu do universo da ponte). Marca, não apaga: o histórico (mensagens, cobranças) continua.';

-- Casar/atualizar o mesmo colaborador do PrevSystem sem duplicar.
create unique index if not exists at_colaboradores_externo_uidx
  on public.at_colaboradores (empresa_id, externo_id) where externo_id is not null;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) at_colaborador_detalhe: dados PESSOAIS (sensíveis). 1 para 1 com at_colaboradores.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.at_colaborador_detalhe (
  colaborador_id  uuid primary key references public.at_colaboradores(id) on delete cascade,
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cpf             text,          -- só dígitos (exibir com máscara)
  rg              text,
  data_nascimento date,
  sexo            text,
  email           text,
  telefone        text,          -- só dígitos
  whatsapp        text,          -- só dígitos
  cep             text,          -- só dígitos
  logradouro      text,
  numero          text,
  complemento     text,
  bairro          text,
  cidade          text,
  uf              text,
  data_admissao   date,
  funcao          text,          -- nome da função (vem como texto da ponte)
  tipo_vinculo    text,          -- nome do tipo de vínculo (idem)
  atualizado_em   timestamptz not null default now()
);
comment on table public.at_colaborador_detalhe is 'Dados pessoais do colaborador (CPF, endereço, admissão, função, vínculo). Sensível: só quem vê tudo lê. Para a Aposentar, preenchido pela ponte do PrevSystem; para escritório só-PrevAtendimento, pelo cadastro local.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) at_setores: departamentos do escritório.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.at_setores (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  nome           text not null,
  ativo          boolean not null default true,
  responsavel_id uuid references public.at_colaboradores(id) on delete set null,  -- coordenador
  fonte          text not null default 'local',   -- 'prevsystem' | 'local'
  externo_id     uuid,                             -- id do setor no PrevSystem
  criado_em      timestamptz not null default now()
);
create unique index if not exists at_setores_nome_uidx on public.at_setores (empresa_id, lower(nome));
create unique index if not exists at_setores_externo_uidx on public.at_setores (empresa_id, externo_id) where externo_id is not null;
comment on table public.at_setores is 'Departamentos (setores) do escritório. Para a Aposentar, vêm da ponte do PrevSystem; para escritório só-PrevAtendimento, cadastrados aqui.';

-- ───────────────────────────────────────────────────────────────────────────
-- 4) at_colaborador_setores: a pessoa pode estar em VÁRIOS departamentos.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.at_colaborador_setores (
  colaborador_id uuid not null references public.at_colaboradores(id) on delete cascade,
  setor_id       uuid not null references public.at_setores(id) on delete cascade,
  primary key (colaborador_id, setor_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 5) at_ausencias: férias e afastamentos (só tipo e período; motivo NÃO entra — pode ser saúde).
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.at_ausencias (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid not null references public.at_colaboradores(id) on delete cascade,
  tipo           text not null,          -- "Férias" quando ferias=true; senão "Ausência"
  ferias         boolean not null default false,
  inicio         date,
  fim            date,
  criado_em      timestamptz not null default now()
);
create index if not exists at_ausencias_colab_idx on public.at_ausencias (colaborador_id);
comment on table public.at_ausencias is 'Férias e afastamentos do colaborador. Só o tipo e o período — nunca o motivo (afastamento pode ser dado de saúde). Sensível: só quem vê tudo lê.';

-- ───────────────────────────────────────────────────────────────────────────
-- 6) RLS: dados de pessoal só para quem "vê tudo" (at_ve_tudo()). O leitor da integração usa a
--    chave de serviço e passa por cima. O cadastro local (admin/gestor) grava pela sessão.
-- ───────────────────────────────────────────────────────────────────────────
alter table public.at_colaborador_detalhe enable row level security;
alter table public.at_setores             enable row level security;
alter table public.at_colaborador_setores enable row level security;
alter table public.at_ausencias           enable row level security;

-- at_colaborador_detalhe
drop policy if exists at_colab_detalhe_leitura on public.at_colaborador_detalhe;
drop policy if exists at_colab_detalhe_inserir on public.at_colaborador_detalhe;
drop policy if exists at_colab_detalhe_editar  on public.at_colaborador_detalhe;
drop policy if exists at_colab_detalhe_excluir on public.at_colaborador_detalhe;
create policy at_colab_detalhe_leitura on public.at_colaborador_detalhe for select using ((select at_ve_tudo()));
create policy at_colab_detalhe_inserir on public.at_colaborador_detalhe for insert with check ((select at_ve_tudo()));
create policy at_colab_detalhe_editar  on public.at_colaborador_detalhe for update using ((select at_ve_tudo())) with check ((select at_ve_tudo()));
create policy at_colab_detalhe_excluir on public.at_colaborador_detalhe for delete using ((select at_ve_tudo()));

-- at_setores
drop policy if exists at_setores_leitura on public.at_setores;
drop policy if exists at_setores_inserir on public.at_setores;
drop policy if exists at_setores_editar  on public.at_setores;
drop policy if exists at_setores_excluir on public.at_setores;
create policy at_setores_leitura on public.at_setores for select using ((select at_ve_tudo()));
create policy at_setores_inserir on public.at_setores for insert with check ((select at_ve_tudo()));
create policy at_setores_editar  on public.at_setores for update using ((select at_ve_tudo())) with check ((select at_ve_tudo()));
create policy at_setores_excluir on public.at_setores for delete using ((select at_ve_tudo()));

-- at_colaborador_setores
drop policy if exists at_colab_setores_leitura on public.at_colaborador_setores;
drop policy if exists at_colab_setores_inserir on public.at_colaborador_setores;
drop policy if exists at_colab_setores_excluir on public.at_colaborador_setores;
create policy at_colab_setores_leitura on public.at_colaborador_setores for select using ((select at_ve_tudo()));
create policy at_colab_setores_inserir on public.at_colaborador_setores for insert with check ((select at_ve_tudo()));
create policy at_colab_setores_excluir on public.at_colaborador_setores for delete using ((select at_ve_tudo()));

-- at_ausencias
drop policy if exists at_ausencias_leitura on public.at_ausencias;
drop policy if exists at_ausencias_inserir on public.at_ausencias;
drop policy if exists at_ausencias_editar  on public.at_ausencias;
drop policy if exists at_ausencias_excluir on public.at_ausencias;
create policy at_ausencias_leitura on public.at_ausencias for select using ((select at_ve_tudo()));
create policy at_ausencias_inserir on public.at_ausencias for insert with check ((select at_ve_tudo()));
create policy at_ausencias_editar  on public.at_ausencias for update using ((select at_ve_tudo())) with check ((select at_ve_tudo()));
create policy at_ausencias_excluir on public.at_ausencias for delete using ((select at_ve_tudo()));

-- ───────────────────────────────────────────────────────────────────────────
-- Como reverter:
--   drop table if exists public.at_ausencias, public.at_colaborador_setores,
--     public.at_setores, public.at_colaborador_detalhe cascade;
--   alter table public.at_colaboradores
--     drop column if exists fonte, drop column if exists externo_id,
--     drop column if exists versao, drop column if exists ausente_desde;
--   drop index if exists public.at_colaboradores_externo_uidx;
