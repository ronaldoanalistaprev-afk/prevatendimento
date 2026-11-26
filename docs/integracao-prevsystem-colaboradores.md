# Integração de colaboradores — PrevSystem → PrevAtendimento (DA-64)

> Contrato do nosso lado (consumidor). A **fonte da verdade** do contrato é do PrevSystem:
> `E:\Projetos\SIAP\PrevSystem\docs\integracao-prevatendimento.md` (NR-173 de lá). Este arquivo é o
> resumo do que o PrevAtendimento faz. Combinado em 26/11/2026 entre a "⚫ PrevAtendimento 09" e a
> "🟦 PrevSystem 27". Autorizado pelo Ronaldo **na conversa do PrevSystem** ("1. Sim, construir", NR-173).

## Por que existe
DA-64: para escritório que usa mais de um sistema do SIAP (a **Aposentar**), o colaborador tem **fonte
única no PrevSystem** — o PrevAtendimento **lê** de lá (não recadastra), "para não ter dados divergentes
entre saas que um escritório tenha comprado". Escritório que só tem o PrevAtendimento usa o cadastro
local (parte D). É tudo por `empresa_id`, com chave por escritório. Hoje só a Aposentar.

## Como ligamos (uma vez)
1. **Nós geramos a chave** (32 bytes aleatórios em hexadecimal) e guardamos **só no servidor** do
   PrevAtendimento (variável de ambiente na Vercel; nunca no git, nunca em log).
2. Mandamos ao PrevSystem **só o hash SHA-256** (64 hex) pela conversa do PrevSystem.
3. O PrevSystem grava o hash (`private.integracao_chaves`, `sistema='prevatendimento'`).
4. O **Ronaldo liga** em: PrevSystem → Configurações → Outros Sistemas do Escritório → Integração com o
   PrevAtendimento (só administrador).

## Por onde lê (servidor → servidor, nunca do navegador)
- **Hoje (teste):** `POST https://azskmfohmbmzncbpswqo.supabase.co/rest/v1/rpc/integracao_prevatendimento_ler`
  (banco-rascunho do PrevSystem). Cabeçalho `apikey` = a chave pública (anon) do rascunho
  (`VITE_SUPABASE_ANON_KEY` em `PrevSystem/app/.env.rascunho`, ou `get_publishable_keys` do projeto
  `azskmfohmbmzncbpswqo`). Guardar no nosso servidor, não no git.
- **Produção:** só depois da **próxima publicação do PrevSystem**. Aí trocamos o endereço para o banco de
  produção deles e mandamos o hash da chave de produção (pode ser a mesma chave).
- **Empresa:** não mandamos `empresa_id` — ele sai da própria chave (hoje só Aposentar).
- Ler **depois das 10h** (a revisão diária do PrevSystem roda às 09:40).

### Parâmetros (RPC)
`p_chave` (obrigatória), `p_parte` (`universo` | `colaborador`), `p_desde` (última versão lida; 0 = tudo),
`p_ids` (até 2.000; o `ate` dessa chamada não vale como última versão), `p_limite` (até 2.000; padrão 500).
Resposta: `{ parte, gerado_em, desde, ate, tem_mais, por_ids, itens: [{...objeto, versao}] }`.
Erros: `chave_invalida`, `parte_invalida`, `ids_demais`, `ocupado_tente_de_novo`.

## O que vem (espelhar no nosso modelo)
A **equipe do cadastro novo** da Aposentar (sem os copiados do SIAP Antigo e sem fictícios). Medido no
rascunho em 26/11: **87** (11 ativos, 76 inativos), **5** departamentos, 0 ausências.
- **Ativo:** `id, ativo, nome, cpf` (só dígitos), `rg, data_nascimento, sexo, email, telefone, whatsapp,
  cep, logradouro, numero, complemento, bairro, cidade, uf, data_admissao, funcao, tipo_vinculo,
  departamentos[]` (nomes), `ausencias[]` (`{tipo, ferias, inicio, fim}` — nome do tipo só nas férias; as
  demais "Ausência", sem motivo nem anexo), `versao`.
- **Inativo:** só `id, nome, ativo:false, versao` (quem saiu casa pelo `id` que já recebemos).
- **NÃO vem:** `cargo`, `observacoes`, `destino`, `codigo_legado`, `provisorio`, `ficticio`,
  `origem_legado_id`, `sistema_novo_id`. **Login e permissões não vêm** — cada sistema tem os seus.
- **Parte `universo`:** `{ colaboradores:[ids], usa_departamentos, departamentos:[{id,nome,ativo,
  responsavel_colaborador_id}] }` + `versao_atual`. Colaborador que temos e não veio no universo:
  **marcar "ausente desde", nunca apagar**.

## Como sincronizar (incremental)
Guardar a última `ate` lida e pedir `p_desde = ate`. `tem_mais:true` → repetir com `p_desde = ate`.
Começar com `p_desde = 0`. A lista de departamentos vem inteira a cada leitura (sem versão).

## Avisos do lado do PrevSystem (regra-mãe NR-95 deles)
Se pararmos de ler por mais de 2 dias, aparece `integracao_prevatendimento_parada` nas Pendências do
PrevSystem. Há também `integracao_sem_revisao` e `integracao_com_erro`.

## Parte D — cadastro LOCAL (escritório sem PrevSystem)
Mesmos campos do objeto acima, com as regras do Documento Mestre (CPF com dígito, máscaras, ViaCEP no
CEP). Referência da tela do PrevSystem: `app/src/pages/ColaboradorForm.tsx` (lista em `ColaboradoresList.tsx`).

## Estado (26/11/2026)
- Ponte **pronta no rascunho** do PrevSystem. Falta: construir o **nosso reader** (servidor) + o **modelo
  de dados** daqui; gerar a chave e mandar o hash; o Ronaldo ligar pela tela do PrevSystem; e a virada
  para produção quando o PrevSystem publicar.
