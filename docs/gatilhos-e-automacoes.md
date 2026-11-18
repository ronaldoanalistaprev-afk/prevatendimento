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
| Conversas, mensagens, anexos e participantes novos | O leitor (`multi360-reader/`) puxa a cada 15 minutos | — | — |
| Leitor parado (token vencido, computador desligado, conversa que rodava o leitor arquivada) | Não dá: a renovação do token exige o Ronaldo logado no Multi360 | **Desde 18/11/2026:** depois de 45 minutos sem sincronizar, o selo "Atualizado com o Multi360" de todas as telas vira o aviso amarelo "Atualização automática parada há X" | — |
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
