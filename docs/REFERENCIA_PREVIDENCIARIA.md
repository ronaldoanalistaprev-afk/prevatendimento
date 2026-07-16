# Referência Previdenciária — fonte canônica (não duplicar aqui)

A referência previdenciária (regimes, tipos de benefício/serviço, fases, órgãos, status,
regras) é **global do ecossistema SIAP** e vive fora deste projeto, em:

```
D:\Projetos\SIAP\Documentos Globais\Referencia Previdenciaria\
```

São 9 arquivos, um por assunto (LEIA-ME, Regimes, Tipos de Benefícios, Tipos de Serviços,
Fases do Processo e Órgãos, Status do Pedido, Regras de Negócio, Diferenças de Nomenclatura,
Checklist de Consistência).

**Convenção do ecossistema:** um assunto por arquivo; ao criar/alterar qualquer lista
previdenciária, atualizar o arquivo correspondente lá — **não recriar listas soltas**.
Fonte da verdade: benefícios/serviços = PrevFinanças; fases/órgãos/status = PrevControl;
entes RPPS = CADPREV (`ref_cadprev`).

## Como está materializado neste projeto (PrevAtendimento)

O catálogo foi semeado no Supabase (migração `referencia_previdenciaria_canonica`) em
tabelas globais de referência (sem `empresa_id`, pois é lei, igual para todo tenant):

- `ref_regimes` · `ref_tipos_beneficio` (17 RGPS + 10 RPPS) · `ref_tipos_servico`
  (7 RGPS + 6 RPPS + 2 multi) · `ref_fases` (10) · `ref_orgaos` (4) · `ref_status_pedido` (9)

Visível na aba **Catálogo** do dashboard. Os `objetivos` referenciam esse catálogo
(regra canônica: um objetivo = benefício **ou** serviço).

> Ao revisar consistência entre SaaS, seguir o **Checklist de Consistência** da pasta global.
