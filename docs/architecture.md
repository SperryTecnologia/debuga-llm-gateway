# Arquitetura

Este documento descreve a arquitetura do debuga-llm-gateway, um community skeleton de gateway OpenAI-compatible para roteamento entre providers LLM.

## Visão Geral

O gateway atua como um proxy inteligente entre clientes e providers LLM. Ele recebe requisições no formato OpenAI, seleciona o provider adequado com base na configuração, e encaminha a requisição. Se o provider primário falhar, o gateway pode automaticamente redirecionar para um provider de fallback.

```
┌──────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  (OpenAI SDK, curl, qualquer client HTTP)                │
└────────────────────────┬─────────────────────────────────┘
                         │
                    POST /v1/chat/completions
                    GET  /v1/models
                    GET  /health
                         │
┌────────────────────────▼─────────────────────────────────┐
│                  debuga-llm-gateway                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Auth    │→ │ Logging  │→ │      Router           │   │
│  │Middleware│  │Middleware │  │                       │   │
│  └──────────┘  └──────────┘  │  ┌─────────────────┐  │   │
│                              │  │ FallbackRouter   │  │   │
│                              │  │                  │  │   │
│                              │  │ primary → try    │  │   │
│                              │  │ fallback → try   │  │   │
│                              │  └────┬────────┬───┘  │   │
│                              └───────┼────────┼──────┘   │
│                                      │        │          │
│                              ┌───────▼──┐ ┌───▼──────┐   │
│                              │  Cloud   │ │  vLLM    │   │
│                              │ Provider │ │ Provider │   │
│                              └────┬─────┘ └────┬─────┘   │
└───────────────────────────────────┼────────────┼─────────┘
                                    │            │
                               ┌────▼────┐  ┌───▼─────┐
                               │ Cloud   │  │  vLLM   │
                               │ API     │  │  Local  │
                               │ (:9000) │  │ (:8000) │
                               └─────────┘  └─────────┘
```

## Componentes

### Express Server (`src/index.ts`)

O ponto de entrada da aplicação. Configura o Express com middleware de JSON parsing, autenticação, logging e error handling, e monta o router principal.

### Config (`src/config.ts`)

Carrega configuração de variáveis de ambiente usando dotenv. Define valores padrão seguros para desenvolvimento local. Todas as configurações são tipadas via `GatewayConfig`.

### Router (`src/router.ts`)

Define os endpoints HTTP e orquestra a comunicação com os providers via `FallbackRouter`. Os endpoints seguem o formato da API OpenAI.

### Providers (`src/providers/`)

Cada provider implementa a interface `BaseProvider` e sabe como se comunicar com um backend LLM específico. O gateway inclui dois providers:

| Provider | Arquivo | Descrição |
|----------|---------|-----------|
| Cloud | `providers/cloud.ts` | Provider genérico para qualquer API OpenAI-compatible |
| vLLM | `providers/vllm.ts` | Provider para instância local de vLLM |

### FallbackRouter (`src/providers/fallback.ts`)

Implementa a lógica de seleção de provider e fallback. Suporta três modos:

| Modo | Primário | Fallback |
|------|----------|----------|
| `cloud` | Cloud | Nenhum |
| `local` | vLLM | Nenhum |
| `auto` | Cloud | vLLM (ou vice-versa) |

### Middleware (`src/middleware/`)

| Middleware | Descrição |
|-----------|-----------|
| `auth.ts` | Autenticação por API key (Bearer token) |
| `logging.ts` | Log de requisições com timestamp, método, path, status e duração |
| `errorHandler.ts` | Captura erros não tratados e retorna resposta OpenAI-compatible |

### Utils (`src/utils/`)

| Utilitário | Descrição |
|-----------|-----------|
| `stream.ts` | Helpers para SSE streaming (setup headers, pipe stream) |
| `health.ts` | Agregação de health status de múltiplos providers |

## Fluxo de uma Requisição

1. O cliente envia `POST /v1/chat/completions` com body no formato OpenAI
2. O middleware de auth valida o header `Authorization: Bearer <key>`
3. O middleware de logging registra o início da requisição
4. O router valida o body (messages obrigatório)
5. O `FallbackRouter` seleciona o provider primário
6. O provider primário encaminha a requisição para o backend LLM
7. Se o primário falhar e houver fallback configurado, tenta o fallback
8. A resposta é retornada ao cliente no formato OpenAI
9. O middleware de logging registra o status e duração

## Decisões de Design

Este skeleton foi projetado com as seguintes decisões:

**Express sobre Fastify**: Express foi escolhido por ser mais amplamente conhecido e ter ecossistema maior. Para produção com alta concorrência, Fastify seria uma alternativa válida.

**Providers como classes**: A abstração via `BaseProvider` permite adicionar novos providers (Ollama, LiteLLM, etc.) sem modificar o router.

**Fetch nativo**: O gateway usa `fetch` nativo do Node.js 18+ em vez de axios ou node-fetch, reduzindo dependências.

**Streaming via pipe**: O streaming SSE é implementado como pipe direto do provider para o cliente, sem buffering intermediário.

## Aviso

Este é um community skeleton. A versão de produção do debuga.ai pode incluir lógica adicional de roteamento, load balancing, rate limiting, tenant isolation, billing e outras funcionalidades não publicadas neste repositório.
