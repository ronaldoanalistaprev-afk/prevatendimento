# 📌 RECADO — Mapa dos Projetos Supabase (Conta do Ronaldo)

**Esta pasta corresponde ao projeto Supabase: `PrevAtendimento`**

**Reference ID (ref) esperado:** `cgnudnxivpeyzcurdzkt`  
**URL esperada:** https://cgnudnxivpeyzcurdzkt.supabase.co


---

## ✅ Como confirmar que você (assistente) está no projeto CERTO

Antes de ler/escrever em banco, rode a ferramenta do Supabase **`get_project_url`**.
Ela retorna algo como `https://XXXXXXXX.supabase.co`.

- Se `XXXXXXXX` **for igual** ao *ref esperado* indicado no topo deste arquivo → tudo certo, pode prosseguir.
- Se **for diferente** → **PARE**. O conector está apontando para o projeto errado.
  Avise o usuário e peça para reapontar o conector Supabase para o projeto correto
  **antes** de criar tabelas, migrations ou carregar dados.

> Já aconteceu de um trabalho começar no projeto errado (o conector estava em *PrevFinanças*
> quando o alvo era *PrevSystem*). Por isso esta verificação é obrigatória.

---

## 🗺️ Endereços de TODOS os projetos

A conta tem 2 organizações: **APOSENTAR** e **GALEÃO PRODUTOS DIGITAIS**.

| Projeto | Reference ID (ref) | URL | Organização | Status |
|---|---|---|---|---|
| **PrevSystem** | `xqdebsiuceswhlsosnku` | https://xqdebsiuceswhlsosnku.supabase.co | GALEÃO | Ativo |
| **PrevFinanças** | `gwctwcqaciamwxewqjwq` | https://gwctwcqaciamwxewqjwq.supabase.co | GALEÃO | Ativo |
| **PrevControl** | `qukawgttjzkmggxvokiv` | https://qukawgttjzkmggxvokiv.supabase.co | GALEÃO | Ativo |
| **PrevAtendimento** | `cgnudnxivpeyzcurdzkt` | https://cgnudnxivpeyzcurdzkt.supabase.co | GALEÃO | Ativo |
| **Gestão Processos Judiciais** | `cyhwumatqylfyfhbcqpy` | https://cyhwumatqylfyfhbcqpy.supabase.co | GALEÃO | Ativo |
| **MEU SALÁRIO MATERNIDADE** | `ttxagvrstrvlvfnmbvgc` | https://ttxagvrstrvlvfnmbvgc.supabase.co | GALEÃO | Ativo |
| **Extração de Relatórios Previdenciários** | `mrfulnxqsfokcdsqzvtb` | https://mrfulnxqsfokcdsqzvtb.supabase.co | GALEÃO | Ativo |
| **Altas Previdenciário** | `dltjtnrryaoikwvzsuil` | https://dltjtnrryaoikwvzsuil.supabase.co | GALEÃO | Ativo |
| **RESTITUIÇÃO** | `ezbafvnxfhbqbiwurzxz` | https://ezbafvnxfhbqbiwurzxz.supabase.co | GALEÃO | Ativo |
| EXTRAIR DADOS RELATORIOS | `ixtwxvgtsmbqoucuvjmv` | https://ixtwxvgtsmbqoucuvjmv.supabase.co | APOSENTAR | Pausado |
| Landim Page Restituição | `pyxxvltxhuwgtuhbkzqi` | https://pyxxvltxhuwgtuhbkzqi.supabase.co | APOSENTAR | Ativo |
| renomear | `nnvkehignfsgpllobkpq` | https://nnvkehignfsgpllobkpq.supabase.co | APOSENTAR | Pausado |


---

## Papel de cada projeto principal (contexto)
- **PrevSystem** — o SaaS multiempresa (produto principal). Estava vazio; em construção.
- **PrevFinanças** — módulo/produto financeiro (schema `fin_`/`ref_`). Projeto separado.
- **PrevControl** — importação legada antiga já organizada (máscaras/validações). Fonte de reconciliação.

*Arquivo gerado automaticamente. Se algum ref mudar, atualize a tabela acima.*
