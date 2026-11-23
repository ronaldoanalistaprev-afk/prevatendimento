# Automações, avisos e travas do PrevAtendimento

**Regra-mãe, a mesma do PrevSystem (NR-95, Ronaldo, 05/11/2026), adotada aqui em 18/11/2026:**

> "Isso pode ser automatizado? Se sim, é obrigação automatizar. Se não, deve ter uma forma de avisar o usuário para que faça isso ou aquilo ou impeça de fazer algo enquanto aquilo não for registrado."

Toda tela, campo ou etapa nova passa por três perguntas, nesta ordem, e entra neste mapa:

1. O sistema consegue descobrir ou calcular sozinho? Então automatiza.
2. Só uma pessoa sabe ou consegue fazer? Então avisa, e o aviso só sai quando a coisa for feita.
3. Seguir sem isso causa erro? Então impede.

O conferente independente (`.claude/agents/conferente-prevatendimento.md`) cobra este mapa.

## Sincronização com o Multi360

| Situação | Automático | Aviso | Trava |
|---|---|---|---|
| Conversas, mensagens, anexos e participantes novos | **Desde 21/11/2026:** a **Edge Function `sincronizar-multi360`** (Supabase) puxa a cada 15 min, disparada pelo **pg_cron** (job `sincronizar-multi360`, `*/15 * * * *`). Roda sozinha, sem depender de conversa aberta nem do computador. Antes: leitor local (`multi360-reader/`), que caía quando o computador desligava — mantido só de reserva (DA-63) | — | A chamada à função só passa com o segredo `x-cron-secret` (coluna `cron_secret`); chamada anônima recebe 401 |
| Ciclo que passa de 150s (medido: 338s) | A função responde na hora (202) e termina o ciclo em **segundo plano** (`EdgeRuntime.waitUntil`, até 400s do plano Pro). Se um ciclo for cortado, o próximo retoma (idempotente) | — | — |
| **Token do Multi360 vencido** (a leitura para) | Não dá: renovar exige o Ronaldo logado no Multi360 (dança do F12) | **Desde 21/11/2026:** tela **Configurações → Integração Multi360** mostra "Vencido/Em dia/Sem token" e a última sincronização; a tela de Situação aponta para ela. Antes (18/11): depois de 45 min sem sincronizar, o selo das telas vira aviso amarelo "Atualização automática parada há X" | — |
| Renovar o token | — | Só o **Administrador** cola o token novo na tela de Integração; ao salvar, a função confere na hora se o token funciona (modo "validar") e a sincronização volta sozinha em até 15 min | A tela e a rota de API exigem Administrador **ativo**; o token nunca é mostrado de volta nem exposto na view |
| Participantes de conversa antiga | Recuperação de 80 por ciclo até completar | — | — |

## Atendimento

| Situação | Automático | Aviso | Trava |
|---|---|---|---|
| Quem falou por último | Calculado a cada mensagem (`ultima_mensagem_direcao`) | Monitor: "Esperando há X" na lista e dentro da conversa | — |
| Conversa parada | Auditoria calcula as horas paradas | Auditoria e Ações necessárias | — |
| Cobrança ao atendente respondida | `resolverCobrancasRespondidas()` encerra sozinha | — | — |
| Login desativado | — | — | A sessão aberta cai na hora |
| Atendente comum | — | — | Só vê as conversas dele (filtro travado) |

## Lacunas conhecidas (a construir)

- Avisar o gestor fora da tela (e-mail ou WhatsApp) quando a sincronização parar. Depende do envio próprio de mensagens (Cloud API da Meta, ainda travada).
