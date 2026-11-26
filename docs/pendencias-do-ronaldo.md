# Pendências do Ronaldo — PrevAtendimento

Lista permanente do que depende do Ronaldo: decisão, autorização ou ação dele. **Toda pendência que
ele der entra aqui no mesmo momento**, com o número seguinte (P-xx), e **só sai quando for resolvida**:
passa para a tabela "Resolvidas" com a data e o que foi decidido. Os números nunca mudam. Ler ao abrir
conversa nova. **Sem dado pessoal de cliente** (este arquivo vai para o git): só quantidades e
caminhos. As decisões tomadas ficam em `docs/decisoes.md` (DA-xx).

Antes de cobrar uma pendência "técnica" (publicação, token, sincronização), conferir o estado ao vivo
(regra DA-59): a anotação pode estar velha.

Atualizada em 18/11/2026 (reconstruída desde o início do projeto).

## Abertas

| Nº | Pendência | Situação | Registrada |
|---|---|---|---|
| P-01 | **Conferir as telas na foto (Regra 54):** abrir o sistema no celular (390 px), no computador (1440 px) e em 320 px sem rolagem lateral, e usar só o teclado nos formulários. Vale para a conversão inteira à Apple Design e para as Regras 1, 45, 55 e 57 e os participantes da conversa | Tudo pronto no código; é o único item de conformidade em aberto. O Claude não tem login, então só ele consegue ver | 16/11/2026 |
| P-02 | **Mandar publicar a versão em construção:** o trabalho de 16 a 18/11/2026 (Apple Design, regras do Documento Mestre, participantes) está na versão em construção. Só ele manda publicar (DA-52) | Aguarda a ordem dele. Conferir com `vercel ls` o que já está no ar antes de perguntar | 18/11/2026 |
| P-03 | **Banco-rascunho:** uma cópia de teste do banco (como o PrevSystem tem), custo de cerca de US$ 10 por mês na organização do Supabase | Aguarda o "sim" dele; não criar sem isso | 16/11/2026 (data aproximada) |
| P-04 | **WhatsApp oficial (Cloud API) — confirmar o número real:** o número reserva foi adicionado na conta oficial do escritório na Meta, mas está "não verificado"; falta confirmar pelo código que chega por SMS | Parado desde 28/07/2026 | 28/07/2026 |
| P-05 | **WhatsApp oficial — token permanente:** o "usuário do sistema" já foi criado e ligado ao aplicativo e à conta do WhatsApp; ao gerar o token, a Meta pediu confirmação por SMS num número de segurança antigo que ele não tem mais. Retomar com o celular desse número ou trocar o número de segurança, e passar o token ao Claude | Parado desde 28/07/2026 (ele decidiu parar e retomar depois) | 28/07/2026 |
| P-06 | **WhatsApp oficial — publicar o aplicativo na Meta:** enquanto o aplicativo está "não publicado", só chegam mensagens de teste do painel, não as reais. Depois: verificação da empresa (limites de envio) | Depende de P-04 e P-05 | 28/07/2026 |
| P-07 | **Domínio próprio** aposentarconsultoria.com.br (registro.br) apontado para o sistema: decidir **quando** e se será o endereço principal ou um subendereço (ex.: `atendimento.`), caso o principal vá virar site | Ele disse "depois, não agora" (DA-56) | 16/11/2026 |
| P-08 | **Proteção da Vercel no endereço `web-siap.vercel.app`:** hoje ele pede o login da Vercel antes do login do sistema, e só o outro endereço abre direto. Ele quer que o Claude retire essa proteção? (o sistema já tem login próprio) | Pergunta em aberto | 16/11/2026 |
| P-09 | **Plano Pro da Vercel antes da primeira venda:** o plano grátis não permite uso comercial; o gatilho é a primeira venda (cobrança ligada, página de compra ou primeiro cliente pagante), não uma data. Vale para todos os SaaS da conta. Em 16/07/2026 ele tinha escolhido o Pro, mas a conta segue no grátis (DA-50) | Aguarda o gatilho | 24/08/2026 |
| P-10 | **Teste dos 5 casos reais na Auditoria:** combinação dele (abrir a Auditoria e tentar resolver 5 clientes que esperam, para validar o uso). Pediu: "se eu tentar mudar de assunto para melhorias de tela, me lembre desta combinação". Adiado duas vezes; da última escolheu "Construir minha lista primeiro" | Sem notícia desde 15/07/2026; lembrar uma vez e respeitar a decisão | 15/07/2026 |
| P-11 | **Marco Zero — dar o sinal para o piloto:** o plano (DA-40, DA-43) e a página Marco Zero estão prontos; o piloto com as 40 conversas mais antigas nunca foi disparado. Falta ele decidir se retoma, e o **horário** do disparo (as anotações divergem: "cedo, no início do expediente" × "à noite, sem atendente") | Parado desde 06/08/2026; em 15/11/2026 ele disse que o sistema nunca foi usado | 27/07/2026 |
| P-12 | **Marco Zero — clientes em risco de cancelar ("Frente 1"):** dizer como reconhecer os clientes vivos e recentes que estão para desfazer o contrato por falta de resposta; o banco não sabe quem são (isso vive no SIAP) | Aguarda a explicação dele | 27/07/2026 |
| P-13 | **Trocar a própria senha:** durante os testes de 24/07/2026 o Claude trocou a senha de acesso dele; ele precisava entrar e criar uma nova em "Minha conta" | A confirmar com ele (as fontes não registram que foi feito) | 24/07/2026 |
| P-35 | *(numeração continua depois da última usada, P-34)* **Railway (serviço antigo do leitor):** em 22/07/2026 o leitor ficou num serviço da Railway 24h; desde 06/08 quem sincroniza é o computador. Se o serviço da Railway ainda existir, pode estar cobrando à toa. Em 18/11/2026 a ferramenta da Railway nesta máquina está deslogada (`railway login` pede o seu login) | Ele abre railway.app (ou roda `railway login`) para eu conferir e, se for o caso, desligar | 18/11/2026 |
| P-37 | **Token oficial de integração do Multi360 (pergunta ao suporte):** o token que usamos é o da sessão do navegador e **o Multi360 só aceita uma sessão por vez** (novo login invalida o token anterior). Perguntar ao suporte se existe um **token de integração/API oficial** (longa duração, para sistema externo ler), que resolveria tudo sem senha e com o computador desligado. Texto pronto em `docs/pergunta-suporte-multi360.md`. **Se não responderem até sexta 27/11/2026**, o Claude refaz a pergunta sobre montar a rotina na nuvem (lembrete agendado). Se o suporte disser que não tem, cai para a pecinha do navegador (que usa a sessão dele, sem brigar) | Aguarda ele enviar ao suporte | 25/11/2026 |
| P-38 | **Ligar a integração de colaboradores no PrevSystem (para a Aposentar):** o nosso lado está pronto (modelo de dados, leitor na nuvem, chave gerada e hash enviado ao PrevSystem). Falta o PrevSystem gravar o hash e **você ligar** a leitura lá, em **Configurações → Outros Sistemas do Escritório → Integração com o PrevAtendimento** (só administrador). Depois disso a equipe da Aposentar (nome, CPF, departamentos, férias, afastamentos) passa a aparecer aqui sozinha, lida do PrevSystem. Hoje é no ambiente de teste do PrevSystem; a virada para produção é quando eles publicarem | Aguarda o PrevSystem gravar o hash e você ligar pela tela | 26/11/2026 |
| P-36 | **Renovar o token do Multi360 (sincronização PARADA há ~2 dias):** conferido ao vivo em 21/11/2026 — a última sincronização foi 19/11 20:42 UTC; o token venceu nesse meio-tempo (o `.env` e o banco dão 401 "Sessão expirada" mesmo do computador dele). Está DOWN no local e na nuvem. A partir de agora ele renova pela **tela nova** (Configurações → Integração Multi360): abre o Multi360 logado → F12 → Console → `copy(JSON.parse(localStorage['ngStorage-token']))` → cola na tela. Isso grava o token no banco e a função da nuvem volta a sincronizar sozinha (em até 15 min). **Risco em aberto a confirmar quando ele colar um token válido:** se o Multi360 amarrar o token à conexão do computador dele (IP), a nuvem não conseguirá usar — aí o leitor volta a rodar no computador. Só dá para saber testando com token novo | Aguarda ele renovar pela tela | 21/11/2026 |

