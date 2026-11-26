# Primeira mensagem — "⚫ PrevAtendimento 10"

Você é a conversa principal do PrevAtendimento, a **⚫ PrevAtendimento 10**, continuação da 09 (trocada por tamanho de contexto
em 26/11/2026, ~68%). O Ronaldo é advogado, não programador: trate por "você", explique a finalidade sem jargão, publique só o que
o conferente aprovar. Método do PrevSystem (CLAUDE.md §5-A).

## Comece assim
1. Leia o `CLAUDE.md` do projeto (vem carregado), o índice da memória (`MEMORY.md`) e a **ÚLTIMA seção** de `estado-do-projeto.md`
   (as seções "26/11/2026" — tem três, leia todas; a última resume o fim do dia). Leia `docs/pendencias-do-ronaldo.md` e `docs/decisoes.md`.
2. Confira seu nome (`get_session` self): deve ser "⚫ PrevAtendimento 10"; sem o ⚫, renomeie.
3. Git: último commit do dia; no ar `publicada-07`.
4. **Estado AO VIVO (§2-A), antes de afirmar qualquer coisa:**
   - Multi360: `select token_status, ultima_sync from v_at_integracao_status` (banco `cgnudnxivpeyzcurdzkt`). O token vive morrendo
     (sessão única; cai a cada relogin/queda de energia). Renovar: Claude in Chrome → `painel.multi360.com.br` logado → ler
     `localStorage['ngStorage-token']` → `update at_integracao_multi360 set token=..., token_status='desconhecido'` → validar
     (Edge Function `sincronizar-multi360`, header `x-modo: validar`, `x-cron-secret` da tabela).
   - Integração do pessoal: `select ligado, ultima_sync, ultimo_erro from at_integracao_prevsystem` e veja se o Ronaldo já
     **ligou no PrevSystem** (P-38). Se ligou, dispare `sincronizar-prevsystem` (com o `x-cron-secret` da tabela) e confira
     **12 ativos + 76 inativos, 5 departamentos**. Enquanto `ativa=false` do lado deles, dá `chave_invalida`.

## TAREFA PRINCIPAL desta conversa: refazer a tela INÍCIO no padrão de uma imagem de referência
O Ronaldo mandou uma **imagem de referência** (um painel SaaS tipo "LeaseFlow") e escolheu **começar pela tela Início**. Peça a ele
para **colar a imagem de novo** no começo (ela era da sessão anterior). Como era:
- Cabeçalho com saudação ("Good morning, Jordan") + busca + filtros + um botão principal escuro.
- **Fileira de blocos de métricas** no topo (rótulo pequeno cinza, número grande, setinha de tendência), com **UM** bloco em
  destaque (amarelo) para a métrica-chave.
- Um **funil/pipeline** horizontal (etapas com %, número grande, barra; a última destacada).
- **3 colunas** de cartões focados (lista de tarefas/tours; conversas para revisar com chip de intenção; grupos de pendências).
- Fundo neutro quente, cartões brancos, preto nos acentos, **um** amarelo de destaque, muito espaço, hierarquia clara.

**O que fazer:** reconstruir a nossa Início (`web/src/app/dashboard/page.tsx` → `web/src/components/PainelInicio.tsx`; dados em
`web/src/lib/inicio.ts`) nesse padrão de COMPOSIÇÃO, **adaptando ao nosso conteúdo** (PT, nossos dados — conversasAbertas,
escritorioPrecisaResponder, paraResolverAgora/semResposta24h, filaAntiga, meses[] com pct_resposta_24h, uso), **sem copiar a marca
deles** (nada de "LeaseFlow"/aluguel), seguindo a skill **Apple Design** (`.claude/skills/apple-design` — já é exceção do projeto).
Ideia de mapeamento: fileira de blocos de números no topo (um acento só) + uma faixa de "situação" (não force um funil de conversão
onde não cabe; a escalada abertas→precisa responder→+24h→fila antiga pode virar essa faixa, com honestidade) + seções focadas
("Precisa de você agora", "Estamos respondendo?", uso).
**Para VER e iterar o visual + mandar foto:** a Início de verdade só abre logada. Crie uma **amostra da Início na VITRINE**
(`web/src/app/vitrine/`; hoje a vitrine só tem o Monitor, sem login) com dados fictícios, abra no navegador embutido, tire foto em
**1440 / 390 / 320 px** e ajuste até ficar no nível da referência. O Ronaldo **aprova pela foto** (Regra 54). Conferente antes de publicar.

## Depois da Início: enxugar 5 telas (auditoria Apple Design de 26/11, subagente)
18 de 23 telas estão OK; nenhuma embaralhada. **Atenção (enxugar, no mesmo padrão):** **Cobranças** (muro de 7 números + tabela
7col + lista → destacar 2–3 números-chave, recolher o resto), **Marco Zero** (6 números + **2 avisos empilhados** → juntar num só +
tabela 8col), **Desempenho** (6 cartões, **4 coloridos** → reduzir para 2 destaques), **Auditoria** (repete o placar por atendente
da Desempenho → decidir a dona), **Pessoa-detalhe** (muitos selos; recurso dormente). Menores: `BlocoProtocolo.tsx` (faixas
coloridas empilhadas), `GerenciarAcessos.tsx` (ADMIN com `selo-perigo` vermelho sem perigo → trocar), e **apagar o órfão**
`components/AtendentesSemConversaAberta.tsx`.

## Pendências do Ronaldo (não travam a Início)
- **P-38 — ligar a integração do pessoal:** ele liga em **https://prevsystem-rascunho.vercel.app → Configurações → Outros Sistemas
  do Escritório → Integração com o PrevAtendimento**. A conversa do PrevSystem ("🟦 PrevSystem 28", id
  local_6907d737-f571-47e6-aff6-ae9d365c4764) avisa quando `ativa`. Aí puxe os dados e confira as contagens. Depois: pg_cron diário
  (depois das 10h) e as telas de pessoal (roster, detalhe, cadastro local parte D). Contrato: `docs/integracao-prevsystem-colaboradores.md`.
- **P-37 — token oficial do Multi360:** o Ronaldo **vai enviar a pergunta ao suporte amanhã 27/11 de manhã** (chat de suporte do
  painel; texto em `docs/pergunta-suporte-multi360.md`). Lembrete agendado **27/11 09h** (`multi360-token-oficial-followup`).
- **P-36 — token do Multi360 vive vencendo:** remendo até o token oficial. Religar como acima.

Nada fica só na conversa: decisão → `docs/decisoes.md` (DA-xx); pendência dele → `docs/pendencias-do-ronaldo.md`; estado →
`estado-do-projeto.md`; regra nova/tela que mude → Caderno de Regras (Artifact fixo, republicar na mesma url).
