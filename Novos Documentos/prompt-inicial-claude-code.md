# Prompt inicial — apresentar ao Claude Code na primeira conversa

Olá! Estou trazendo a você o projeto **AtendeIA Previdenciário**. Anexei/coloquei nesta pasta **nove documentos (00 a 08)** que foram construídos com cuidado numa conversa anterior com outra instância do Claude — eles contêm o problema que quero resolver, as decisões já tomadas e o plano de construção.

**Antes de mais nada, sobre mim:** eu sou especialista em Direito/consultoria previdenciária, com mais de 20 anos de experiência nessa área. Meu conhecimento é **inteiramente previdenciário** — sou **leigo total em programação, servidores, VPS e Hostinger**. Ainda não criei conta na Hostinger, nunca usei terminal, SSH, tmux, Node ou qualquer ferramenta técnica. Preciso que você me conduza passo a passo em tudo que for técnico, sem presumir que eu sei nada disso. O Documento 00 detalha exatamente como você deve se comunicar comigo.

**O que preciso que você faça agora, nesta ordem:**

1. **Leia os nove documentos por completo**, começando pelo `00-leia-primeiro.md`, na ordem indicada nele. Eles contêm: o problema real que enfrento no atendimento via WhatsApp/Multi360, a estrutura de dados descoberta na plataforma (cliente → protocolos → mensagens), o modelo de dados do Supabase, o método de extração em três camadas, as regras de negócio (incluindo a auditoria de colaboradores), a especificação do painel completo, o plano de teste com 20 protocolos históricos, o guia de setup do ambiente, e o **Documento 08 — Monitoramento Diário**, que é uma entrega rápida e simplificada (só conversas novas a partir de agora, numa tela simples) que **tem prioridade e deve ser construída antes da extração do histórico completo**.

2. **Analise tudo com olhar crítico.** Esses documentos foram pensados com cuidado, mas não são definitivos nem perfeitos. Quero que você:
   - aponte qualquer inconsistência, lacuna ou risco técnico que enxergar;
   - sugira melhorias sempre que identificar uma forma melhor de resolver algo;
   - **pode alterar, ajustar ou complementar qualquer parte do projeto, desde que seja para melhorá-lo** — não precisa me pedir permissão para pequenos ajustes técnicos, mas me explique o que mudou e por quê, em linguagem simples.

3. **O projeto é vivo, não fechado.** Ao longo da construção, é normal surgirem informações novas (por exemplo, sobre como o Multi360 realmente se comporta, limitações do VPS, formato real dos arquivos exportados). Quando isso acontecer, você deve:
   - me perguntar o que for necessário para descobrir essas informações (às vezes vou precisar testar algo na plataforma e te contar o resultado, como fizemos antes);
   - atualizar o entendimento do projeto conforme aprendemos coisas novas;
   - me avisar quando uma descoberta muda algo importante do plano original.

4. **Comece pelo setup do ambiente** (Documento 07), já que ainda não tenho VPS nem nada instalado. Me conduza desde a criação da conta na Hostinger, um passo de cada vez, confirmando comigo o resultado esperado a cada etapa antes de seguir para a próxima. **Logo depois do setup, construa o Documento 08 (Monitoramento Diário) antes de partir para o histórico** — quero visibilidade rápida das conversas novas enquanto o restante do projeto avança.

**Regras que preciso que você siga sempre:**
- Nunca me peça para colar senhas ou credenciais no chat. Credenciais ficam apenas no servidor, no arquivo `.env` — me ensine a colocá-las lá, no momento certo.
- Decisões técnicas (arquitetura, ferramentas, configuração) são suas — decida e me explique em uma frase simples. Só me leve decisões de negócio ou de custo (ex: quanto vou gastar por mês).
- Sempre que eu não entender um termo técnico, explique de novo, com paciência, sem jargão.

Pode começar confirmando que leu e entendeu os nove documentos, me dando um resumo curto do que entendeu ser o projeto (incluindo a prioridade do Documento 08), e então seguirmos para o primeiro passo do setup.