## Resolvidas

| Nº | Pendência | Decisão / o que foi feito | Registrada | Resolvida |
|---|---|---|---|---|
| P-14 | Fornecer a chave de serviço do banco e ler o QR Code para o teste real do WhatsApp próprio | Feito; ciclo recebe, identifica, responde e entrega provado com WhatsApp real. A sessão guardada era do WhatsApp pessoal dele e foi apagada em 16/07/2026 a pedido dele (DA-31) | 08/07/2026 | 08/07/2026 |
| P-15 | Escolher entre manter o Multi360 ou seguir com WhatsApp próprio | "Aproveitar o Multi360" (DA-12) | 12/07/2026 | 12/07/2026 |
| P-16 | Mandar prints e exportação do Multi360 para mapear a leitura | Mapeamento recebido; leitor construído | 12/07/2026 | 12/07/2026 |
| P-17 | Os atendentes vão entrar no sistema? Por onde começar? | Sim, vão entrar; começar pelas finalizadas (DA-16) | 13/07/2026 | 13/07/2026 |
| P-18 | O que o Supervisor vê e quem cria logins | Supervisor vê Desempenho; logins só pelo Administrador (DA-18) | 13/07/2026 | 13/07/2026 |
| P-19 | Colar no painel do Supabase os 3 arquivos de SQL (cobranças; permissões e prévia; modelos e papéis) | Colados por ele; desde 15/07/2026 o Claude aplica direto | 13/07/2026 | 15/07/2026 |
| P-20 | Autorizar o arquivo de conexão próprio do projeto ao banco | Autorizado (DA-30) | 15/07/2026 | 15/07/2026 |
| P-21 | Qual pacote da avaliação de aparência aplicar | Só o P1, mantendo as mensagens da mais recente para a mais antiga (DA-24) | 15/07/2026 | 15/07/2026 |
| P-22 | Onde publicar o sistema | Vercel + Railway (DA-32); publicado em 22/07/2026 | 15/07/2026 | 16/07/2026 |
| P-23 | Criar o repositório privado no GitHub e autenticar o envio | Feito; sistema no ar | 16/07/2026 | 22/07/2026 |
| P-24 | Providenciar um número de teste para o WhatsApp próprio | Usado o número reserva do escritório; depois do bloqueio do Baileys, ele virou o número da API oficial (DA-47) | 16/07/2026 | 28/07/2026 |
| P-25 | Ligar a proteção contra senha vazada no Supabase | Ligada, junto com o limite de tempo das consultas de 15 segundos | 22/07/2026 | 23/07/2026 |
| P-26 | Cadastrar os logins da equipe | Feito com e-mails fictícios (DA-37) | 13/07/2026 | 24/07/2026 |
| P-27 | Reduzir os departamentos no Multi360 e passar os nomes | Reduzidos para 4; o filtro se monta sozinho (DA-45) | 27/07/2026 | 27/07/2026 |
| P-28 | Aprovar o texto do Marco Zero | Texto único V3, sem telefones (DA-43) | 27/07/2026 | 27/07/2026 |
| P-29 | Liberar vagas de número na conta da Meta e tirar o WhatsApp comum do número reserva | Ele apagou dois números sem uso e tirou o WhatsApp comum; o número entrou na conta oficial | 28/07/2026 | 28/07/2026 |
| P-30 | Levar agora os leitores de PDF do INSS para o PrevAtendimento? | Não agora; são a última camada (DA-49) | 16/08/2026 | 16/08/2026 |
| P-31 | Renovar o token do Multi360 (sincronização parada desde 06/08/2026) | Renovado por ele por volta de 16 a 17/11/2026; sincronizando em 18/11/2026. **Volta sempre que o token vencer** (vence em poucos dias): se voltar, nova linha com número novo | 06/08/2026 | 17/11/2026 (data aproximada) |
| P-32 | Religar o projeto? | Religar e alinhar ao padrão do PrevSystem (DA-51) | 15/11/2026 | 15/11/2026 |
| P-33 | Aparência: rodada no Laboratório de Design ou exceção Apple Design | Apple Design (DA-55) | 16/11/2026 | 16/11/2026 |
| P-34 | Participantes da conversa: só mostrar ou também mudar espera e cobrança | "Só mostrar" (DA-57) | 18/11/2026 | 18/11/2026 |
| P-39 | "Tramitar" (NR-106 do Restituição) se aplica ao PrevAtendimento? | **Não.** Ronaldo respondeu (pela conversa do Restituição, 26/11): "No prevatendimento de fato não tem tramitação". Não construir tramitação aqui | 26/11/2026 | 26/11/2026 |
