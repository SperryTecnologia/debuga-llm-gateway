# API OpenAI-compatible — subconjunto público

O gateway implementa um **subconjunto** do contrato OpenAI-compatible.

## Rotas

| Método | Rota | Estado |
|---|---|---|
| GET | `/health` | Implementada |
| GET | `/v1/models` | Implementada |
| POST | `/v1/chat/completions` | Implementada |

Não há endpoint de embeddings neste código público.

## Autenticação

Quando `GATEWAY_API_KEY` estiver definido:

```http
Authorization: Bearer <chave>
```

Quando estiver vazio, o middleware deixa o gateway aberto. Use isso apenas em ambiente local isolado.

## Chat não streaming

```bash
curl http://localhost:3100/v1/chat/completions   -H 'Authorization: Bearer chave-local-de-teste'   -H 'Content-Type: application/json'   -d '{"model":"modelo","messages":[{"role":"user","content":"Olá"}]}'
```

## Streaming

Envie `"stream": true`. A resposta é encaminhada como SSE. O fallback só ocorre se o
provider primário falhar antes de o stream ser estabelecido.

## Compatibilidade

A compatibilidade depende também do provider upstream. Parâmetros não reconhecidos podem
ser encaminhados ou rejeitados pelo endpoint de destino. Teste o cliente e o modelo escolhidos.
