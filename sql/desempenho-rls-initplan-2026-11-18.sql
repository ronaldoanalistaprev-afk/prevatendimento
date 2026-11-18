-- Desempenho (18/11/2026): as regras de acesso (RLS) chamavam at_ve_tudo()/at_meu_colaborador()/at_sou_admin()/auth.uid()
-- UMA VEZ POR LINHA. Envolver em (select ...) faz o Postgres calcular uma vez por consulta (initPlan).
-- Quem vê o quê NÃO muda: as funções não dependem da linha. Reversão: ver bloco REVERTER no fim.
do $$
declare r record;
begin
  for r in
    select policyname, tablename,
      regexp_replace(regexp_replace(qual,'\m(at_ve_tudo|at_meu_colaborador|at_sou_admin)\(\)','(select \1())','g'),'\mauth\.uid\(\)','(select auth.uid())','g') q,
      regexp_replace(regexp_replace(with_check,'\m(at_ve_tudo|at_meu_colaborador|at_sou_admin)\(\)','(select \1())','g'),'\mauth\.uid\(\)','(select auth.uid())','g') w
    from pg_policies
    where schemaname='public'
      and (coalesce(qual,'')||coalesce(with_check,'')) ~ '\m(at_ve_tudo|at_meu_colaborador|at_sou_admin)\(\)|auth\.uid\(\)'
      and (coalesce(qual,'')||coalesce(with_check,'')) !~ '\(select (at_ve_tudo|at_meu_colaborador|at_sou_admin|auth\.uid)\(\)\)'
  loop
    execute format('alter policy %I on public.%I%s%s', r.policyname, r.tablename,
      case when r.q is not null then ' using ('||r.q||')' else '' end,
      case when r.w is not null then ' with check ('||r.w||')' else '' end);
  end loop;
end $$;
-- REVERTER: trocar '(select X())' por 'X()' com o mesmo laço (regexp_replace(qual,'\(select ((at_ve_tudo|at_meu_colaborador|at_sou_admin|auth\.uid)\(\))\)','\1','g')).

-- Segurança (18/11/2026): v_at_monitor era a única visão sem security_invoker (rodava como dono, ignorando as regras de acesso).
-- Conferido antes: atendente comum passa a ver só as dele (atendente_nome = responsavel_id em 100% dos casos); custo 2 ms.
alter view public.v_at_monitor set (security_invoker = on);
-- REVERTER: alter view public.v_at_monitor reset (security_invoker);
