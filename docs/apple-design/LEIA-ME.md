# Apple Design no PrevAtendimento

Decisão do Ronaldo (16/11/2026): o PrevAtendimento passa a usar a skill **Apple Design**, como o
PrevSystem. Este é o pacote de design que o projeto aplica. A regra global está no CLAUDE global
(seção da aparência) e no `CLAUDE.md` do projeto (seção 5).

## O que tem aqui
- `estilo.css` — o sistema visual completo (tokens de cor, tipografia Inter, cartões, botões, selos,
  filtros, tabela→cartões no celular, janelas, esqueleto de carregamento, estados). Cópia idêntica à
  base do PrevSystem (`Laboratório de Design\entregas\prevsystem\telas\estilo.css`).
- `comportamento.js` — o comportamento (molas, gaveta do menu, folhas, Esc/Tab preso, aviso que some).
- `monitor-referencia.html` — a **prévia do Monitor Diário** nesta aparência (ponto de partida aprovado
  pela foto). Serve de referência ao converter o componente real.
- `monitor-referencia-computador.jpg` / `-celular.jpg` — as fotos aprovadas (1440 px e 390 px).

## Princípios (do DECISOES.md do PrevSystem)
Fundo papel quente `#F6F6F3`; tinta grafite `#191B1D`; **uma só cor de ação, petróleo `#0F6273`**;
verde/âmbar/vermelho só para situação (sucesso/atenção/perigo), **nunca só pela cor** (sempre com texto
ou ícone). Fonte **Inter**. Densidade com respiro: muitos dados separados por linhas finas, não por
caixas grandes. Cartão quase plano; só o que flutua ganha sombra. Teto de 1.400 px; menu de 252 px.

## Plano de conversão (tela por tela, começando pela mais usada)
1. Fundação: `estilo.css` como folha global do app + fonte Inter + casca (menu lateral + topo do
   celular) no layout do dashboard e no Sidebar.
2. **Monitor** (feito como referência; aplicar no componente real).
3. Início, Auditoria, Cobranças, Colaboradores, Ações necessárias, Desempenho, Configurações.
4. Janela de confirmação do sistema (`Confirmacao.tsx`) na aparência da skill (classe `.janela-confirma`).

Regras que não mudam: o **Documento Mestre vence a skill**; **não se inventa aparência fora da skill**;
o Ronaldo aprova pela **foto** (390/1440/320 px — Regra 54); texto com trava jurídica e regra
previdenciária não mudam por design.
