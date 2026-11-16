# Como o front-end do PrevAtendimento é feito — briefing para continuar o trabalho

> **Como usar este arquivo:** cole todo o conteúdo abaixo no início de uma conversa nova com o Claude (ou outro assistente) sempre que for mexer nas **telas** do PrevAtendimento. Ele explica, em detalhe, como o front-end (a parte visual) é construído, para que qualquer alteração saia no mesmo padrão. Escrito para ser entendido também por quem não programa.

---

## 1. O que é o sistema (contexto rápido)

PrevAtendimento é o painel do escritório previdenciário **Aposentar** (guarda-chuva "SIAP"). Ele **espelha** as conversas de WhatsApp que hoje acontecem na plataforma **Multi360** e mostra, para gestor/supervisor/atendentes, quem está esperando resposta, quem já foi respondido, cobranças, desempenho, etc. O painel **lê e mostra** — quem envia/finaliza mensagem ainda é a equipe dentro do Multi360.

- O código das telas fica na pasta **`web/`**.
- Um programa à parte (`multi360-reader/`) sincroniza os dados do Multi360 para o banco. **Não é front-end** — não mexer nele para tarefas de tela.

## 2. Tecnologias (a "caixa de ferramentas")

| Peça | O que é | Versão |
|---|---|---|
| **Next.js** (App Router) | O motor do site: define páginas, rotas e roda código no servidor | 16.2.6 |
| **React** | A biblioteca que desenha a interface em componentes | 19.2.4 |
| **TypeScript** | JavaScript com checagem de tipos (pega erros antes de rodar) | 5 |
| **Supabase** (`@supabase/ssr`) | O banco de dados (Postgres) + login; as telas leem dados dele | ssr 0.10.3 |
| **lucide-react** | Biblioteca de ícones (os iconezinhos das telas) | 0.439 |
| **Tailwind CSS 4** | Framework de estilo — **está instalado, mas quase não é usado** (ver seção 5) | 4 |
| **Fontes Google** | **Montserrat** (títulos) e **Open Sans** (texto), carregadas em `app/layout.tsx` | — |

Idioma de tudo (código, textos, nomes de variáveis): **português**.

## 3. O padrão central: como UMA tela é montada (do banco à página)

Quase toda tela segue **sempre a mesma receita** de 3 camadas. Entender esta receita é entender 90% do front-end:

**Camada 1 — o "buscador de dados" (loader), em `web/src/lib/*.ts`**
Uma função `async` que fala com o banco (Supabase) e devolve dados já prontos. Ex.: `getMonitorProtocolos(...)` em `lib/dados.ts` devolve a lista de conversas + os números dos cards. Outros: `lib/gestao.ts`, `lib/inicio.ts`, `lib/marcozero.ts`, `lib/acoes.ts`, `lib/cobrancas.ts`.

```ts
// exemplo simplificado de um loader (lib/dados.ts)
export async function getMonitorProtocolos(/* filtros */) {
  const supabase = await createClient()          // cliente do banco (servidor)
  const { data } = await supabase.from('v_at_monitor').select('*')/* ...filtros... */
  return { itens: data, resumo: {/* números dos cards */} }
}
```

**Camada 2 — a "página" (Server Component), em `web/src/app/dashboard/.../page.tsx`**
É um componente que **roda no servidor** (por isso pode chamar o banco direto). É uma função `async` que chama o loader e desenha o HTML. Duas marcas registradas:
- `export const dynamic = 'force-dynamic'` no topo → a página **sempre busca dado fresco** (nunca mostra versão "congelada").
- No Next 16, os filtros da URL chegam como `searchParams: Promise<...>` e a gente faz `await`.

```tsx
export const dynamic = 'force-dynamic'
export default async function MonitorPage({ searchParams }) {
  const { periodo, atendente } = await searchParams
  const { itens, resumo } = await getMonitorProtocolos(/* ...filtros... */)
  return ( /* ...desenha os cards e a lista com os dados... */ )
}
```

