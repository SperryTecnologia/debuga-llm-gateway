# debuga-llm-gateway

**Gateway unificado OpenAI-compatible para roteamento inteligente entre modelos locais (GPU) e providers cloud — com observabilidade, fallback automático e controle de custos.**

Desenvolvido por [Sperry Tecnologia](https://www.sperrytecnologia.com.br).

---

## Visão Geral

Este repositório implementa um gateway de inferência LLM que expõe uma API 100% compatível com o padrão OpenAI (`/v1/chat/completions`), roteando requisições de forma transparente entre modelos locais e providers cloud. Projetado para cenários enterprise da plataforma [debuga.ai](https://debuga.ai) onde múltiplas instâncias ou tenants compartilham infraestrutura de GPU.

```mermaid
flowchart TB
    subgraph Clients["Clientes"]
        C1["debuga.ai<br/>Instância 1"]
        C2["debuga.ai<br/>Instância 2"]
        C3["API Consumers<br/>Terceiros"]
    end

    subgraph Gateway["LLM Gateway"]
        direction TB
        AUTH["Auth & Rate Limit<br/>API Key / Tenant"]
        ROUTER{{"Router Engine<br/>Decisão Inteligente"}}
        CACHE["Semantic Cache<br/>Respostas similares"]
        OBS["Observability<br/>Métricas + Logs"]
    end

    subgraph Providers["Providers"]
        direction TB
        subgraph Local["GPU Local"]
            VLLM["vLLM<br/>Qwen Coder 7B"]
            OLLAMA["Ollama<br/>Qwen 72B"]
        end
        subgraph Cloud["Cloud"]
            OAI["OpenAI"]
            ANT["Anthropic"]
            GEM["Google"]
            DS["DeepSeek"]
        end
    end

    C1 --> AUTH
    C2 --> AUTH
    C3 --> AUTH
    AUTH --> ROUTER
    ROUTER --> CACHE
    CACHE -->|"Cache miss"| Local
    CACHE -->|"Cache miss"| Cloud
    ROUTER --> OBS
```

---

## Funcionalidades

```mermaid
mindmap
    root((LLM Gateway))
        API
            OpenAI-compatible
            /v1/chat/completions
            /v1/embeddings
            /v1/models
            Streaming SSE
        Roteamento
            Priority-based
            Latency-based
            Cost-based
            Capability-based
            Round-robin
        Resiliência
            Fallback automático
            Circuit breaker
            Retry com backoff
            Health checks
        Observabilidade
            Prometheus metrics
            Structured logging
            Request tracing
            Cost tracking
        Segurança
            API Key auth
            Rate limiting per tenant
            Request validation
            PII filtering
        Performance
            Semantic cache
            Connection pooling
            Request batching
            Response streaming
```

---

## Arquitetura de Roteamento

```mermaid
flowchart LR
    subgraph Request["Requisição Entrada"]
        REQ["POST /v1/chat/completions<br/>model: 'auto'"]
    end

    subgraph Analysis["Análise"]
        A1["Classificação<br/>de Tarefa"]
        A2["Estimativa<br/>de Complexidade"]
        A3["Tamanho<br/>do Contexto"]
    end

    subgraph Decision["Decisão de Roteamento"]
        D1{{"Score<br/>Engine"}}
    end

    subgraph Execution["Execução"]
        E1["Provider<br/>Selecionado"]
        E2["Fallback<br/>Chain"]
        E3["Response<br/>Stream"]
    end

    REQ --> A1
    REQ --> A2
    REQ --> A3
    A1 --> D1
    A2 --> D1
    A3 --> D1
    D1 --> E1
    E1 -->|"Falha"| E2
    E1 -->|"Sucesso"| E3
    E2 --> E3
```

### Estratégias de Roteamento

| Estratégia | Descrição | Caso de Uso |
|-----------|-----------|-------------|
| **Priority-based** | Tenta providers em ordem de prioridade | Padrão — GPU local primeiro |
| **Latency-based** | Escolhe provider com menor latência recente | Aplicações real-time |
| **Cost-based** | Prioriza custo zero (local), cloud como fallback | Otimização de custo |
| **Capability-based** | Direciona por tipo de tarefa | Código → Coder, Imagem → Vision |
| **Round-robin** | Distribuição uniforme | Load balancing entre GPUs |

---

## Fallback e Circuit Breaker

```mermaid
stateDiagram-v2
    [*] --> Closed: Provider saudável
    Closed --> Open: 3 falhas em 60s
    Open --> HalfOpen: Timeout (30s)
    HalfOpen --> Closed: Requisição sucesso
    HalfOpen --> Open: Requisição falha

    state Closed {
        [*] --> Normal
        Normal --> Counting: Erro detectado
        Counting --> Normal: Reset timer
    }

    state Open {
        [*] --> Blocked
        Blocked --> Blocked: Requisições → Fallback
    }
```

| Estado | Comportamento | Duração |
|--------|--------------|---------|
| **Closed** | Tráfego normal para o provider | Indefinido |
| **Open** | Todo tráfego vai para fallback | 30s |
| **Half-Open** | 1 requisição de teste | Até resultado |

---

## Semantic Cache

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Cache as Semantic Cache
    participant Provider as LLM Provider

    Client->>Gateway: Requisição
    Gateway->>Cache: Busca por similaridade
    
    alt Cache Hit (similarity > 0.95)
        Cache->>Gateway: Resposta cacheada
        Gateway->>Client: Response (latência < 50ms)
    else Cache Miss
        Gateway->>Provider: Forward request
        Provider->>Gateway: Response
        Gateway->>Cache: Armazena embedding + resposta
        Gateway->>Client: Response
    end
```

| Métrica | Valor Típico |
|---------|-------------|
| Cache hit rate | 15-25% |
| Latência (cache hit) | < 50ms |
| Economia estimada | 20-30% custo cloud |
| TTL padrão | 1 hora |
| Threshold de similaridade | 0.95 |

---

## Observabilidade

```mermaid
flowchart LR
    subgraph Gateway["LLM Gateway"]
        M1["Request Metrics"]
        M2["Provider Metrics"]
        M3["Cost Metrics"]
        M4["Cache Metrics"]
    end

    subgraph Stack["Observability Stack"]
        PROM["Prometheus"]
        GRAF["Grafana"]
        LOKI["Loki (Logs)"]
    end

    subgraph Alertas["Alertas"]
        A1["PagerDuty"]
        A2["Slack"]
    end

    Gateway --> PROM
    Gateway --> LOKI
    PROM --> GRAF
    PROM --> Alertas
    LOKI --> GRAF
```

| Métrica | Descrição | Alerta |
|---------|-----------|--------|
| `gateway_request_total` | Total de requisições | — |
| `gateway_request_duration_seconds` | Latência por provider | P99 > 10s |
| `gateway_provider_errors_total` | Erros por provider | > 5% |
| `gateway_cost_usd_total` | Custo acumulado | > limite/dia |
| `gateway_cache_hit_ratio` | Taxa de cache hit | < 10% |
| `gateway_circuit_open` | Circuit breakers abertos | Qualquer |
| `gateway_active_connections` | Conexões ativas | > 100 |

---

## Rate Limiting por Tenant

```mermaid
graph TB
    subgraph Tenants["Tenants"]
        T1["Tenant A<br/>100 req/min"]
        T2["Tenant B<br/>50 req/min"]
        T3["Tenant C<br/>200 req/min"]
    end

    subgraph Limiter["Rate Limiter"]
        RL["Token Bucket<br/>por API Key"]
    end

    subgraph Resultado["Resultado"]
        OK["200 OK<br/>Requisição processada"]
        LIMIT["429 Too Many Requests<br/>Retry-After header"]
    end

    T1 --> RL
    T2 --> RL
    T3 --> RL
    RL -->|"Dentro do limite"| OK
    RL -->|"Excedeu"| LIMIT
```

---

## API Reference

### Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/v1/chat/completions` | Chat completion (streaming) |
| POST | `/v1/embeddings` | Geração de embeddings |
| GET | `/v1/models` | Lista modelos disponíveis |
| GET | `/health` | Health check |
| GET | `/metrics` | Métricas Prometheus |

### Exemplo de Uso

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Explain Docker networking"}],
    "stream": true
  }'
```

O modelo `"auto"` ativa o roteamento inteligente. Especificar um modelo (ex: `"qwen-coder-7b"`) força o provider correspondente.

---

## Deploy

```bash
# 1. Clone
git clone https://github.com/SperryTecnologia/debuga-llm-gateway.git
cd debuga-llm-gateway

# 2. Instale dependências
pnpm install

# 3. Configure
cp .env.example .env
# Edite com providers e API keys

# 4. Desenvolvimento
pnpm dev

# 5. Produção (Docker)
docker compose up -d
```

---

## Estrutura do Repositório

```
debuga-llm-gateway/
├── src/                  # Código-fonte TypeScript
│   ├── router/           # Lógica de roteamento
│   ├── providers/        # Adaptadores de providers
│   ├── cache/            # Semantic cache
│   ├── middleware/       # Auth, rate limit, logging
│   └── metrics/          # Prometheus exporters
├── tests/                # Testes unitários e integração
├── examples/             # Exemplos de uso
├── docs/                 # Documentação detalhada
├── docker-compose.yml    # Deploy containerizado
├── Dockerfile            # Imagem de produção
└── README.md
```

---

## Cenários de Uso

| Cenário | Descrição | Benefício |
|---------|-----------|-----------|
| **Multi-tenant** | Múltiplas instâncias compartilham GPU | Eficiência de recurso |
| **Enterprise** | Controle centralizado de custos e acesso | Governança |
| **Híbrido** | Dados sensíveis local, resto na cloud | Compliance |
| **High-availability** | Fallback automático entre providers | Uptime 99.9% |
| **Observabilidade** | Dashboard unificado de inferência | Visibilidade |

---

## Repositórios Relacionados

| Repositório | Descrição |
|-------------|-----------|
| [debuga-ai](https://github.com/SperryTecnologia/debuga-ai) | Plataforma principal |
| [debuga-llm-stack](https://github.com/SperryTecnologia/debuga-llm-stack) | Estratégia LLM híbrida (GPU + cloud) |
| [debuga-qwen-coder-lab](https://github.com/SperryTecnologia/debuga-qwen-coder-lab) | Avaliação de modelos para code generation |
| [debuga-vllm-engine](https://github.com/SperryTecnologia/debuga-vllm-engine) | Serving local com vLLM |

---

## Licença

Código do gateway sob licença MIT. O código de produção da plataforma é mantido em repositório privado.

---

*Sperry Tecnologia — Infraestrutura, segurança, DevOps e automação com IA.*
