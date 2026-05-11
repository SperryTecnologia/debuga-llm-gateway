# debuga-llm-gateway

Gateway OpenAI-compatible para roteamento cloud/local com fallback automático. Community skeleton da stack LLM do [debuga.ai](https://debuga.ai).

## Sobre

O **debuga-llm-gateway** é um skeleton público de um gateway que expõe uma API compatível com o formato OpenAI e roteia requisições entre um provider cloud genérico e uma instância local de [vLLM](https://github.com/vllm-project/vllm), com fallback automático.

Este repositório é uma **versão community/skeleton** — uma base funcional para desenvolvimento e laboratório. A versão de produção do debuga.ai pode conter lógica adicional não publicada neste repositório.

### O que este repositório contém

- API server com endpoints OpenAI-compatible (`/v1/chat/completions`, `/v1/models`)
- Roteamento configurável entre provider cloud e vLLM local
- Fallback automático (local → cloud ou cloud → local)
- Suporte a streaming SSE
- Autenticação por API key (exemplo de laboratório)
- Testes unitários com Vitest
- Docker e docker-compose para ambiente local
- Documentação de arquitetura, providers, API e segurança

### O que este repositório **não** contém

- Lógica real de produção do debuga.ai
- Prompts internos ou system prompts proprietários
- Billing, tenant routing ou regras de plano
- Secrets, tokens ou credenciais
- Dados de clientes ou conversas reais
- Código copiado do SaaS debuga-ai

## Arquitetura

```
Client (OpenAI SDK / curl)
    │
    ▼
┌─────────────────────────┐
│   debuga-llm-gateway    │
│   (:3100)               │
│                         │
│   ┌─────────────────┐   │
│   │     Router      │   │
│   │  (cloud/local/  │   │
│   │   auto+fallback)│   │
│   └────┬───────┬────┘   │
│        │       │        │
│   ┌────▼──┐ ┌──▼────┐   │
│   │ Cloud │ │ vLLM  │   │
│   │Provider│ │Provider│ │
│   └───┬───┘ └───┬───┘   │
└───────┼─────────┼───────┘
        │         │
        ▼         ▼
   Cloud API   vLLM Local
   (:9000)     (:8000)
```

## Quick Start

### 1. Clonar e configurar

```bash
git clone https://github.com/SperryTecnologia/debuga-llm-gateway.git
cd debuga-llm-gateway
cp .env.example .env
# Editar .env com suas configurações
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar em modo desenvolvimento

```bash
npm run dev
```

### 4. Testar

```bash
# Health check
curl http://localhost:3100/health

# Chat completion
curl http://localhost:3100/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-local-dev-key" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

### 5. Com Docker

```bash
docker compose up -d
```

## Modos de Roteamento

O gateway suporta três modos de roteamento, configuráveis via `PREFERRED_PROVIDER`:

| Modo | Comportamento |
|------|--------------|
| `cloud` | Envia todas as requisições para o provider cloud |
| `local` | Envia todas as requisições para o vLLM local |
| `auto` | Tenta local primeiro; se falhar, faz fallback para cloud |

O modo `auto` é útil para ambientes onde o vLLM local pode estar indisponível (ex.: GPU em manutenção).

## API

O gateway expõe os seguintes endpoints, compatíveis com o formato OpenAI:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check do gateway e providers |
| `/v1/models` | GET | Listar modelos disponíveis |
| `/v1/chat/completions` | POST | Chat completion (streaming e não-streaming) |

Consulte [docs/openai-compatible-api.md](docs/openai-compatible-api.md) para detalhes.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar em modo desenvolvimento (watch) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Iniciar versão compilada |
| `npm test` | Rodar testes |
| `npm run test:watch` | Rodar testes em modo watch |

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura](docs/architecture.md) | Visão geral da arquitetura do gateway |
| [Providers](docs/providers.md) | Como funcionam os providers (cloud, vLLM, fallback) |
| [API](docs/openai-compatible-api.md) | Referência da API OpenAI-compatible |
| [Segurança](docs/security.md) | Autenticação e considerações de segurança |
| [Roadmap](docs/roadmap.md) | Funcionalidades planejadas |

## Repositórios Relacionados

| Repositório | Descrição |
|-------------|-----------|
| [debuga-ai](https://github.com/SperryTecnologia/debuga-ai) | Plataforma SaaS principal |
| [debuga-llm-stack](https://github.com/SperryTecnologia/debuga-llm-stack) | Arquitetura da stack LLM |
| [debuga-qwen-coder-lab](https://github.com/SperryTecnologia/debuga-qwen-coder-lab) | Lab de avaliação de modelos Qwen-Coder |
| [debuga-vllm-engine](https://github.com/SperryTecnologia/debuga-vllm-engine) | Engine de inferência vLLM |
| **debuga-llm-gateway** | Este repositório — gateway de roteamento |

## Aviso

Este é um **community skeleton** — uma base funcional para desenvolvimento e laboratório. A versão de produção do debuga.ai pode incluir lógica adicional de roteamento, billing, tenant isolation, rate limiting e outras funcionalidades não publicadas neste repositório.

## Licença

Este projeto está licenciado sob [Apache License 2.0](LICENSE).
