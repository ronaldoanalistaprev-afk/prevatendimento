# Auditoria de aparência e uso — PrevAtendimento × Apple Design (18/11/2026)

Auditoria **só de leitura**: nenhum arquivo do sistema foi alterado. Conferi o código (`web/src/app/**`, `web/src/components/**`, `web/src/lib/utils.ts`, as folhas `globals.css` e `apple-design.css`) contra:

- a skill `.claude/skills/apple-design/SKILL.md`;
- a base de referência `docs/apple-design/` (`estilo.css`, `comportamento.js`, `monitor-referencia.html` e as duas fotos do Monitor) e o pacote do PrevSystem em `Laboratório de Design/entregas/prevsystem/` (`DECISOES.md`, fotos 04 e 14);
- o Documento Mestre v2 (Regras 2, 23, 24, 27–30, 39, 42–55, 57).

Não abri o sistema no navegador. Onde o achado depende da medida na tela (rolagem lateral), escrevi "provável" e o motivo no código. Tudo o que está aqui foi visto no código ou nas fotos; nada foi suposto.

**Prioridade:** **Alta** = atrapalha o uso ou quebra uma regra do Documento Mestre de forma que o usuário percebe. **Média** = desvio claro da skill ou da referência, ou regra quebrada sem bloquear o uso. **Baixa** = acabamento.

**Contagem:** 93 achados, sendo 16 de prioridade Alta, 37 Média e 40 Baixa. Os 20 achados "transversais" (T1 a T20) valem para várias telas e não se repetem nas seções de cada tela.

---

## Resumo: as 10 correções que mais rendem

1. **Aviso de sucesso no pé da tela, com "Desfazer" (T1).** A folha já tem `.aviso-pe` (`apple-design.css:396-408`), mas nenhum componente usa. Hoje nenhuma ação (criar cobrança, resolver, salvar acesso, salvar papel ou modelo, remover do lote) diz "feito". Um componente só de aviso, ligado às 8 ações, cumpre a Regra 43 item 2 e a Regra 50.
2. **Tabelas viram cartões no celular (T2).** Oito tabelas usam `minWidth` + rolagem interna. A classe `.tabela-cartoes` da referência (`apple-design.css:580-595`, foto 04) existe e não é usada em lugar nenhum.
3. **Tirar os `minHeight`/`fontSize` escritos à mão que derrubam o alvo de toque (T3).** São 18 lugares em que um estilo inline sobrescreve o `--alvo` de 44 px e os 16 px do celular, incluindo os filtros mais usados do Monitor.
4. **Confirmação na janela do sistema para Ativar/Desativar (T6).** Hoje Acesso, Papel e Modelo ativam e desativam sem perguntar. Desativar um papel tira o acesso de todos que o têm.
5. **Busca do Monitor enquanto digita (M1).** Tirar o botão "Buscar" e o Enter (Regra 2; a referência não tem botão).
6. **Cancelar ou sair com algo preenchido pergunta antes (T7).** Vale para os 6 formulários e para a matriz de Permissões.
7. **Seletor de Setor/Atendente (T14, T13, M8).** Ele corta o nome com reticências (proibido), mostra o nome sem capitalização, abre um pop-over que pode sair da tela no celular e tem fonte menor que 16 px no celular (o iPhone dá zoom).
8. **Acabar com a rolagem lateral:** a grade fixa de 260 px do detalhe da Pessoa (P1) e o filtro "Ordem" com rótulos longos que não quebram linha (M3).
9. **Avisos e erros anunciados ao leitor de tela (T5).** Basta `role="status"` ou `role="alert"` nos avisos de 10 componentes.
10. **Formulários de cobrança (B1, B6, V6 e T8).** Nome do campo visível (hoje só há texto de exemplo), `<form>` com Enter/Ctrl+Enter (Regra 55) e o botão de ação no petróleo, não em verde nem âmbar.

Logo depois dessas dez vem a tela `/dashboard/gestao` (X1). Ela ficou inteira no visual antigo e ainda abre por endereço.

---

## Achados transversais (valem para várias telas)

**T1 · Nenhuma ação confirma que deu certo · [Alta]**
- **Onde:** `NovaCobranca.tsx:80`, `AcoesCobranca.tsx:56`, `GerenciarAcessos.tsx:83-84`, `GerenciarModelos.tsx:45`, `GerenciarPapeis.tsx:47`, `MarcoZeroAcoes.tsx:63` e `:83`, `nova-senha/page.tsx:47`.
- **Como está:** ao terminar, o código só chama `router.refresh()`. O formulário fecha e o item some ou muda, sem nenhuma mensagem. No Cobrar atendente, o "Cobrança enviada" some em 0,9 s, quando o formulário fecha sozinho (`BotaoCobrar.tsx:58`).
- **Como deveria ser:**
  - Regra 43 item 2: aviso de sucesso no pé da tela, que some sozinho e tem "Fechar".
  - Regra 50: ação que tem volta oferece "Desfazer" (resolver, cancelar ou reabrir cobrança; ativar ou desativar).
  - Referência: `.aviso-pe` (`apple-design.css:396-408`) e `comportamento.js:290` (some em 8 s e pausa com o mouse ou o dedo); foto 04 ("Cliente … ativado." com X).
- **Achado:** a classe existe e não é usada por nenhum componente.

**T2 · Tabelas sem versão em cartão no celular · [Alta]**
- **Onde:**
  - `auditoria/page.tsx:212-213` (minWidth 620)
  - `desempenho/page.tsx:70-71` (720)
  - `cobrancas/page.tsx:132-133` (600)
  - `GerenciarAcessos.tsx:109-110` (720, com ações por linha)
  - `EditorPermissoes.tsx:58-59` (560)
  - `configuracoes/permissoes/page.tsx:39-40` (560)
  - `marco-zero/page.tsx:71-72` (640)
  - `pessoas/page.tsx:31-32` (640)
- **Como deveria ser:** Regra 47 ("no celular, tabelas viram cartões, com o nome de cada informação"). Referência: `.tabela-cartoes` + `td[data-rotulo]` (`apple-design.css:580-595`, foto 04-clientes-celular).
- **Achado:** nenhuma tabela usa `.tabela-cartoes`.