**Camada 3 — "ilhas" interativas (Client Components), em `web/src/components/*.tsx`**
Botões, campos de busca, dropdowns de filtro e formulários que **reagem ao clique/digitação** precisam rodar no navegador. Esses arquivos começam com a linha **`'use client'`** e são pequenos e focados. Ex.: `FiltroAtendente.tsx`, `BuscaMonitor.tsx`, `FiltroOrdem.tsx`, `NovaCobranca.tsx`.
- **Regra importante dos filtros:** o estado dos filtros mora na **URL** (ex.: `?periodo=tudo&atendente=Breno`). Ao clicar num filtro, o componente monta um novo link **preservando os outros filtros** e navega. Isso deixa a página "linkável" e o servidor re-busca os dados com o novo filtro.

**Login/segurança:** o arquivo `web/src/proxy.ts` (no Next 16 o antigo "middleware" chama-se "proxy") intercepta toda navegação: se a pessoa não está logada, manda para `/login`. Os papéis (ADMIN / GESTOR / SUPERVISOR / COLABORADOR) definem o que cada um vê — resolvidos por `lib/papel.ts` / `lib/papeis.ts`.

## 4. Organização das pastas (onde fica cada coisa)

```
web/src/
  app/                      ← páginas (cada pasta = uma rota/endereço)
    layout.tsx              ← moldura raiz (fontes, <html>, idioma pt-BR)
    globals.css             ← paleta de cores + reset (ver seção 5)
    login/ , nova-senha/    ← telas fora do painel
    dashboard/
      layout.tsx            ← moldura do painel (menu lateral + área de conteúdo)
      page.tsx              ← tela inicial ("Precisa de você agora")
      monitor/page.tsx      ← Monitor Diário (a tela mais usada)
      monitor/[id]/page.tsx ← uma conversa aberta (histórico do cliente)
      auditoria/ desempenho/ cobrancas/ marco-zero/ acoes/
      colaboradores/ configuracoes/ catalogo/ ...
    api/                    ← rotas de servidor (ex.: enviar mensagem, criar cobrança)
  components/               ← "ilhas" reutilizáveis ('use client': filtros, botões, formulários)
  lib/                      ← loaders (buscadores de dados) + regras + utilidades
```

## 5. Como as telas são **estilizadas** (o ponto mais importante — e o mais delicado)

**As telas usam "estilo inline".** Ou seja: a cor, o tamanho, o espaçamento de cada elemento são escritos **direto no elemento**, num objeto de estilo do React, com o código da cor "na mão". Há **~1.050** usos de `style={{ ... }}` no projeto, contra pouquíssimos usos de classes do Tailwind. **O Tailwind está instalado mas praticamente não é usado.**

```tsx
// exemplo real do padrão "card" usado em várias telas
<div style={{
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #EEF2F7',
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  padding: '14px 18px',
}}>
  ...conteúdo...
</div>
```

**Existe uma paleta oficial** definida em `web/src/app/globals.css` como variáveis CSS:

```css
--primary:  #1A3C5A;   /* azul SIAP — títulos, identidade */
--secondary:#4B7BA6;
--accent:   #16A34A;   /* verde — "ao vivo", WhatsApp, tudo certo */
--destructive:#DC2626; /* vermelho — crítico */
--warning:  #D97706;   /* laranja — atenção */
--border:   #DCE6EF;
--radius-md:14px;  --shadow-card: 0 8px 24px rgba(0,0,0,0.06);
```

⚠️ **O detalhe que mais importa saber:** as telas **NÃO usam** essas variáveis — elas repetem os códigos de cor na mão (`#1A3C5A`, `#16A34A`, etc.) em cada arquivo. Então a paleta existe no papel, mas na prática cada tela reescreve as cores. Isso funciona, mas torna difícil manter tudo idêntico e trocar o visual depois.

**Significado das cores (usado de forma consistente, ainda que "na mão"):**
- **`#1A3C5A` (azul escuro):** títulos, nomes, identidade, botões principais.
- **`#16A34A` (verde):** "ao vivo", respondido, tudo certo, WhatsApp.
- **`#C2410C` / `#B45309` (laranja):** atenção — "o escritório precisa responder", aguardando.
- **`#B91C1C` / `#DC2626` (vermelho):** crítico, vencido, excluir.
- **Cinzas** `#6B7280` / `#9CA3AF` (texto secundário), `#EEF2F7` / `#DCE6EF` (bordas), `#F8FAFC` (fundo).

