-- Senha provisória com troca no primeiro acesso (26/11/2026)
-- Pedido do Ronaldo: "faça como o prevsystem em que eu gero uma senha provisória e eles trocam
-- no primeiro acesso". Mesmo molde do PrevSystem (pendência 232 de lá): o administrador define a
-- senha e marca "provisória"; enquanto a marca existir, a pessoa só vê "Criar nova senha" até criar
-- a sua. Ao criar, a marca é apagada.
--
-- UMA coluna nova em public.usuarios. Só ACRESCENTA (compatível com a versão no ar). Nada de dado
-- pessoal. A leitura da própria linha já é permitida pela RLS de hoje (o sistema lê o próprio
-- usuário em getPapelAtual); trocar a senha e apagar a marca é feito no servidor com a chave de
-- serviço, numa coisa só (rota /api/conta/definir-minha-senha), então não precisa de nova política.

alter table public.usuarios
  add column if not exists senha_provisoria_desde timestamptz;

comment on column public.usuarios.senha_provisoria_desde is
  'Quando não é nulo, o acesso está com senha provisória desde esta data: no primeiro login o sistema exige criar uma senha nova antes de qualquer tela. Vira nulo quando a pessoa cria a própria senha.';

-- Como reverter (se precisar desfazer):
--   alter table public.usuarios drop column if exists senha_provisoria_desde;
