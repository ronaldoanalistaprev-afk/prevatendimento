# Conformidade das telas com o Documento Mestre de Padronização (v2)

> Auditoria das telas do PrevAtendimento contra o **Documento Mestre de Padronização – versão 2**
> (`E:\Projetos\SIAP\Documentos Globais\Documento Mestre de Padronização - versão 2.txt`, 56 regras).
> Esta ficha é o detalhe do projeto; o resumo por projeto fica em
> `Documentos Globais\Conformidade do Documento Mestre.txt` (seção PrevAtendimento).
>
> **Legenda:** ✅ feito · 🔄 parcial · ⏳ pendente · 🙋 depende de decisão do Ronaldo · N/A não se aplica.
>
> **Lembrete honesto (regra deste projeto):** o Claude não tem login; `tsc`/build limpo **não** prova
> que a tela está certa. A conferência final no celular (390 px) e no computador (1440 px), em 320 px
> sem rolagem lateral, e a foto para o Ronaldo (Regra 54) **ainda não foram feitas** — dependem de ele
> abrir as telas. Cada item "✅" abaixo é "feito no código", não "fotografado e aprovado".

## Contexto que limita a auditoria

- **Regra 44 (aparência vem do Laboratório de Design):** 🙋 o PrevAtendimento **não** tem pacote de
  entrega do Laboratório nem está na exceção da skill Apple Design. Hoje o visual é "na mão" (estilos
  inline, cores digitadas em cada tela). **Não se inventa aparência.** Falta o Ronaldo decidir (rodada
  no Laboratório vs. incluir o projeto na exceção Apple Design). Por isso esta auditoria trata de
  **comportamento, dados e apresentação de informação** (Partes A e B, e a Parte C que não é "cara do
  sistema": nomes, máscaras, formatos), e **não** mexe em paleta, tipografia ou composição.
- **Regra 56 (dado lido de documento é conferido):** N/A hoje — o PrevAtendimento **espelha** o
  Multi360 e **não lê PDF do INSS** (capacidade futura). A coerência do dado espelhado é cuidada no
  leitor (`multi360-reader/`), fora das telas.

---

## O que foi corrigido nesta rodada (16/11/2026)

Correções seguras e reversíveis, aplicadas na **versão em construção** (o Ronaldo publica quando quiser):

### Regra 43 — diálogos nativos do navegador são PROIBIDOS → janela do sistema ✅
Criado o componente reutilizável **`src/components/Confirmacao.tsx`** (`useConfirmacao()`), que desenha a
confirmação/aviso dentro do sistema e cumpre junto: **Regra 55 item 17** (o foco começa no caminho
seguro — Cancelar/Entendi —, e um Enter por reflexo não apaga nada), **Regra 43 item 7** (Esc fecha, o
Tab fica preso na janela, o foco volta para onde estava) e **Regra 50** (ação destrutiva em vermelho,
nunca o botão principal, dizendo o nome do registro afetado). Trocados os 5 usos de `confirm()`/`alert()`:
- `GerenciarAcessos.tsx` (excluir acesso)
- `GerenciarModelos.tsx` (excluir modelo)
- `GerenciarPapeis.tsx` (excluir papel + aviso "papel em uso")
- `MarcoZeroAcoes.tsx` (remover pessoa do lote; desfazer lote)

### Regra 23 — nome nunca cortado com reticências → quebra de linha ✅
Tirado o corte com `…` (`textOverflow: ellipsis` + `whiteSpace: nowrap`) de **nomes de pessoa**, trocado
por `overflowWrap: anywhere` (o nome quebra a linha):
- `colaboradores/page.tsx` (nome do atendente)
- `AtendentesSemConversaAberta.tsx` (nome do atendente)
- `PainelInicio.tsx` ("Quem espera há mais tempo" — nome do cliente)
- `UsuarioLogado.tsx` (nome de quem está logado, na barra lateral)
- *(prévia de mensagem com `…` foi mantida — Regra 23 fala de nomes, não de texto de mensagem; ex.:
  `auditoria/page.tsx` e `monitor/page.tsx`.)*

### Regra 52 — ícone no lugar de emoji ✅ (nas telas-alvo)
Trocados emojis/glifos usados como ícone por ícones lucide (a mesma família já usada no sistema):
- `monitor/page.tsx`: `📎` → `Paperclip`; `✕ Limpar filtros` → `X`; `✓ vendo só estas` → `Check`.
- `acoes/page.tsx`: `✓` (marca de "tudo certo") → `Check`; removido o `🎉` decorativo.
- `auditoria/page.tsx`: `✕ Limpar filtros` → `X`; removidos os `✓` de rótulo e o `👏` do vazio.
- `cobrancas/page.tsx`: removido o `🎉` do vazio.
- `GerenciarModelos.tsx`, `NovaCobranca.tsx`, `BotaoCobrar.tsx`: `✕ sem prazo` → `X`.
- **Sobra (telas fora desta leva):** `configuracoes/permissoes/page.tsx:63` (`✓`), `login/page.tsx`,
  `nova-senha/page.tsx`, `conta/page.tsx` (`✓`/`⚠`) e `conversas/nova/page.tsx` (`🇧🇷`, tela antiga de
  admin). Próxima rodada.

### Regra 45 — vazio × sem-resultado no Monitor ✅
`monitor/page.tsx`: a tela vazia agora distingue **sem resultado de filtro** (diz isso e oferece
"Limpar filtros") de **primeiro uso** (explica que as conversas aparecem quando o leitor do Multi360
rodar). Antes as duas diziam a mesma frase.

---

## Situação por tela

### Monitor Diário (`monitor/page.tsx`) — tela mais usada
- Regra 1 (filtros específicos): ✅ busca, situação, período/competência, setor, colaborador, ordem;
  "Limpar filtros" aparece quando há filtro; contagem "Mostrando X–Y de N". 🔄 falta a etiqueta
  removível por filtro ligado ("Setor: Benefícios ×").
- Regra 2 (busca em tempo real): ✅ `BuscaMonitor`.
- Regra 23/24 (nome por extenso, capitalizado): ✅ `formatarNome`, sem reticências.
- Regra 31/48 (telefone com máscara, data no padrão + Brasília): ✅ `formatarTelefone`, `formatarDataHora`.
- Regra 39 (listagem): ✅ contagem, paginação, ação "Abrir"; vira cartões (não tabela). 🔄 ordenar por
  coluna não se aplica (é lista de cartões, já ordenada por quem espera há mais tempo).
- Regra 46 (nada só por cor): ✅ a situação tem texto ("Aguardando", "Respondido", "Finalizada") além
  da cor da borda.
- Regra 45 (estados): ✅ vazio/sem-resultado/erro (banner). ⏳ **esqueleto de carregamento** falta.
- Regra 47/54 (celular e foto): ⏳ não conferido no aparelho.

### Início / Painel (`page.tsx` + `PainelInicio.tsx`) — gestor/supervisor
- Regra 23/24: ✅ (corrigido o corte de nome nesta rodada).
- Regra 48 (percentuais): 🔄 conferir se os `%` da faixa de meses usam vírgula e casas certas (proporção = inteiro).
- Regra 45: ⏳ esqueleto de carregamento; estados de erro via `BannerConfig` ✅.
- Regra 52: 🔄 setas `→` em texto de link ("Ver … →") — baixo risco, não trocadas.

### Auditoria (`auditoria/page.tsx`)
- Regra 23/24: ✅ nome por extenso (sem reticências; a prévia de mensagem pode cortar).
- Regra 1/45: ✅ "Limpar filtros", vazio/sem-resultado. 🔄 `✓` e `✕` em texto de rótulo (baixo risco).
- Regra 45: ⏳ esqueleto de carregamento.

### Cobranças (`cobrancas/page.tsx` + `AcoesCobranca`, `BotaoCobrar`, `NovaCobranca`, `GerenciarModelos`)
- Regra 43: ✅ confirmação de exclusão de cobrança e de modelo pela janela do sistema (`AcoesCobranca`
  já tinha padrão próprio; `GerenciarModelos` passou a usar o `useConfirmacao`).
- Regra 40/48: 🔄 conferir Title Case dos status ("A Resolver", "Resolvida") e datas/duração.
- Regra 52: ✅ `✕ sem prazo` virou ícone.

### Colaboradores (`colaboradores/page.tsx` + `GerenciarAcessos`, `NovoColaborador`)
- Regra 23/24: ✅ nome do atendente quebra linha.
- Regra 39: ✅ coluna "Ações" por último, ícones com dica e `aria-label`, confirmação por janela.
- Regra 43: ✅ excluir acesso pela janela do sistema.
- Regra 45: ⏳ esqueleto de carregamento.

### Ações necessárias (`acoes/page.tsx`)
- Regra 45 (vazio): ✅ "Tudo em dia…" quando não há pendência.
- Regra 52: ✅ `✓`/`🎉` trocados.
- Regra 49: ✅ textos em português simples, com o próximo passo ("Ver conversa").

### Configurações (papéis, permissões, modelos, situação, conta)
- Regra 43: ✅ `GerenciarPapeis` (excluir/aviso) e `GerenciarModelos` pela janela do sistema.
- Regra 52: 🔄 `✓`/`—` na grade de permissões (`configuracoes/permissoes/page.tsx:63`) ainda em glifo —
  trocar por `Check` + travessão de texto numa próxima rodada (baixo risco).

---

## Pendências de conformidade (ainda abertas)

1. **Regra 45 — esqueleto de carregamento** em todas as telas de lista (Monitor, Início, Auditoria,
   Cobranças, Colaboradores). Hoje são server components sem `loading.tsx`. ⏳
2. **Regra 44 — aparência:** 🙋 decisão do Ronaldo (rodada no Laboratório vs. exceção Apple Design).
   Enquanto não houver pacote, não se mexe em cores/tipografia/composição.
3. **Regra 54 — foto e conferência no aparelho:** ⏳ depende de o Ronaldo abrir as telas (390/1440/320 px).
4. **Regra 1 — etiquetas removíveis de filtro ligado** no Monitor e na Auditoria. 🔄
5. **Regra 52 — glifos restantes (telas fora desta leva):** `✓` na grade de permissões
   (`configuracoes/permissoes`), `✓`/`⚠` em `login`, `nova-senha` e `conta`, `🇧🇷` na tela antiga
   `conversas/nova` (admin legada), e setas `→`/`←` tipográficas de texto (baixo risco). 🔄
6. **Regra 48 — percentuais:** ✅ conferido — Início mostra proporção como inteiro com `%` colado
   (`pct.toFixed(0)%`); Desempenho não exibe percentual em texto (só largura de barra em CSS). Nuance
   menor: em Início a diferença entre dois meses diz "N pontos"; a Regra 48 pede "pontos percentuais"
   por extenso na primeira vez. 🔄 (ajuste de redação, baixo risco).

7. **Regra 55 — teclado nos formulários:** ⏳ as telas de cadastro/edição com vários campos
   (`NovoColaborador`, `NovaCobranca`, formulários de modelo/papel) usam `<form onSubmit>` — hoje o
   **Enter salva o formulário inteiro**. A Regra 55 (item 9) pede que, em cadastro/edição, o **Enter
   avance de campo** e **não salve** (Ctrl+Enter salva). É mudança de comportamento que merece
   conferência no aparelho antes de entregar — próxima rodada.

> Atualizar esta ficha a cada tela entregue (Regra 54) e a cada auditoria (Regra 37), e refletir o
> resumo em `Documentos Globais\Conformidade do Documento Mestre.txt`.