**T3 · Alvos de toque menores que 44 px no celular, por estilo inline que vence o token · [Alta]**
- **Como está:** `minHeight` fixo nestes lugares:
  - `SeletorMultiplo.tsx:80` (34) e `:125` (32)
  - `FiltroCompetencia.tsx:38` (34)
  - `BlocoProtocolo.tsx:36` (30) e `:72` (30)
  - `NovaCobranca.tsx:114` e `:135` (34)
  - `BotaoCobrar.tsx:80` e `:98` (34)
  - `GerenciarAcessos.tsx:132` e `:139` (34)
  - `GerenciarModelos.tsx:83` (36)
  - `AtendentesSemConversaAberta.tsx:71` (36)
  - `MarcoZeroAcoes.tsx:31` (36), `:68` (30) e `:88` (32)
  - `auditoria/page.tsx:117` (selo de 20 px dentro da aba)
- **Outros casos:**
  - O X que limpa a busca do Monitor não tem tamanho nenhum, só o ícone de 16 px (`BuscaMonitor.tsx:47`).
  - As caixas da matriz de Permissões têm 20 px (`EditorPermissoes.tsx:75`).
- **Como deveria ser:**
  - Regra 46: toque de no mínimo 44 × 44 px.
  - DECISOES §2: "alvo de toque de 44 px no celular".
  - A folha já resolve isso pelo `--alvo` e pelas regras `@media (max-width:767px)`, mas o `style` inline as anula.

**T4 · Texto menor que 12 px · [Alta]**
- **Como está:**
  - 10 px: `PainelInicio.tsx:195` e `:199` (barras do Início)
  - 10,5 px: `pessoas/[id]/page.tsx:153`, `ChatBox.tsx:101`
  - 11 px: `colaboradores/page.tsx:198`, `AtendentesSemConversaAberta.tsx:83`, `ChatBox.tsx:96`
  - 11,5 px: `AutoRefresh.tsx:33`, `BlocoProtocolo.tsx:87` e `:93` (nome e hora nos balões da conversa), `marco-zero/page.tsx:125`
- **Também abaixo do piso da skill (12,5 px), com 12 px:** `cobrancas/page.tsx:236`, `BlocoProtocolo.tsx:35` e `:67`, `auditoria/page.tsx:117`, `pessoas/[id]/page.tsx:82`.
- **Como deveria ser:** Regra 46 ("nenhum texto abaixo de 12 px"). DECISOES §1: "nenhuma letra abaixo de 12,5 px". O menor token da folha é `--t-pequeno` (13 px; 14 px no celular).

**T5 · Avisos e erros não são anunciados ao leitor de tela · [Alta]**
- **Como está:** nenhum aviso dinâmico tem `role="status"`, `role="alert"` ou `aria-live`. Casos:
  - Entrar e senhas: `login/page.tsx:68-69`, `nova-senha/page.tsx:76`, `conta/page.tsx:77-78`
  - Colaboradores e permissões: `NovoColaborador.tsx:118`, `GerenciarAcessos.tsx:95`, `EditorPermissoes.tsx:88`
  - Cobranças: `BotaoCobrar.tsx:104`, `NovaCobranca.tsx:174`, `AcoesCobranca.tsx:121`
  - Marco Zero: `MarcoZeroAcoes.tsx:36`
- **A única exceção** é o selo de atraso do `SeloAtualizacao.tsx:18`.
- **Como deveria ser:** Regra 46 ("avisos e erros são anunciados"). DECISOES, peça 04: aviso "anunciado (`role="status"`)".

**T6 · Ativar/Desativar sem janela de confirmação · [Alta]**
- **Onde:**
  - `GerenciarAcessos.tsx:154`: botão Power do acesso.
  - `GerenciarPapeis.tsx:132`: desativar papel. O próprio `title` avisa que "quem tiver este papel perde o acesso até reativar".
  - `GerenciarModelos.tsx:123`: desativar modelo.
- **Como está:** executam no clique.
- **Como deveria ser:**
  - Regra 39 item 2: "Ativar/Inativar SEMPRE exige confirmação via modal", com o nome do registro.
  - Regra 50.
  - O `useConfirmacao` já existe e é usado para excluir nesses mesmos arquivos.

**T7 · Cancelar ou sair com dados preenchidos não pergunta · [Alta]**
- **Onde:**
  - Formulários: `NovaCobranca.tsx:178`, `NovoColaborador.tsx:128`, `GerenciarModelos.tsx:90`, `GerenciarPapeis.tsx:98`, `AcoesCobranca.tsx:80`, `BotaoCobrar.tsx:108`.
  - A matriz de Permissões (`EditorPermissoes.tsx:29-32`) guarda as marcações só na tela. Sair sem salvar perde tudo sem aviso, e não há "Desfazer alterações".
- **Como deveria ser:** Regras 28 e 30 (Cancelar com algo preenchido pergunta antes; alerta de dados não salvos) e Regra 27 ("Desfazer alterações" na edição).

**T8 · Cor de ação fora do petróleo · [Média]**
- **Onde:**
  - "Criar cobrança" é um `botao-principal` pintado de verde (`NovaCobranca.tsx:177`).
  - "Cobrar atendente" e "Enviar cobrança" são âmbar (`BotaoCobrar.tsx:68` e `:107`).
  - "Resolver" é verde cheio (`AcoesCobranca.tsx:91`).
  - Os botões Desativar/Ativar são secundários com o texto colorido em âmbar ou verde (`GerenciarModelos.tsx:123`, `GerenciarPapeis.tsx:132`).
  - "Limpar filtros" está em vermelho (`auditoria/page.tsx:135`).
- **Como deveria ser:** DECISOES §2: "uma só cor de ação, petróleo"; verde, âmbar e vermelho "só para situação"; vermelho só para o que é urgente ou destrutivo.

**T9 · Cores hexadecimais da paleta antiga (Tailwind), fora dos tokens · [Média]**
- **Onde:**
  - `lib/utils.ts:7-53`, `:75-81`, `:106-112` e `:287-293`: selos de estágio, status, prioridade e urgência, usados em Pessoas e no Laboratório.
  - `auditoria/page.tsx:20` (`#C2410C`).
  - `AutoRefresh.tsx:35-46` (`#15803D`, `#DCFCE7`, `#16A34A`).
  - `BlocoProtocolo.tsx:62` e `:86-93` (`#ECE5DD`, `#DCF8C6`, roxo `#7E22CE`).
  - `ChatBox.tsx:10-15`, `:68`, `:89`, `:96` e `:101`.
  - `pessoas/[id]/page.tsx:19-22` (`#7E22CE`, `#0891B2`, `#DB2777`).
