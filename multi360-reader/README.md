# Leitor do Multi360 (AtendeIA)

Lê a API interna do Multi360 e guarda as conversas no Supabase (tabelas `at_*`).
Sem navegador pesado — só chamadas HTTP com um "token" (crachá) do Multi360.

## Como pegar o token (o "crachá") no navegador

1. Abra o Multi360 no navegador, **já logado**.
2. Aperte a tecla **F12** (abre as ferramentas do desenvolvedor).
3. Clique na aba **Console**.
4. **Cole a linha abaixo** e aperte **Enter**:

   ```js
   copy(JSON.parse(localStorage['ngStorage-token']))
   ```

   Isso **copia o token** para a área de transferência (não aparece nada — é normal).
   *(Se der erro, cole `localStorage['ngStorage-token']` e copie o texto que aparecer, sem as aspas.)*

5. Abra o arquivo **`.env`** desta pasta com o **Bloco de Notas** e **cole o token** logo após
   `MULTI360_TOKEN=` (sem espaços). Salve.

> ⚠️ O token é como uma senha temporária — não mande para ninguém. Ele fica só no `.env`,
> no seu computador. A sessão do Multi360 dura meses, então isso é raro de refazer.

## Como rodar

```bash
cd multi360-reader
npm install          # só na primeira vez
npm run once         # roda UMA vez (bom para testar)
npm start            # roda continuamente, a cada 15 minutos
```

Se o token expirar, o programa avisa e é só repetir os passos acima.
