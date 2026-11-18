# Registro de decisões do PrevAtendimento

> **Como funciona este registro**
>
> - Cada decisão tem um número **DA-xx** (Decisão do PrevAtendimento). **Os números nunca mudam.**
> - **Decisão nova entra no fim**, com o número seguinte.
> - Decisão que deixou de valer **não é apagada**: fica marcada como **Substituída por DA-xx**, e a
>   nova diz o que mudou. Assim dá para saber por que o sistema é como é.
> - **Quem decidiu:** "Ronaldo" quando a decisão é dele (negócio, operação, aparência, autorização);
>   "Técnica (Claude)" quando é escolha técnica do Claude. Frase do Ronaldo entre aspas só quando a
>   fonte guardou as palavras dele.
> - **Situação:** Em vigor · Em vigor, não construída · Substituída por DA-xx · Em parte (explica).
> - Sem dado pessoal de cliente (este arquivo vai para o git). Nomes de colaboradores só se
>   indispensáveis.
>
> Reconstruído em 18/11/2026 a partir da memória do projeto, do `CLAUDE.md`, do histórico do git e de
> `docs/conformidade-telas.md`. As datas de julho a agosto vêm da memória (que é cronológica); quando a
> fonte não dá a data exata, está escrito "data aproximada". Lista do que depende do Ronaldo:
> `docs/pendencias-do-ronaldo.md`.

---

## 1. Começo: WhatsApp próprio e visão centrada na pessoa (julho/2026)