- **Como deveria ser:** os tokens (`--sucesso`/`--atencao`/`--perigo`/`--acao`/`--recuo-2`) e as classes `.selo-*` (`apple-design.css:300-310`). Regra 44: a aparência não é inventada fora do pacote.

**T10 · `globals.css` ainda carrega o visual antigo · [Média]**
- **Onde:**
  - `globals.css:4-39`: paleta azul SIAP (`--primary #1A3C5A` …).
  - `:42-59`: os tokens antigos são expostos ao Tailwind como `bg-primary` etc.
  - `:62-64`: `* { border-color: #DCE6EF }` azulado em toda borda sem cor.
  - `:67-70`: Montserrat e Open Sans.
  - `:74-77`: barra de rolagem cinza-azulada.
- **Como está:** a `apple-design.css` vence no `body` porque é importada depois (`layout.tsx:3-4`). Mesmo assim, as bordas e as barras de rolagem saem com as cores antigas, e qualquer classe Tailwind de cor traz a paleta velha de volta.
- **Como deveria ser:** a `globals.css` fica reduzida ao `@import "tailwindcss"`. LEIA-ME do pacote: "não se inventa aparência fora da skill".

**T11 · Peças da referência refeitas à mão com `style` · [Média]**
- **Onde:**
  - Cartões de número: `auditoria/page.tsx:156-171`, `acoes/page.tsx:67-80`, `cobrancas/page.tsx:231-238`, `colaboradores/page.tsx:193-200`, `marco-zero/page.tsx:120-128`. A referência já tem `.mon-num` (com estado `.ativo`) e `.numeros` (`apple-design.css:540-544`, `:797-805`).
  - Pop-over inteiro do `SeletorMultiplo.tsx:88-128`.
  - Avatar de iniciais em 5 lugares: `monitor/[id]/page.tsx:56`, `colaboradores/page.tsx:136`, `AtendentesSemConversaAberta.tsx:83`, `pessoas/[id]/page.tsx:55`, `conversas/[id]/page.tsx:36`.
- **Como está:** cada cópia tem padding, raio e sombra diferentes. Exemplo: o cartão "Fila antiga" ativo usa contorno cinza, e o do Monitor usa petróleo.
- **Como deveria ser:** uma classe por peça. DECISOES §1: "um sistema só".

**T12 · Abas (`.aba` + `aria-selected`) no lugar dos chips da referência · [Média]**
- **Onde:**
  - Como links: Situação e Período no Monitor (`monitor/page.tsx:138-149`), tempo na Auditoria (`auditoria/page.tsx:116`), Cobranças (`cobrancas/page.tsx:112` e `:172`).
  - Como botões de alternar: `FiltroOrdem.tsx:35`, prazo em `NovaCobranca.tsx:132`, `BotaoCobrar.tsx:95`, `AcoesCobranca.tsx:72`, `GerenciarModelos.tsx:79`.
- **Como está:** `aria-selected` sem `role="tab"` é ignorado, e o leitor de tela não diz qual está escolhido.
- **Como deveria ser:** referência do Monitor: `.chip` com `aria-current="true"`, cheio em petróleo (`monitor-referencia.html:28-30`, `:115` e `:118`; fotos do Monitor). A classe `.chip` não foi trazida para a `apple-design.css`. Para alternar (prazo), `aria-pressed`.

**T13 · Nome de pessoa sem capitalização (Regra 24) · [Média]**
- **Onde:**
  - `GerenciarAcessos.tsx:128` (`u.nome`), `:139` (opções `a.nome`), `:140` (`vinculoNome`)
  - `NovoColaborador.tsx:107` (`setNome(at.nome)`) e `:111`
  - `BotaoCobrar.tsx:73` (atendente no título do formulário)
  - `cobrancas/page.tsx:207` (`criado_por_nome`)
  - `SeletorMultiplo.tsx:83` e `:113` (atendentes como vêm do Multi360)
  - `ChatBox.tsx:97`, `pessoas/[id]/page.tsx:131` (`ator_nome`), `conversas/page.tsx:58`
- **Como deveria ser:** passar por `formatarNome`, como já é feito no Monitor.

**T14 · Nome de pessoa cortado com reticências · [Alta]**
- **Onde:** `SeletorMultiplo.tsx:80-83`.
- **Como está:** com um atendente marcado, o botão mostra "Atendente: Nome Completo do Atendente" dentro de `maxWidth: 260` com `textOverflow: 'ellipsis'` e `nowrap`, e o nome é cortado.
- **Como deveria ser:** Regra 23 ("nunca cortar nome com reticências: nome longo quebra a linha").

**T15 · "Sem permissão" sem motivo e sem caminho · [Média]**
- **Onde:** `acoes/page.tsx:20`, `auditoria/page.tsx:37`, `desempenho/page.tsx:14`, `colaboradores/page.tsx:71`, `configuracoes/page.tsx:30`, `situacao/page.tsx:28`, `permissoes/page.tsx:16`, `papeis/page.tsx:32`, `modelos/page.tsx:15`, `catalogo/page.tsx:61`.
- **Como está:** só a frase "Você não tem acesso a esta tela.", sem título, sem dizer por quê e sem botão.
- **Como deveria ser:** Regra 45 (sem permissão "diz por quê e o caminho") e Regra 43 item 5 (nenhum beco sem saída). Usar `.vazio` com `.vazio-titulo` e um botão para Início.

**T16 · Erro técnico cru para o usuário · [Média]**
- **Onde:** `BannerConfig.tsx:10-18` e `desempenho/page.tsx:48`.
- **Como está:** o banner mostra `<code>{erro}</code>` e fala em "`web/.env.local`" e "`sql/schema.sql`". O Desempenho mostra `estado.erro` como veio do banco.
- **Como deveria ser:** Regra 43 item 3 e Regra 45 (ERRO): dizer o que aconteceu em linguagem simples e o que fazer ("Tentar de novo", "Avise o administrador").

**T17 · Validação só ao enviar, num erro único longe do campo · [Média]**
- **Onde:**
  - `NovaCobranca.tsx:73-74` e `:174`
  - `nova-senha/page.tsx:41-42`, `conta/page.tsx:29-30` (tamanho e igualdade da senha só no envio)
  - `NovoColaborador.tsx:72-86`, que usa o `required` do navegador, cujo balão é o do navegador e não o do sistema
- **Como deveria ser:** Regras 10, 18 e 19 (em tempo real, mensagem junto do campo, `aria-invalid` + `.erro-campo`, `apple-design.css:324` e `:337`).