**Componentes visuais recorrentes** (sempre montados com estilo inline, não há uma biblioteca de componentes):
- **Card**: fundo branco, cantos arredondados (14px), sombra suave, borda cinza-clara. Às vezes com uma **barra colorida à esquerda** indicando situação (amarelo = esperando, verde = respondido, cinza = finalizada).
- **Chip/etiqueta**: pílula arredondada (`borderRadius: 999`) para status e filtros.
- **Ícones**: sempre do `lucide-react` (ex.: `import { Clock, Users, AlarmClock } from 'lucide-react'`).

## 6. Convenções e vocabulário (regras de ouro)

- **Tudo em português**, inclusive nomes de variáveis e comentários.
- **Vocabulário oficial:** usar **"Pretenso Cliente"** (nunca "Lead"). Cliente e Pretenso Cliente são **estágios** da mesma pessoa.
- **Papéis:** ADMIN, GESTOR, SUPERVISOR, COLABORADOR — cada tela respeita quem pode ver o quê.
- **Datas:** formatadas em fuso de Brasília (`America/Sao_Paulo`), padrão `dd/mm/aaaa`, com utilidades em `lib/utils.ts`.
- **"Quem falou por último"** é o conceito-chave do sistema (o SLA): se o **cliente** falou por último → o escritório deve resposta; se a **equipe** falou por último → a bola está com o cliente. Vários cards e telas se apoiam nisso (campo `ultima_mensagem_direcao`).

## 7. Como rodar, compilar e publicar

- **Rodar em produção (o modo usado no dia a dia):** dentro de `web/`, `npm run build` e depois `npm start` (porta 3000). Em produção **não há recarga automática**: ao mudar código, **recompilar** (`npm run build`) e reiniciar o `npm start`.
- **Publicado na internet (Vercel):** projeto `siap/web`, endereço fixo **https://web-siap.vercel.app**. Republicar com `vercel --prod` dentro de `web/` (Root Directory = `web`). A Vercel usa o mesmo banco Supabase.
- **Verificar bugs:** rodar `/code-review` (mudanças do branch) — versão minuciosa na nuvem é `/code-review ultra` (só o dono dispara).

## 8. Pontos fracos conhecidos (o que dá para melhorar)

Sendo honesto sobre o estado atual, para quem for evoluir:
1. **Cores/tamanhos repetidos na mão** em vez de usar a paleta central (`globals.css`) → arriscado para manter consistência e para trocar o visual/tema depois.
2. **Sem biblioteca de componentes**: cada card/botão/chip é remontado com estilo inline em cada tela → há duplicação. Um conjunto de componentes reutilizáveis (`<Card>`, `<Botao>`, `<Chip>`) reduziria muito isso.
3. **Sem modo escuro** e sem tokens de tema aplicados.
4. Existem **agentes especializados no projeto** para isso: `ui-ux-siap` (melhora interface/experiência) e `padronizacao-siap` (regras do Documento Mestre de Padronização do SIAP). Vale passar telas novas por eles.

## 9. Instruções para quem for mexer nas telas (resumo prático)

Ao alterar ou criar uma tela, **mantenha o padrão existente**:
1. Dados vêm de um **loader** em `lib/` (função `async` que fala com o Supabase); a **página** é um Server Component `async` com `export const dynamic = 'force-dynamic'`.
2. Interação (clique/digitação) vai para um **Client Component** (`'use client'`) pequeno em `components/`; **estado de filtro fica na URL**, preservando os outros filtros.
3. Estilo com **objetos `style={{}}` inline**, seguindo as **cores da seção 5** (azul identidade, verde ok, laranja atenção, vermelho crítico) e o **padrão de card** (branco, cantos 14px, sombra suave).
4. Ícones do **`lucide-react`**. Textos em **português**, vocabulário "Pretenso Cliente".
5. Depois de mexer: `npm run build` para conferir erros, e publicar com `vercel --prod`.
6. Se a tarefa é de **layout/organização visual**, considere usar o agente `ui-ux-siap`; se envolve **padrões de cadastro/validação/nomes**, o `padronizacao-siap`.
