# API OpenAI-Compatible

O debuga-llm-gateway expõe uma API compatível com o formato da OpenAI. Qualquer cliente que funcione com a API da OpenAI pode ser usado com o gateway sem modificação.

## Endpoints

### GET /health

Retorna o status do gateway e dos providers configurados.

**Autenticação**: Não requer API key.

**Resposta (200)**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "gateway": {
    "version": "0.1.0",
    "uptime": 3600,
    "preferredProvider": "cloud"
  },
  "providers": [
    {
      "name": "cloud",
      "healthy": true,
      "latencyMs": 45
    }
  ]
}
```

| Campo `status` | Significado |
|----------------|------------|
| `ok` | Todos os providers estão saudáveis |
| `degraded` | Pelo menos um provider está indisponível |
| `error` | Todos os providers estão indisponíveis |

### GET /v1/models

Lista os modelos disponíveis no provider primário.

**Autenticação**: Requer `Authorization: Bearer <GATEWAY_API_KEY>`.

**Resposta (200)**:

```json
{
  "object": "list",
  "data": [
    {
      "id": "Qwen/Qwen2.5-Coder-7B-Instruct-AWQ",
      "object": "model",
      "created": 1700000000,
      "owned_by": "vllm"
    }
  ]
}
```

### POST /v1/chat/completions

Envia uma requisição de chat completion. Suporta modo síncrono e streaming.

**Autenticação**: Requer `Authorization: Bearer <GATEWAY_API_KEY>`.

**Request Body**:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| `model` | string | Sim | ID do modelo |
| `messages` | array | Sim | Array de mensagens (role + content) |
| `temperature` | number | Não | Aleatoriedade (0.0 a 2.0, default: 1.0) |
| `max_tokens` | number | Não | Máximo de tokens na resposta |
| `top_p` | number | Não | Nucleus sampling (0.0 a 1.0) |
| `frequency_penalty` | number | Não | Penalidade por repetição |
| `presence_penalty` | number | Não | Penalidade por novos tópicos |
| `stop` | string/array | Não | Sequências de parada |
| `stream` | boolean | Não | Habilitar streaming SSE |

**Formato de Mensagem**:

```json
{
  "role": "system" | "user" | "assistant",
  "content": "texto da mensagem"
}
```

**Resposta Síncrona (200)**:

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "Qwen/Qwen2.5-Coder-7B-Instruct-AWQ",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Resposta do modelo."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

**Resposta Streaming (SSE)**:

Quando `stream: true`, a resposta é enviada como Server-Sent Events:

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"...","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"...","choices":[{"index":0,"delta":{"content":"Resposta"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"...","choices":[{"index":0,"delta":{"content":" do"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1700000000,"model":"...","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## Erros

Todas as respostas de erro seguem o formato OpenAI:

```json
{
  "error": {
    "message": "Descrição do erro",
    "type": "invalid_request_error",
    "code": "invalid_messages"
  }
}
```

| HTTP Status | Tipo | Descrição |
|-------------|------|-----------|
| 400 | `invalid_request_error` | Requisição inválida (ex.: messages ausente) |
| 401 | `authentication_error` | API key ausente ou inválida |
| 502 | `server_error` | Provider indisponível ou retornou erro |
| 503 | `server_error` | Gateway em estado de erro |

## Headers de Resposta

| Header | Descrição |
|--------|-----------|
| `X-Provider` | Nome do provider que processou a requisição (`cloud` ou `local`) |

## Usando com OpenAI SDK

O gateway é compatível com o OpenAI SDK oficial:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3100/v1",
    api_key="your-local-dev-key"
)

response = client.chat.completions.create(
    model="default",
    messages=[
        {"role": "user", "content": "Hello"}
    ]
)
print(response.choices[0].message.content)
```

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:3100/v1",
  apiKey: "your-local-dev-key",
});

const response = await client.chat.completions.create({
  model: "default",
  messages: [{ role: "user", content: "Hello" }],
});
console.log(response.choices[0].message.content);
```
