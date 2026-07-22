<p align="center">
  <img src="https://debuga.ai/favicon.ico" width="84" alt="debuga.ai" />
</p>

<h1 align="center">debuga.ai LLM Gateway</h1>

<p align="center">
  <strong>Gateway community OpenAI-compatible para roteamento entre provider local e cloud</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/openai-compatible-api.md">API</a> ·
  <a href="docs/architecture.md">Arquitetura</a> ·
  <a href="docs/providers.md">Providers</a> ·
  <a href="SECURITY.md">Segurança</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-community%20preview-0891b2" />
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-TypeScript-3178c6" />
  <img alt="Testes" src="https://img.shields.io/badge/testes-26%20casos-0b9811" />
  <img alt="Licença" src="https://img.shields.io/badge/licen%C3%A7a-Apache--2.0-6e7681" />
</p>

---

> [!IMPORTANT]
> Este é um **community preview**. Ele implementa um subconjunto pequeno e auditável de
> uma API OpenAI-compatible. Não inclui rate limiting por tenant, cache semântico,
> circuit breaker, billing, PII filtering ou SLA enterprise.

## Visão geral

O gateway expõe três rotas públicas e encaminha as chamadas para um endpoint cloud
OpenAI-compatible ou um servidor vLLM local. No modo `auto`, tenta o provider local e
faz fallback para cloud quando a chamada inicial falha antes do streaming começar.

```mermaid
flowchart LR
  C[Cliente] --> A[API key opcional]
  A --> G[Gateway Express]
  G --> R{cloud / local / auto}
  R --> V[vLLM local]
  R --> P[Cloud OpenAI-compatible]
  G --> H[Health e logs básicos]
```

## Estado real das capacidades

| Capacidade | Estado | Evidência |
|---|---|---|
| `GET /health` | Implementado | `src/router.ts` |
| `GET /v1/models` | Implementado | `src/router.ts` |
| `POST /v1/chat/completions` | Implementado | `src/router.ts` |
| Streaming SSE | Implementado | `src/utils/stream.ts` |
| API key estática | Implementado | `src/middleware/auth.ts` |
| Provider cloud OpenAI-compatible | Implementado | `src/providers/cloud.ts` |
| Provider vLLM local | Implementado | `src/providers/vllm.ts` |
| Fallback local → cloud | Implementado no modo `auto` | `src/providers/fallback.ts` |
| Health por provider | Implementado | `src/utils/health.ts` |
| Testes automatizados | 26 casos no código-fonte | `tests/` |
| Embeddings | Não implementado | Roadmap |
| Cache semântico | Não implementado | Roadmap |
| Rate limit por tenant | Não implementado | Roadmap |
| Circuit breaker | Não implementado | Roadmap |
| Métricas Prometheus/tracing | Não implementado | Roadmap |
| Billing e controle de custos | Não implementado | Roadmap |

## Modos de roteamento

| `PREFERRED_PROVIDER` | Comportamento |
|---|---|
| `cloud` | usa somente o provider cloud |
| `local` | usa local quando habilitado; caso contrário, cloud |
| `auto` | usa local como primário e cloud como fallback |

> O fallback de streaming só pode ocorrer antes de os headers/chunks serem enviados ao cliente.

## Quick Start

### Docker

```bash
git clone https://github.com/SperryTecnologia/debuga-llm-gateway.git
cd debuga-llm-gateway
cp .env.example .env
```

Edite `.env`. Para um teste cloud, configure pelo menos:

```dotenv
PREFERRED_PROVIDER=cloud
CLOUD_PROVIDER_URL=https://seu-endpoint.example/v1
CLOUD_PROVIDER_API_KEY=substitua
GATEWAY_API_KEY=chave-local-de-teste
```

Depois:

```bash
docker compose config
docker compose up -d --build
docker compose ps
curl -fsS http://localhost:3100/health \
  -H 'Authorization: Bearer chave-local-de-teste'
```

### Chamada de chat

```bash
curl http://localhost:3100/v1/chat/completions \
  -H 'Authorization: Bearer chave-local-de-teste' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "modelo-configurado-no-provider",
    "messages": [
      {"role": "user", "content": "Responda apenas OK"}
    ],
    "stream": false
  }'
```

O header `X-Provider` informa qual provider atendeu a requisição.

## Desenvolvimento

```bash
npm install
npm run build
npm test
npm run dev
```

O repositório contém 26 casos de teste cobrindo providers, validação, health, autenticação
e fallback. A execução depende da instalação das dependências listadas em `package.json`.

## Segurança

- se `GATEWAY_API_KEY` estiver vazio, o gateway aceita requisições sem autenticação;
- restrinja a porta por firewall/rede;
- use TLS em um proxy reverso;
- não registre prompts, respostas ou chaves sem necessidade;
- use timeout e limites de payload apropriados;
- não trate este skeleton como segurança multi-tenant pronta.

Consulte [SECURITY.md](SECURITY.md) e [docs/security.md](docs/security.md).

## Estrutura

```text
debuga-llm-gateway/
├── src/
│   ├── middleware/
│   ├── providers/
│   ├── utils/
│   ├── config.ts
│   ├── router.ts
│   └── index.ts
├── tests/
├── docs/
├── examples/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [API](docs/openai-compatible-api.md) | Rotas e exemplos suportados |
| [Arquitetura](docs/architecture.md) | Componentes e limites |
| [Providers](docs/providers.md) | Cloud, local e fallback |
| [Segurança](docs/security.md) | Riscos e hardening necessário |
| [Roadmap](docs/roadmap.md) | Itens ainda não implementados |

## Ecossistema público

| Projeto | Papel |
|---|---|
| [debuga-ai](https://github.com/SperryTecnologia/debuga-ai) | Produto e documentação oficial |
| [debuga-llm-stack](https://github.com/SperryTecnologia/debuga-llm-stack) | Arquitetura de referência |
| [debuga-llm-gateway](https://github.com/SperryTecnologia/debuga-llm-gateway) | Este gateway community |
| [debuga-vllm-engine](https://github.com/SperryTecnologia/debuga-vllm-engine) | Serving GPU de referência |
| [debuga-qwen-coder-lab](https://github.com/SperryTecnologia/debuga-qwen-coder-lab) | Laboratório de avaliação |

## Licença

Código e documentação sob [Apache License 2.0](LICENSE).

## Sperry Tecnologia

- Plataforma: [debuga.ai](https://debuga.ai)
- Contato: contato@sperrytecnologia.com.br
