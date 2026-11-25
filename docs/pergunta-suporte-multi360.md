# Pergunta para o suporte do Multi360 — token de integração

Objetivo: saber se o Multi360 oferece um **token de integração/API oficial** (longa duração), para um
sistema externo ler os atendimentos e mensagens da conta sem depender do token da sessão do navegador
(que vence e só permite uma sessão por vez).

## Mensagem pronta (copie e envie ao suporte)

> Olá! Sou cliente do Multi360 (conta do Ronaldo Carvalho — Diretor/Gestor). Estou integrando um
> sistema próprio que **lê** os atendimentos e as mensagens da minha conta pela API de vocês
> (endpoints como `/atendimentos/chat/ativos` e `/atendimentos/{id}/mensagens`).
>
> Hoje a única forma de autenticar que encontrei é o **token da sessão do navegador** (o
> `ngStorage-token` do `localStorage`). Ele tem dois problemas para integração: vence em pouco tempo e,
> como é de sessão, cada novo login invalida o token anterior.
>
> **Minha pergunta:** vocês disponibilizam um **token de integração / chave de API oficial** — um token
> de longa duração, feito para integração entre sistemas, que não dependa do login do navegador? Se sim,
> como gero ou solicito esse token para a minha conta? Se houver documentação da API, podem me enviar?
>
> Obrigado!

## Se eles responderem

- **Têm token oficial:** me avise (ou cole a resposta). Eu troco a integração para esse token (longa
  duração) e **jogo fora** a dependência da sessão do navegador. É a solução ideal — funciona com o
  computador desligado e sem guardar senha.
- **Não têm:** caímos na **pecinha do navegador** (usa a sua própria sessão quando você abre o Multi360,
  sem brigar com o seu uso). A rotina na nuvem que "entra como você" foi descartada porque o Multi360 só
  aceita uma sessão por vez — o robô e você ficariam derrubando um ao outro.