**T18 · Link para `#` · [Média]**
- **Onde:** `cobrancas/page.tsx:198` (cobrança sem protocolo) e `marco-zero/page.tsx:134`.
- **Como deveria ser:** Regra 43 item 5 ("nenhum href="#""). Sem destino, o nome fica como texto.

**T19 · Ícone colorido dentro do título de toda tela · [Baixa]**
- **Onde:** é o mesmo bloco em todas as páginas, como em `monitor/page.tsx:100-102`, `acoes/page.tsx:34-36` e `auditoria/page.tsx:90-92`.
- **Como está:** `h1 style={{display:'flex'…}}` com ícone de 22 px.
- **Como deveria ser:** a referência e as fotos têm o título só em texto (`monitor-referencia.html:101`). O ícone fica no menu.

**T20 · Botão só com ícone sem nome para o leitor de tela · [Média]**
- **Onde:** a lixeira em `AcoesCobranca.tsx:107`, `GerenciarModelos.tsx:126` e `GerenciarPapeis.tsx:136`.
- **Como está:** ícone `aria-hidden` e só `title`.
- **Como deveria ser:** Regra 46 e Regra 52 ("botão só com ícone tem o nome por extenso"). Ex.: `aria-label="Excluir o modelo Cliente sem resposta"`.

---

## Casca: menu lateral e topo do celular (`components/Sidebar.tsx`, `app/dashboard/layout.tsx`)

**C1 · Gaveta do celular sem foco preso · [Média]**
- **Onde:** `Sidebar.tsx:47-62`, `:78` e `:92`.
- **Como está:** ao abrir, o foco não vai para "Fechar o menu", o Tab escapa para a página por trás e, ao fechar, o foco não volta ao botão Menu.
- **Como deveria ser:** DECISOES, peça 13 ("Fechar no alto (cursor nele), Tab preso"); `comportamento.js:76-89` e `:240-242`.

**C2 · Gaveta sem movimento · [Baixa]**
- **Onde:** `Sidebar.tsx:51-54`.
- **Como está:** a gaveta aparece e some de uma vez (troca de classe, sem transição) e não pode ser arrastada de volta.
- **Como deveria ser:** a referência usa mola criticamente amortecida e arrasto 1:1 com projeção (`comportamento.js:66-89`; skill §2-§6), com cross-fade quando "reduzir movimento" está ligado.

**C3 · O topo do celular não diz onde a pessoa está · [Média]**
- **Onde:** `Sidebar.tsx:83`.
- **Como está:** o topo mostra sempre "PrevAtendimento".
- **Como deveria ser:** a referência mostra o nome da tela ("Monitor", na foto do celular; `monitor-referencia.html:98`). Skill §16: toda tela responde "Onde estou?".

**C4 · "Sair da conta" sem retorno · [Baixa]**
- **Onde:** `Sidebar.tsx:67-71`.
- **Como está:** não mostra "Saindo…" nem trata a falha.
- **Como deveria ser:** Regra 50 (botão em andamento mostra que está trabalhando).

**C5 · Sem faixa fina de carregamento na troca de tela · [Baixa]**
- **Onde:** `layout.tsx`.
- **Como está:** só existe o esqueleto do `loading.tsx`.
- **Como deveria ser:** Regra 43 item 1.

**C6 · Componente órfão · [Baixa]**
- **Onde:** `components/UsuarioLogado.tsx` (144 linhas).
- **Como está:** ninguém usa o componente; o próprio `CLAUDE.md` registra isso.
- **Como deveria ser:** apagar.

## Carregando (`app/dashboard/loading.tsx`)

**L1 · Um esqueleto só, com o formato do Monitor, para todas as telas · [Média]**
- **Onde:** `loading.tsx:15-42`.
- **Como está:** Configurações, Minha conta e Colaboradores mostram 3 cartões de número e linhas de lista que nunca vão aparecer ali. O título também vira esqueleto.
- **Como deveria ser:** Regra 45 ("esqueleto no formato do conteúdo"). Referência 14 (foto): o título real fica, e só os dados viram esqueleto. Fazer um `loading.tsx` por rota.

**L2 · O leitor de tela não ouve "Carregando…" · [Média]**
- **Onde:** `loading.tsx:8`.
- **Como está:** há `aria-label` num `<div>` sem papel, o que não é anunciado, e não existe o aviso de demora.
- **Como deveria ser:** texto "Carregando…" em `.so-leitor` e o aviso de demora depois de 10 s (`comportamento.js:339`, `data-demora`; DECISOES, peça 14).

**L3 · Esqueleto montado com estilo inline · [Baixa]**
- **Onde:** `loading.tsx:10-41`.
- **Como está:** todo o esqueleto é feito com `style` inline.
- **Como deveria ser:** usar `.cartao-processo` e `.esq-linha` (`apple-design.css:764-767`).

## Entrar (`app/login/page.tsx`)

**E1 · Campos sem preenchimento automático · [Média]**
- **Onde:** `login/page.tsx:55` e `:61`.
- **Como está:** não há `autoComplete="username"` / `"current-password"`, e o gerenciador de senhas e o navegador não preenchem direito.
- **Como deveria ser:** Regra 51 ("preenchimento automático do navegador permitido").

**E2 · Botão do olho dentro do rótulo da senha · [Baixa]**
- **Onde:** `login/page.tsx:58-66`.
- **Como está:** o botão "Mostrar a senha" fica dentro do `<label>` da Senha. O nome acessível do campo inclui o botão, e clicar no olho também foca o campo.
- **Como deveria ser:** `div.campo` + `label htmlFor`. O mesmo acontece em `nova-senha:62-70`, `conta:57-75` e `NovoColaborador:79-87`.

**E3 · Rodapé com estilo inline · [Baixa]**
- **Onde:** `login/page.tsx:78-81` (e `nova-senha/page.tsx:84-87`).
- **Como está:** o rodapé "© 2026 SIAP" é montado com `style` inline.
- **Como deveria ser:** usar as classes da folha (`.texto-apoio`/`.ajuda`).

## Nova senha (`app/nova-senha/page.tsx`)

**N1 · Link vencido deixa o formulário aberto · [Média]**
- **Onde:** `nova-senha/page.tsx:23`, `:32` e `:76-79`.
- **Como está:** com o link vencido, aparece o erro, mas o formulário continua lá para preencher.
- **Como deveria ser:** Regra 45 (sessão expirada: diz por quê e o caminho) e Regra 43 item 3. Trocar o formulário por "Link expirado" com o botão "Pedir um novo link", que leva ao Entrar.

**N2 · Botão desligado sem explicação · [Baixa]**
- **Onde:** `nova-senha/page.tsx:78`.
- **Como está:** enquanto o link é conferido, o botão fica desligado sem dizer por quê.
- **Como deveria ser:** "Conferindo o link…" (Regra 50, "botão que não pode ser usado explica por quê").

**N3 · Olho sem dica · [Baixa]**
- **Onde:** `nova-senha/page.tsx:66`.
- **Como está:** o botão do olho não tem `title`, e no login tem.
- **Como deveria ser:** igual ao login (Regra 52, sempre com dica).

## Início (`app/dashboard/page.tsx`, `components/PainelInicio.tsx`)

**I1 · Gráfico de meses que depende do mouse · [Média]**
- **Onde:** `PainelInicio.tsx:197`.
- **Como está:** o dado de cada mês (clientes que falaram, sem resposta) só aparece no `title`, ao passar o mouse. No celular isso não existe, e o leitor de tela não tem texto para as barras. Os rótulos têm 10 px (ver T4).
- **Como deveria ser:** Regra 47 ("nada depende de passar o mouse") e Regra 46.

**I2 · Blocos que somem sem explicar · [Baixa]**
- **Onde:** `PainelInicio.tsx:66` e `:98`.
- **Como está:** sem dados, "Quem espera há mais tempo" e "Estamos respondendo?" simplesmente desaparecem.
- **Como deveria ser:** Regra 45, VAZIO: explicar o que vai aparecer ali (`.vazio-curto`).

**I3 · Elemento escondido sem função · [Baixa]**
- **Onde:** `PainelInicio.tsx:145`.
- **Como está:** `<span style={{display:'none'}}>{nome}</span>` não serve para nada.
- **Como deveria ser:** remover.

**I4 · Seta em texto · [Baixa]**
- **Onde:** `PainelInicio.tsx:91` e `:137`.
- **Como está:** seta "→" digitada e fonte inline.
- **Como deveria ser:** ícone lucide (Regra 52: uma família de ícones).

## Monitor Diário (`app/dashboard/monitor/page.tsx` e filtros)

**M1 · A busca precisa de "Buscar" ou Enter · [Alta]**
- **Onde:** `BuscaMonitor.tsx:27` e `:53`.
- **Como deveria ser:** Regra 2 (pesquisa enquanto digita, pausa de cerca de 0,3 s, sem botão nem Enter). A referência não tem botão (`monitor-referencia.html:114`; fotos).

**M2 · Filtro "Ordem" que provavelmente cria rolagem lateral em 320 px · [Alta]**
- **Onde:** `FiltroOrdem.tsx:28-41` (também em `auditoria/page.tsx:133`).
- **Como está:** um `span inline-flex` sem quebra de linha junta "Ordem" + duas abas com texto longo ("Mais recente primeiro" / "Mais antiga primeiro") e `nowrap`. Dá cerca de 400 px de largura mínima.
- **Como deveria ser:** Regra 47 (nunca rolagem lateral). Rótulos curtos ("Recentes"/"Antigas"), um `select` ou deixar quebrar. Conferir na foto de 320 px.

**M3 · Barra de filtros comprida no celular · [Média]**
- **Onde:** `monitor/page.tsx:144-167`.
- **Como está:** a segunda barra tem Período + "ou" + Competência + divisor + Setor + Atendente + Ordem. No celular, isso vira uma pilha longa antes da primeira conversa.
- **Como deveria ser:** a referência de lista no celular usa "Mais filtros (n)" + "Limpar filtros" (`.mais-filtros`, `apple-design.css:566` e `:578`; foto 04).

**M4 · Contagem e paginação no lugar errado · [Baixa]**
- **Onde:** `monitor/page.tsx:188-193` e `:250-254`.
- **Como está:** a contagem "Mostrando…" e o "Limpar filtros" ficam acima da lista. A paginação fica fora do cartão, com setas digitadas ("← Anterior").
- **Como deveria ser:** `.tabela-pe` no pé do cartão, com `.botoes` (`monitor-referencia.html:169`; `apple-design.css:569-571`).

**M5 · Ícone de anexo que o leitor ignora · [Baixa]**
- **Onde:** `monitor/page.tsx:221`.
- **Como está:** o clipe "tem anexo" tem `aria-label` num `<svg>` sem `role="img"`, e o leitor ignora.
- **Como deveria ser:** `role="img"` no ícone, ou o texto em `.so-leitor`.

**M6 · Seletor de Setor/Atendente ruim no celular · [Média]**
- **Onde:** `SeletorMultiplo.tsx:88` (pop-over) e `:80` / `:91`, `FiltroCompetencia.tsx:38` (fonte).
- **Como está:** o pop-over é `position:absolute; left:0; minWidth:250`. Com o botão à direita, a caixa pode sair da tela, e não vira folha. A fonte inline é de 13 e 14 px, e no celular o iPhone dá zoom no campo.
- **Como deveria ser:** no celular, folha que sobe do pé (`.janela` no celular, `apple-design.css:444-457`) e campos de 16 px (`.entrada` no celular).

## Conversa aberta (`app/dashboard/monitor/[id]/page.tsx`, `BlocoProtocolo.tsx`, `BotaoCobrar.tsx`)

**V1 · A tela não tem título · [Média]**
- **Onde:** `monitor/[id]/page.tsx:58`.
- **Como está:** o nome do cliente é um `<div>` e não há `h1`.
- **Como deveria ser:** `h1.titulo` com o nome. Skill §16 (orientação) e Regra 46 (leitor de tela).

**V2 · "← Monitor" perde os filtros · [Média]**
- **Onde:** `monitor/[id]/page.tsx:33` e `:50`.
- **Como está:** o link volta sempre para `/dashboard/monitor` puro. Quem tinha filtrado por setor, atendente ou busca perde a lista; só o período volta, pelo `LembrarPeriodo`.
- **Como deveria ser:** Regra 43 e Regra 42 item 2 (voltar sem perder o que já foi feito).

**V3 · Várias ações principais na mesma tela · [Média]**
- **Onde:** `BlocoProtocolo.tsx:72` (com o âmbar de `BotaoCobrar.tsx:68`).
- **Como está:** cada protocolo tem o botão cheio "Ver as N mensagens anteriores", além do "Cobrar atendente".
- **Como deveria ser:** Regra 50 (uma ação principal por tela). "Ver anteriores" é secundário ou discreto.

**V4 · Formulário de cobrar sem nome nos campos · [Alta]**
- **Onde:** `BotaoCobrar.tsx:88` e `:90-100`.
- **Como está:** a caixa de texto só tem o texto de exemplo. "Prazo (opcional)" é um `div` que não está ligado ao campo de data.
- **Como deveria ser:** Regra 51 ("o nome do campo fica sempre visível… o texto de exemplo não substitui o nome").

**V5 · Botão Expandir/Retrair · [Baixa]**
- **Onde:** `BlocoProtocolo.tsx:36`.
- **Como está:** não tem `aria-expanded` e tem altura de 30 px (ver T3).
- **Como deveria ser:** com `aria-expanded`, como já faz o `Expansivel.tsx:23`.

**V6 · Conversa não encontrada · [Baixa]**
- **Onde:** `monitor/[id]/page.tsx:34`.
- **Como está:** só a frase, sem título nem explicação.
- **Como deveria ser:** Regra 45 (dizer por quê e o próximo passo).

## Ações necessárias (`app/dashboard/acoes/page.tsx`)

**A1 · Detalhe abre fora da vista · [Média]**
- **Onde:** `acoes/page.tsx:46-50`.
- **Como está:** ao clicar num cartão, o detalhe aparece abaixo de todos os cartões, sem levar a tela nem o foco até ele. No celular, parece que o clique não fez nada.
- **Como deveria ser:** levar o foco até o detalhe (skill §16, causa e efeito visível; skill §7, abrir perto de onde veio).

**A2 · "Tudo em dia" no estilo errado · [Baixa]**
- **Onde:** `acoes/page.tsx:53-56`.
- **Como está:** usa o aviso petróleo (`aviso-info`).
- **Como deveria ser:** a referência das Pendências usa `.pend-nada` com o visto verde (`apple-design.css:759-760`; DECISOES, peça 12).

**A3 · Visto de "tudo certo" que o leitor ignora · [Baixa]**
- **Onde:** `acoes/page.tsx:71`.
- **Como está:** o visto tem `aria-label` num `<svg>` sem papel.
- **Como deveria ser:** texto "Tudo certo" em `.so-leitor`.

## Auditoria (`app/dashboard/auditoria/page.tsx`)

**U1 · Manual fixo no topo · [Baixa]**
- **Onde:** `auditoria/page.tsx:102-108`.
- **Como está:** a caixa "Para que serve / Como usar" fica sempre aberta antes do conteúdo.
- **Como deveria ser:** skill §16 ("simplicidade… o caminho comum primeiro, o avançado um nível abaixo"). Pode ser recolhível.

**U2 · Contagem espremida dentro da aba · [Baixa]**
- **Onde:** `auditoria/page.tsx:117`.
- **Como está:** selo de contagem com 20 px e 12 px inline.
- **Como deveria ser:** seguir T3 e T4, ou mostrar a contagem como texto.

**U3 · Lista diferente da do Monitor · [Média]**
- **Onde:** `auditoria/page.tsx:186-201`.
- **Como está:** a lista não tem o botão "Abrir" (só o nome é link) nem paginação.
- **Como deveria ser:** a mesma peça `.mon-item` do Monitor, com `.mon-abrir`, também no celular (`monitor/page.tsx:239`).

**U4 · Faixa de gravidade dita só pela cor · [Média]**
- **Onde:** `auditoria/page.tsx:17-22`, `:231` e `:237`.
- **Como está:** o "% parado" muda de cor em 4 faixas (vermelho, laranja `#C2410C`, âmbar, verde). Sem legenda, a faixa só é dita pela cor.
- **Como deveria ser:** Regra 46 (nada só por cor): um selo com texto ("crítico"/"atenção").

## Desempenho (`app/dashboard/desempenho/page.tsx`)

**D1 · Barra vermelha que só a cor explica · [Média]**
- **Onde:** `desempenho/page.tsx:90-92`.
- **Como está:** a barra fica vermelha quando há cliente esperando há mais de 24 h, e isso só é explicado no rodapé da página.
- **Como deveria ser:** Regra 46 (texto ou ícone junto da cor).

**D2 · Legendas repetidas · [Baixa]**
- **Onde:** `desempenho/page.tsx:55-58`.
- **Como está:** os seis cartões dizem "clique para ver" e têm o mesmo `title`.
- **Como deveria ser:** skill §16 ("rótulos diretos e específicos").

## Cobranças (`app/dashboard/cobrancas/page.tsx`, `NovaCobranca.tsx`, `AcoesCobranca.tsx`)

**B1 · "Nova cobrança" não é um formulário de verdade · [Alta]**
- **Onde:** `NovaCobranca.tsx:93-180`.
- **Como está:** os campos estão num `<div>`, não num `<form>`. Enter não avança de campo e Ctrl+Enter não salva, e é o único formulário de cadastro sem `tecladoFormulario`.
- **Como deveria ser:** Regra 55.

**B2 · "Cancelar" sem dizer o quê, sem volta e sem retorno · [Alta]**
- **Onde:** `AcoesCobranca.tsx:97`.
- **Como está:** o botão "Cancelar" da cobrança tem o mesmo texto do Cancelar de formulário. Ao clicar, a cobrança sai da lista "A resolver" em silêncio.
- **Como deveria ser:** Regra 49 (o botão diz o que faz: "Cancelar cobrança") e Regra 50 (fazer na hora e oferecer "Desfazer" no aviso do pé).

**B3 · Editar cobrança sem nome nos campos · [Alta]**
- **Onde:** `AcoesCobranca.tsx:68` e `:76`.
- **Como está:** o formulário de edição tem caixa de texto e campo de data sem rótulo.
- **Como deveria ser:** Regra 51.

**B4 · Um "Resolver" cheio em cada cartão · [Média]**
- **Onde:** `AcoesCobranca.tsx:91`.
- **Como está:** cada cartão tem um "Resolver" verde cheio, o que dá dezenas de botões principais na tela.
- **Como deveria ser:** Regra 50 (uma ação principal). Na lista, `botao-acao` (petróleo suave).

**B5 · Confirmação de excluir fora da janela do sistema · [Média]**
- **Onde:** `AcoesCobranca.tsx:111-119`.
- **Como está:** a confirmação aparece numa caixa vermelha dentro do cartão.
- **Como deveria ser:** Regras 39 e 50 (janela de confirmação, foco em Cancelar). O `useConfirmacao` já existe.

**B6 · Resultados da busca de cliente pequenos e fora do teclado · [Média]**
- **Onde:** `NovaCobranca.tsx:159-166`.
- **Como está:** cada resultado é um botão de cerca de 36 px, sem setas do teclado e sem `role="listbox"`.
- **Como deveria ser:** Regras 25 e 46 (seleção pesquisável, alvo de 44 px no celular).

**B7 · Filtro de situação solto · [Baixa]**
- **Onde:** `cobrancas/page.tsx:169-174`.
- **Como está:** o filtro fica solto entre os cartões, fora do cartão da lista.
- **Como deveria ser:** referência: filtros e lista no mesmo cartão (DECISOES, peça 03).

**B8 · Aviso de vínculo com estilo inline · [Baixa]**
- **Onde:** `cobrancas/page.tsx:185`.
- **Como está:** o aviso "login não vinculado" é um parágrafo com cor e tamanho inline.
- **Como deveria ser:** `.aviso aviso-atencao` com ícone.

## Colaboradores (`app/dashboard/colaboradores/page.tsx`, `GerenciarAcessos.tsx`, `NovoColaborador.tsx`, `AtendentesSemConversaAberta.tsx`)

**K1 · Senha mínima diferente entre telas · [Média]**
- **Onde:** `NovoColaborador.tsx:80` × `nova-senha/page.tsx:41` e `conta/page.tsx:29`.
- **Como está:** o cadastro pede "mín. 6", e Nova senha e Minha conta exigem 8.
- **Como deveria ser:** a mesma regra em todo lugar (skill §16, familiaridade e consistência).

**K2 · Cadastro sem "Limpar" e sem marca de obrigatório · [Média]**
- **Onde:** `NovoColaborador.tsx:72-77` e `:124-129`.
- **Como está:** não há botão "Limpar" nem `*` nos campos obrigatórios.
- **Como deveria ser:** Regras 27 e 29 (botões padrão) e Regra 51 (obrigatório com `*`, `.rotulo .obrig`).

**K3 · Edição na linha da tabela só com ícones · [Média]**
- **Onde:** `GerenciarAcessos.tsx:132-149`.
- **Como está:** a edição de papel e vínculo acontece na própria linha, com ✓ e ✕ só em ícone. No celular, fica dentro de uma tabela que rola de lado.
- **Como deveria ser:** Regra 49 ("Salvar acesso" escrito). Editar numa janela (`.janela`, que no celular vira folha).

**K4 · Situação como texto colorido · [Baixa]**
- **Onde:** `GerenciarAcessos.tsx:142`.
- **Como está:** "Ativo/Inativo" aparece como texto colorido.
- **Como deveria ser:** `.selo-sucesso`/`.selo-neutro`, como na foto 04.

**K5 · Lista "sem conversa em aberto" · [Baixa]**
- **Onde:** `AtendentesSemConversaAberta.tsx:69` e `:92`.
- **Como está:** a busca tem largura fixa de 200 px, e o "Ver todos" não tem `aria-expanded`.
- **Como deveria ser:** a busca ocupa a largura (`.caixa-icone` sem largura fixa) e o "Ver todos" ganha `aria-expanded`.

## Configurações (`configuracoes/**`, `catalogo`, `EditorPermissoes.tsx`, `GerenciarPapeis.tsx`, `GerenciarModelos.tsx`)

Tabela e caixas da matriz de Permissões: ver T2 e T3. Desativar papel ou modelo: ver T6.

**G1 · Cartões de Configurações remendados · [Baixa]**
- **Onde:** `configuracoes/page.tsx:56-57`.
- **Como está:** os cartões são inline, com `minHeight:150`, e o ícone usa `.vazio-icone`, que é a peça do estado vazio.
- **Como deveria ser:** uma peça própria, com as linhas clicáveis da referência (`.pend-item`, `apple-design.css:747-753`).

**G2 · Salvar permissões dentro de um rodapé de janela · [Baixa]**
- **Onde:** `EditorPermissoes.tsx:83`.
- **Como está:** o botão Salvar e a mensagem ficam num `.janela-pe` fora de janela.
- **Como deveria ser:** `.barra-acoes` presa no pé (`apple-design.css:411-425`), que é a peça da referência para formulário longo.

**G3 · Erro com ícone de lixeira · [Baixa]**
- **Onde:** `GerenciarPapeis.tsx:95` e `:142`.
- **Como está:** a mensagem de erro usa o ícone da lixeira.
- **Como deveria ser:** ícone de alerta (Regra 52).

**G4 · Títulos em caixa alta forçada · [Baixa]**
- **Onde:** `catalogo/page.tsx:25` e `pessoas/[id]/page.tsx:146` e `:153`.
- **Como está:** títulos de subseção com `textTransform: uppercase`.
- **Como deveria ser:** `.sub-titulo`/`.grupo-titulo` da folha, sem caixa alta.

## Marco Zero (`app/dashboard/marco-zero/page.tsx`, `MarcoZeroAcoes.tsx`)

**Z1 · "pessoa(s)" · [Média]**
- **Onde:** `marco-zero/page.tsx:58` e `MarcoZeroAcoes.tsx:23`.
- **Como deveria ser:** Regra 48 (singular e plural certos, nunca "(s)").

**Z2 · Falha em silêncio · [Média]**
- **Onde:** `MarcoZeroAcoes.tsx:63` e `:83`.
- **Como está:** se remover a pessoa ou desfazer o lote der errado (`r.ok` falso), nada é dito.
- **Como deveria ser:** Regra 43 item 3.

**Z3 · Mensagem do "Preparar lote" só por cor · [Baixa]**
- **Onde:** `MarcoZeroAcoes.tsx:36`.
- **Como está:** a mensagem é verde ou âmbar, sem ícone.
- **Como deveria ser:** `.aviso` com ícone (Regra 46).

## Minha conta (`app/dashboard/conta/page.tsx`)

Não há achado próprio além de T5, T17 e E2.

## Laboratório WhatsApp (`conversas/**`, `ChatBox.tsx`, `PainelWhatsApp.tsx`)

Só o administrador vê esta área (`conversas/page.tsx:19`), por isso os achados próprios ficaram em Baixa.

**W1 · Rolagem suave que ignora "reduzir movimento" · [Baixa]**
- **Onde:** `ChatBox.tsx:33`.
- **Como está:** `scrollIntoView({behavior:'smooth'})` é feito por código, e a regra global de CSS não alcança.
- **Como deveria ser:** skill §14 e Regra 46.

**W2 · "Lido" e "entregue" só pela cor · [Baixa]**
- **Onde:** `ChatBox.tsx:12-13`.
- **Como está:** os dois tiques diferem só pela cor (azul ou cinza).
- **Como deveria ser:** Regra 46 (nada só por cor): `title` ou texto em `.so-leitor`.

**W3 · Enviar desligado sem explicação · [Baixa]**
- **Onde:** `conversas/nova/page.tsx:73`.
- **Como está:** o botão "Enviar" fica desligado sem dizer o que falta.
- **Como deveria ser:** Regra 50.

**W4 · Cabeçalho apertado · [Baixa]**
- **Onde:** `conversas/page.tsx:26-30`.
- **Como está:** o selo "ao vivo" e o botão principal ficam na mesma linha do título.
- **Como deveria ser:** a `.cabeca` da referência: botão à direita e, no celular, em largura total (`apple-design.css:225-232`).

## Pessoas (`app/dashboard/pessoas/**`)

Esta tela não está no menu.

**P1 · Rolagem lateral certa no celular · [Alta]**
- **Onde:** `pessoas/[id]/page.tsx:66`.
- **Como está:** a grade `minmax(0,1fr) 260px` não muda de forma em nenhuma largura. Em 320 e 390 px, a coluna fixa de 260 px mais o espaço entre colunas empurra a página para o lado.
- **Como deveria ser:** Regra 47. Referência: `.detalhe-grade` vira uma coluna abaixo de 1.100 px (`apple-design.css:610` e `:640`).

**P2 · Rota sem checagem de permissão · [Baixa]**
- **Onde:** `pessoas/page.tsx:9-12`.
- **Como está:** a tela não está no menu nem confere permissão, e só abre por endereço.
- **Como deveria ser:** ou entra no menu com permissão, ou sai.

**P3 · Avatar com uma letra só · [Baixa]**
- **Onde:** `pessoas/[id]/page.tsx:55`.
- **Como está:** o avatar mostra só a primeira letra, e nas outras telas são duas iniciais.
- **Como deveria ser:** o mesmo padrão de duas iniciais das outras telas (ver T11).

## Gestão de Pendências: rota esquecida (`app/dashboard/gestao/page.tsx`)

**X1 · Tela inteira no visual antigo · [Alta]**
- **Onde:** `gestao/page.tsx:35-91`.
- **Como está:**
  - Cores `#1A3C5A`, `#6B7280`, `#EEF2F7`, `#C2410C` e `#15803D`.
  - Título com 24 px inline.
  - Não tem `main#conteudo` nem `.titulo`.
  - Tabela crua, sem versão em cartão.
  - Não confere permissão.
- **Achado:** abre em `/dashboard/gestao`, ao contrário do que diz o `CLAUDE.md` ("não há mais tela no visual antigo").
- **Como deveria ser:** converter ou apagar a rota (os dados já estão no Desempenho).

## Componentes compartilhados

**S1 · Confirmação no celular diferente da referência · [Baixa]**
- **Onde:** `Confirmacao.tsx:93-98`.
- **Como está:** no celular, a janela fica com "Cancelar" (vazado) em cima e a ação embaixo. Ela não tem puxador para arrastar nem entrada animada.
- **Como deveria ser:** a referência 11 põe a ação de risco em vermelho em cima e "Continuar aqui" cheio embaixo, perto do polegar, numa folha que pode ser puxada para baixo (DECISOES, peça 11; skill §7).

**S2 · Confirmação sem `aria-describedby` · [Baixa]**
- **Onde:** `Confirmacao.tsx:83-92`.
- **Como está:** a janela não liga a mensagem ao título, e o leitor de tela lê só o título ao abrir.
- **Como deveria ser:** `aria-describedby` apontando para a mensagem.

**S3 · Seletor que recarrega a lista a cada marcação · [Média]**
- **Onde:** `SeletorMultiplo.tsx:55-64` e `:42-44`.
- **Como está:** cada marcação faz `router.push`. Marcar 5 setores recarrega a lista 5 vezes, com o esqueleto piscando. O Esc fecha, mas o foco não volta ao botão.
- **Como deveria ser:** skill §1 (resposta imediata, sem espera no caminho) e Regra 43 item 7 (o foco volta).

**S4 · "Ao vivo" pulsa sozinho · [Baixa]**
- **Onde:** `AutoRefresh.tsx:11` e `:47-48`.
- **Como está:** o selo pulsa a cada 5 s sem a pessoa pedir.
- **Como deveria ser:** Regra 52 ("nada se mexe sozinho"). Um ponto fixo basta. Cores e tamanho: ver T4 e T9.

**S5 · Aviso de atraso repetido pelo leitor de tela · [Média]**
- **Onde:** `SeloAtualizacao.tsx:17-26`.
- **Como está:** o selo de atraso tem `role="status"` e texto que muda ("há X min"). No Monitor e na Auditoria, a tela se atualiza a cada 5 s, e o leitor de tela repete o aviso longo a cada mudança. Além disso, o texto longo está dentro de uma pílula (`.selo`).
- **Como deveria ser:** um `.aviso aviso-atencao` fixo, anunciado uma vez.

---

### Conferência da contagem

| Seção | Alta | Média | Baixa |
|---|---|---|---|
| Transversais T1–T20 | 8 | 11 | 1 |
| Casca | 0 | 2 | 4 |
| Carregando | 0 | 2 | 1 |
| Entrar | 0 | 1 | 2 |
| Nova senha | 0 | 1 | 2 |
| Início | 0 | 1 | 3 |
| Monitor | 2 | 2 | 2 |
| Conversa aberta | 1 | 3 | 2 |
| Ações necessárias | 0 | 1 | 2 |
| Auditoria | 0 | 2 | 2 |
| Desempenho | 0 | 1 | 1 |
| Cobranças | 3 | 3 | 2 |
| Colaboradores | 0 | 3 | 2 |
| Configurações | 0 | 0 | 4 |
| Marco Zero | 0 | 2 | 1 |
| Laboratório WhatsApp | 0 | 0 | 4 |
| Pessoas | 1 | 0 | 2 |
| Gestão | 1 | 0 | 0 |
| Componentes | 0 | 2 | 3 |
| **Total** | **16** | **37** | **40** |

A Regra 54 (foto em 390, 1440 e 320 px, uso só pelo teclado, aprovação do Ronaldo) continua aberta. Os achados M2 e P1 devem ser confirmados nessa conferência por foto.