| Nº | Data | Quem | Decisão | Situação |
|---|---|---|---|---|
| DA-01 | 08/07/2026 | Ronaldo | **Sem plataforma externa de atendimento** (nada de Multi360, YCloud e similares): o escritório teria o próprio WhatsApp. Os documentos antigos que previam YCloud + Railway foram descartados por isso. | Substituída por DA-12 |
| DA-02 | 08/07/2026 | Técnica (Claude) | Base do sistema copiada do PrevFinanças: Next.js 16 + React 19 + Supabase + Tailwind 4, com o aplicativo na pasta `web/`. | Em vigor |
| DA-03 | 08/07/2026 | Técnica (Claude) | Entrada no sistema por e-mail e senha (Supabase Auth), e não pelo "link mágico caseiro" dos documentos antigos. | Em vigor |
| DA-04 | 08/07/2026 | Técnica (Claude) | Começar o WhatsApp pelo **Baileys** (não oficial, por QR Code) e migrar depois para a **API oficial da Meta**, com um "adaptador" de entrada para que trocar o canal não mude o resto. | Substituída por DA-12 (fonte passou a ser o Multi360) e DA-47 (Baileys engavetado) |
| DA-05 | 08/07/2026 | Técnica (Claude) | Banco próprio no Supabase só para o PrevAtendimento (cada subsistema do SIAP tem o seu). | Em vigor |
| DA-06 | 08/07/2026 | Ronaldo | Visão maior "Central de Relacionamento Inteligente": o sistema é organizado pela **pessoa** (Pessoa → Jornada → Objetivos), não pelo canal. O próprio Ronaldo disse que esse plano ainda podia mudar. | Em vigor como visão futura (o modelo existe no banco, vazio e sem uso) |
| DA-07 | 08/07/2026 | Ronaldo | O produto é um **SaaS para vários escritórios do segmento previdenciário**; o escritório Aposentar é o primeiro cliente, de teste. | Em vigor |
| DA-08 | 08/07/2026 | Ronaldo | Vocabulário oficial: **"Pretenso Cliente"**, nunca "Lead". Pretenso Cliente e Cliente são etapas da mesma pessoa, não cadastros diferentes. | Em vigor |
| DA-09 | 08/07/2026 | Ronaldo | O sistema **tem que mostrar o telefone** de quem entra em contato: "se não aparecer o número eu abandono o projeto". | Em vigor (o Multi360 entrega o telefone real) |
| DA-10 | 08/07/2026 | Técnica (Claude) | Listas previdenciárias (benefícios, serviços, fases) vêm da **referência global do SIAP** (`Documentos Globais\Referencia Previdenciaria\`); aqui fica só um ponteiro, nunca cópia. | Em vigor |
| DA-11 | 08/07/2026 | Técnica (Claude) | Entrada de mensagem do WhatsApp próprio feita por uma função única no banco, para não duplicar pessoa nem conversa quando várias mensagens chegam juntas. | Em vigor só no Laboratório WhatsApp (DA-47) |

## 2. Virada para o Multi360 e primeiras telas (julho/2026)

| Nº | Data | Quem | Decisão | Situação |
|---|---|---|---|---|
| DA-12 | 12/07/2026 | Ronaldo | **Manter o Multi360 e ler dele**, em vez de substituí-lo. Opção escolhida: "Aproveitar o Multi360". Resolve o telefone escondido do WhatsApp e o risco de bloqueio. O worker Baileys vira reserva. | Em vigor (substitui DA-01) |
| DA-13 | 12/07/2026 | Técnica (Claude) | Ler o Multi360 pela **API interna** dele (não raspando a tela), a cada **15 minutos**, com o token tirado do navegador logado. Começar pelo **Monitor Diário** (conversas novas) antes do histórico e antes de qualquer servidor. | Em vigor |
| DA-14 | 12/07/2026 | Técnica (Claude) | Espelho do Multi360 em tabelas próprias com prefixo `at_` (clientes, conversas, mensagens, anexos só como link, atendentes, registro de leituras). | Em vigor |
| DA-15 | 12/07/2026 | Técnica (Claude) | O sinal principal do sistema é **"quem falou por último"**: se foi o cliente, o relógio corre contra o escritório. Alimenta Monitor, Auditoria, Cobranças e Desempenho. | Em vigor (reforçada por DA-48) |
| DA-16 | 13/07/2026 | Ronaldo | Três figuras: **Gestor** (tudo, auditoria, acessos), **Supervisor** (garante que todo cliente seja respondido e cobra o atendente) e **Colaborador** (vê só as suas conversas). Os colaboradores **vão entrar no sistema** para ver "Minhas cobranças". Começar pela importação das conversas finalizadas. | Em vigor (rótulo "Colaborador" mudou, DA-36) |
| DA-17 | 13/07/2026 | Técnica (Claude) | Cobrança se **resolve sozinha** quando o atendente responde o cliente depois de ser cobrado. | Em vigor |
| DA-18 | 13/07/2026 | Ronaldo | Supervisor **vê o Desempenho**; as telas antigas (do WhatsApp próprio) ficam só para o Administrador; só o Administrador cria logins. | Em vigor |
| DA-19 | 14/07/2026 | Técnica (Claude) | Telas antigas (Painel, Conversas, Pessoas) **saem do menu**; o Monitor vira a tela inicial; dados de teste antigos apagados (estrutura mantida). | Em parte: a tela inicial mudou em DA-29; as telas antigas voltaram só para o Administrador como Laboratório (DA-47) |
| DA-20 | 14/07/2026 | Ronaldo | O Claude constrói o cadastro de acessos; **quem cadastra e-mail e senha é o Ronaldo**. Nenhuma credencial inventada pelo Claude nem passada pelo chat. | Em vigor |
| DA-21 | 14/07/2026 | Ronaldo | Catálogo previdenciário **só para consulta** (é referência global do SIAP; mudar ali afetaria todos), dentro de Configurações e fora do menu. | Em vigor |
| DA-22 | 14/07/2026 | Ronaldo | Situação de conversa para o sistema: só **Aberta** e **Finalizada**. | Em vigor (detalhada em DA-41) |
| DA-23 | 14/07/2026 | Ronaldo e Claude | Plano para um dia substituir o Multi360: fase 1 = Multi360 + inteligência nossa; fase 2 = WhatsApp oficial num **número de teste**, em paralelo e sem misturar; fase 3 = migrar a linha principal só depois de provado. O Ronaldo ainda não escolheu o caminho definitivo. | Em vigor como plano |
| DA-24 | 15/07/2026 | Ronaldo | Da avaliação de aparência e uso, aplicar só o **pacote P1**, e **manter as mensagens da mais recente para a mais antiga** (contrário do WhatsApp, por escolha dele). | Em vigor |
| DA-25 | 15/07/2026 | Ronaldo | Pedidos de cobrança: **modelos de texto prontos**, prazo rápido de 1 a 5 dias, editar/cancelar/reabrir cobrança, métricas e histórico de cobranças; **papéis editáveis** com dois poderes (ver tudo / cobrar) além das telas. | Em vigor |
| DA-26 | 15/07/2026 | Técnica (Claude) | Medir atendimento por **rodadas** (cliente escreve → próxima resposta humana), com **mediana** e **% respondido em até 24 horas**; **nunca média** (engana) e nunca escolher a janela de comparação a dedo. Contas pré-calculadas pelo leitor; **linha de base** congelada em 15/07/2026, antes de a equipe usar o sistema. | Em vigor |
| DA-27 | 15/07/2026 | Técnica (Claude) | Mensagem do **robô não conta** como resposta da equipe (antes escondia clientes esperando). | Em vigor |
| DA-28 | 15/07/2026 | Ronaldo | Trazer o **histórico completo** de mensagens, sem o corte de 100 por conversa: "temos que trazer tudo". | Em vigor |
| DA-29 | 15/07/2026 | Técnica (Claude) | Tela **Início** (painel com "Precisa de você agora", gráfico de respostas em 24 horas e se o sistema está sendo usado) só para quem vê tudo; o atendente continua indo direto ao Monitor. | Em vigor |
| DA-30 | 15/07/2026 | Ronaldo | Autorizou o arquivo de conexão próprio do projeto, para o Claude acessar o banco certo (antes caía no banco do PrevFinanças). | Em vigor |

## 3. Publicação, segurança e equipe (julho/2026)

| Nº | Data | Quem | Decisão | Situação |
|---|---|---|---|---|
| DA-31 | 16/07/2026 | Ronaldo | **Apagar a sessão do WhatsApp pessoal** dele que estava guardada no worker; teste do WhatsApp próprio só com **outro número**, nunca o pessoal. | Em vigor |
| DA-32 | 16/07/2026 | Ronaldo | Publicar com **Vercel (telas) + Railway (leitor)**; banco continua no Supabase. Escolheu o plano Pro da Vercel. Hostinger descartada (exigiria administrar servidor). | Em parte: a Vercel segue no plano grátis até a primeira venda (DA-50); o leitor hoje roda no computador (ver a nota no fim) |
| DA-33 | 16/07/2026 | Técnica (Claude) | Código no git a partir da raiz do projeto, em **repositório privado** no GitHub; segredos (`.env`, `.mcp.json`, sessão do WhatsApp) **fora do git**. | Em vigor |
| DA-34 | 22/07/2026 | Técnica (Claude) | Recuperação de senha e tela **Minha conta**; quem esqueceu a senha recebe um link gerado pelo Administrador. O Claude gera o link, a senha quem digita é a pessoa. | Em vigor |
| DA-35 | 23/07/2026 | Técnica (Claude) | **Acesso por papel no próprio banco**: o atendente só lê as conversas das quais é responsável; só o leitor grava o espelho; as visões do banco respeitam essa trava. | Em vigor |
| | | | *Correção 18/11/2026 à DA-35:* a `v_at_monitor` não respeitava a trava no banco (rodava como dona da visão); quem filtrava era a tela. Passou a respeitar em 18/11/2026 (`security_invoker`). | |
| DA-36 | 23/07/2026 | Técnica (Claude) | O papel "Colaborador" passa a se chamar **"Atendente"** na tela (o código interno continua o mesmo). Papéis descritos em 3 camadas: Atendente executa, Supervisor cobra caso a caso, Gestor cuida do padrão, Administrador sustenta. A fonte não guarda pedido do Ronaldo. | Em vigor |
| DA-37 | 24/07/2026 | Ronaldo | Logins da equipe com **e-mails fictícios** no padrão nome@domínio do escritório (o e-mail é só o "usuário"); troca de senha pela própria tela. Equipe cadastrada: atendentes e um supervisor. | Em vigor |
| DA-38 | 24/07/2026 | Técnica (Claude) | O atendente abre o **histórico completo** do cliente que ele atende (inclusive conversas antigas com outros atendentes); cliente que não é dele continua fechado. | Em vigor |
| DA-39 | 24/07/2026 | Técnica (Claude) | Cobranças com termos claros: situação **"A resolver"** e botão **"Resolver"**; coluna de canceladas no placar. | Em vigor |

## 4. Marco Zero, Multi360 reorganizado e WhatsApp oficial (julho e agosto/2026)

| Nº | Data | Quem | Decisão | Situação |
|---|---|---|---|---|
| DA-40 | 27/07/2026 | Ronaldo | **Marco Zero** (ideia dele): em vez de mutirão, mandar mensagem de retomada **em lotes pequenos, da fila mais antiga para a mais nova**; quem responde é atendido; quem não responde em cerca de 5 a 7 dias vira "encerrado sem retorno após contato", em lista visível. **Regra de ouro:** o PrevAtendimento **não envia nem finaliza** mensagem, só mede; quem age é a equipe no Multi360. Página Marco Zero construída. | Em vigor, não iniciado na prática |
| DA-41 | 27/07/2026 | Ronaldo e Claude | **"Potenciais"** do Multi360 (contato novo, ou cliente encerrado que voltou a falar) **contam como conversa aberta** em todas as telas, mas ficam **fora** do disparo do Marco Zero. | Em vigor |
| DA-42 | 27/07/2026 | Ronaldo | Finalizar **todas** as conversas abertas depois de mandar a mensagem. | Substituída por DA-43 |
| DA-43 | 27/07/2026 | Ronaldo | Seguir o parecer do agente de estratégia: "vou seguir o que o agente sugerir". **Texto único** (versão V3, assinado por ele), **sem telefones** na mensagem em massa, pedido simples ("responda, nem que seja um sim"); disparo **só para quem está esperando o escritório**, não para as conversas em que o escritório falou por último. Envio feito por um Claude no navegador operando o Multi360; quem responde cai para **um supervisor**, ponto único de entrada. | Em vigor, não iniciado na prática (ver contradição sobre o horário) |
| DA-44 | 27/07/2026 | Ronaldo e Claude | **Modelo por cliente:** as três abas do Multi360 (Ativos, Pendentes, Potenciais) contam como "Ativa"; o cliente só é "Finalizado" quando **todas** as conversas dele estão finalizadas. | Em vigor, não construída no painel |
| DA-45 | 27/07/2026 | Ronaldo | Departamentos reduzidos para **4** no próprio Multi360; o filtro de setor passou a se montar sozinho a partir das conversas (técnica). | Em vigor |
| DA-46 | 27/07/2026 | Ronaldo | Tela **Ações necessárias** como painel de cartões (cada cartão um tipo de problema, com contagem; zerado em verde). **Nova cobrança** direto pela página, com vínculo a cliente **opcional** e várias cobranças por atendente e cliente. | Em vigor |
| DA-47 | 28/07/2026 | Ronaldo | **Baileys engavetado** (o número de teste foi derrubado pelo WhatsApp) e ir para a **API oficial da Meta (Cloud API)**. Usar o número reserva do escritório como número real, tirando dele o WhatsApp comum. Envio e recebimento já construídos no sistema; o "Laboratório WhatsApp" (só Administrador) fica isolado do espelho do Multi360. | Em vigor, travado (ver pendências) |
| DA-48 | 06/08/2026 | Ronaldo | Cartões do Monitor e do Início por **quem falou por último**: "Escritório precisa responder" e "Aguardando o cliente", e não pela situação "Aguardando" do Multi360 (que a equipe deixa parada por hábito e não é confiável). | Em vigor |
| DA-49 | 16/08/2026 | Ronaldo | Leitores de PDF do INSS (requerimento, dados cadastrais, acórdão) **não agora**: são a última camada, depois do cadastro do cliente com dados previdenciários. As especificações ficam na pasta global, sem cópia. | Em vigor |
| DA-50 | 24/08/2026 | Ronaldo (todos os projetos) | "decisão é que todos os saas serão na vercel". A conta fica no **plano grátis (Hobby)** até a **primeira venda**; antes dela, passa para o Pro. | Em vigor (substitui, em parte, a escolha do Pro em DA-32) |

## 5. Retomada e alinhamento ao padrão do PrevSystem (novembro/2026)

| Nº | Data | Quem | Decisão | Situação |
|---|---|---|---|---|
| DA-51 | 15/11/2026 | Ronaldo | **Religar** o projeto e **alinhá-lo ao padrão de construção do PrevSystem**. Contexto dito por ele: "nunca usamos o PrevAtendimento". | Em vigor |
| DA-52 | 16/11/2026 | Ronaldo (padrão PrevSystem) | **Versão publicada × versão em construção:** o que está no ar só muda quando **o Ronaldo manda publicar**; o Claude trabalha na versão em construção e **nunca publica por conta própria**. Ponto de partida marcado no git como `publicada-01`. Substitui a prática de agosto, em que o Claude publicava direto. | Em vigor |
| DA-53 | 16/11/2026 | Técnica (Claude) | **Conferente independente** (agente que só lê e aponta) acionado antes de dar qualquer entrega por pronta. | Em vigor |
| DA-54 | 16/11/2026 | Técnica (Claude) | Trabalhar as telas contra o **Documento Mestre de Padronização (versão 2)**, com ficha por tela em `docs/conformidade-telas.md`. Feitas em código as Regras 1, 23, 43, 45, 48, 52, 55 e 57; falta a foto (Regra 54). | Em vigor |
| DA-55 | 16/11/2026 | Ronaldo | Aparência pela **skill Apple Design**, partindo das telas do PrevSystem: "vamos usar nesse e no PrevControl o Apple Design". O sistema inteiro foi convertido no mesmo dia; ele aprova pela foto. | Em vigor (substitui a pendência "Laboratório ou Apple Design") |
| DA-56 | 16/11/2026 | Ronaldo | Domínio próprio **aposentarconsultoria.com.br** apontado para o sistema **depois, não agora**. | Em vigor, adiada |
| DA-57 | 18/11/2026 | Ronaldo | **Participantes da conversa:** "Só mostrar". A tela da conversa mostra o responsável em destaque, os participantes e o tempo de espera; o **gestor acompanha sem ser participante**. Não muda o cálculo de espera nem as cobranças. | Em vigor |
| DA-58 | 18/11/2026 | Técnica (Claude, aplicando regra global) | Filtros de **setor** e **atendente** permitem **marcar várias opções** num seletor com busca (Regra 57). Situação e período continuam com uma opção só. | Em vigor |
| DA-59 | 18/11/2026 | Ronaldo | **Estado vivo vence anotação:** antes de dizer que algo está parado, vencido ou pendente, conferir no banco, no processo rodando e na Vercel. Pedido dele: "evitar que esse problema ocorra novamente". | Em vigor |
| DA-60 | 18/11/2026 | Ronaldo | **Método do PrevSystem em todo o projeto:** maestro + conferente independente, memória que não se perde (estado-do-projeto, decisões, pendências, continuar-na-NN), regra automatizar/avisar/impedir. Pedido dele: "aplique aqui a todo o projeto, desde o início e de agora em diante". CLAUDE.md §5-A. | Em vigor |
| DA-61 | 18/11/2026 | Ronaldo | **Publicar sozinho:** autorização permanente para o Claude publicar na Vercel a entrega aprovada pelo conferente, avisando depois. Não autorizou de forma permanente: mudança no banco de produção, banco-rascunho e apagar arquivos ou contas (seguem pedindo o "sim"). Substitui em parte a regra "só o Ronaldo publica". | Em vigor |
| DA-62 | 18/11/2026 | Técnica (Claude) | **Desempenho:** regras de acesso do banco calculadas uma vez por consulta; servidor da Vercel em São Paulo (`gru1`), junto do banco; uma consulta só por página para papel e permissões. | Em vigor |

---

## Notas de leitura (pontos em que as fontes não concordam)

- **Onde o leitor roda (DA-32):** a memória de 22/07/2026 diz que o leitor foi para a Railway, rodando
  sozinho; a de 06/08/2026 diz que quem sincroniza é o leitor no computador e que a Railway não foi
  conferida; o `CLAUDE.md` atual manda religar no computador (`npm run start:local`).
- **Horário do disparo do Marco Zero (DA-43):** o parecer acatado em 27/07/2026 diz "disparar cedo, no
  início do expediente"; outra anotação de 27/07/2026 diz "à noite, sem atendente ativo — decisão do
  Ronaldo". Perguntar antes de disparar.
- **Validade do token do Multi360:** as anotações de julho falam em "cerca de 6 meses"; a prática
  (agosto e novembro) mostra que ele vence em poucos dias.
