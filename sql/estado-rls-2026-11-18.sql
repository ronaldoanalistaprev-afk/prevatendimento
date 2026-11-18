-- FOTOGRAFIA das regras de acesso (RLS) do PrevAtendimento em 18/11/2026, tirada da produção (cgnudnxivpeyzcurdzkt)
-- depois de sql/desempenho-rls-initplan-2026-11-18.sql. Serve de referência e de base para reconstruir/reverter:
-- até aqui, as funções e as policies só existiam no banco (achado do conferente, 18/11/2026).
-- Não rodar inteiro sobre a produção: as policies já existem (create policy daria erro). Use trecho a trecho.

CREATE OR REPLACE FUNCTION public.at_meu_colaborador()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select u.at_colaborador_id
  from public.usuarios u
  where u.id = auth.uid() and coalesce(u.ativo, true)
$function$;

CREATE OR REPLACE FUNCTION public.at_sou_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((
    select u.role = 'ADMIN'
    from public.usuarios u
    where u.id = auth.uid() and coalesce(u.ativo, true)
  ), false)
$function$;

CREATE OR REPLACE FUNCTION public.at_ve_tudo()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((
    select coalesce(p.pode_ver_tudo, u.role in ('ADMIN', 'GESTOR', 'SUPERVISOR'))
    from public.usuarios u
    left join public.at_papeis p on p.codigo = u.role and coalesce(p.ativo, true)
    where u.id = auth.uid() and coalesce(u.ativo, true)
  ), false)
$function$;

-- Visões: todas com security_invoker=on (v_at_monitor desde 18/11/2026).

-- Leitura de quem vê tudo OU só as próprias conversas
create policy at_protocolos_leitura on public.at_protocolos as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (responsavel_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador))));
create policy at_mensagens_leitura on public.at_mensagens as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (EXISTS ( SELECT 1 FROM at_protocolos p
  WHERE ((p.id = at_mensagens.protocolo_id) AND (p.responsavel_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador)))))));
create policy at_anexos_leitura on public.at_anexos as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (EXISTS ( SELECT 1 FROM at_protocolos p
  WHERE ((p.id = at_anexos.protocolo_id) AND (p.responsavel_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador)))))));
create policy at_clientes_leitura on public.at_clientes as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (EXISTS ( SELECT 1 FROM at_protocolos p
  WHERE ((p.cliente_id = at_clientes.id) AND (p.responsavel_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador)))))));
create policy at_protocolo_tags_leitura on public.at_protocolo_tags as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (EXISTS ( SELECT 1 FROM at_protocolos p
  WHERE ((p.id = at_protocolo_tags.protocolo_id) AND (p.responsavel_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador)))))));

-- Cobranças
create policy at_cobrancas_leitura on public.at_cobrancas as PERMISSIVE for SELECT to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (colaborador_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador))));
create policy at_cobrancas_criar on public.at_cobrancas as PERMISSIVE for INSERT to authenticated
  with check (( SELECT at_ve_tudo() AS at_ve_tudo));
create policy at_cobrancas_editar on public.at_cobrancas as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (colaborador_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador))))
  with check ((( SELECT at_ve_tudo() AS at_ve_tudo) OR (colaborador_id = ( SELECT at_meu_colaborador() AS at_meu_colaborador))));
create policy at_cobrancas_excluir on public.at_cobrancas as PERMISSIVE for DELETE to authenticated
  using (( SELECT at_ve_tudo() AS at_ve_tudo));

-- Só quem vê tudo
create policy at_marco_zero_all on public.at_marco_zero as PERMISSIVE for ALL to authenticated
  using (( SELECT at_ve_tudo() AS at_ve_tudo)) with check (( SELECT at_ve_tudo() AS at_ve_tudo));
create policy at_modelos_escrita on public.at_modelos_cobranca as PERMISSIVE for ALL to authenticated
  using (( SELECT at_ve_tudo() AS at_ve_tudo)) with check (( SELECT at_ve_tudo() AS at_ve_tudo));
create policy at_ocorrencias_leitura on public.at_ocorrencias_auditoria as PERMISSIVE for SELECT to authenticated
  using (( SELECT at_ve_tudo() AS at_ve_tudo));
-- Modelo CRI dormente (contactos, conversas, eventos, identificadores, mensagens, missoes, objetivos, pessoas):
-- policy <tabela>_ve_tudo FOR ALL using/with check (( SELECT at_ve_tudo() AS at_ve_tudo)).

-- Só o administrador escreve
create policy at_papeis_escrita on public.at_papeis as PERMISSIVE for ALL to authenticated
  using (( SELECT at_sou_admin() AS at_sou_admin)) with check (( SELECT at_sou_admin() AS at_sou_admin));
create policy at_permissoes_escrita on public.at_permissoes as PERMISSIVE for ALL to authenticated
  using (( SELECT at_sou_admin() AS at_sou_admin)) with check (( SELECT at_sou_admin() AS at_sou_admin));
create policy usuarios_escrita on public.usuarios as PERMISSIVE for ALL to authenticated
  using (( SELECT at_sou_admin() AS at_sou_admin)) with check (( SELECT at_sou_admin() AS at_sou_admin));
-- ref_fases, ref_orgaos, ref_regimes, ref_status_pedido, ref_tipos_beneficio, ref_tipos_servico:
-- policy <tabela>_escrita FOR ALL com at_sou_admin(), igual às de cima.

-- Leitura de usuários: a própria linha ou quem vê tudo
create policy usuarios_leitura on public.usuarios as PERMISSIVE for SELECT to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT at_ve_tudo() AS at_ve_tudo)));

-- Leitura livre para logados (using (true)): at_colaboradores, at_extracao_log, at_linha_base, at_metricas_mensais,
-- at_modelos_cobranca (leitura), at_papeis (leitura), at_permissoes (leitura), at_tags, empresas, ref_* (leitura).
