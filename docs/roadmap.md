# Roadmap

Funcionalidades planejadas para o debuga-llm-gateway. Este roadmap reflete a direção do community skeleton e pode não corresponder ao roadmap interno do debuga.ai.

## Implementado (v0.1.0)

| Funcionalidade | Status |
|----------------|--------|
| API OpenAI-compatible (chat completions) | Implementado |
| Cloud provider genérico | Implementado |
| vLLM local provider | Implementado |
| Fallback automático (auto mode) | Implementado |
| Streaming SSE | Implementado |
| Autenticação por API key | Implementado |
| Health check com status de providers | Implementado |
| Docker e docker-compose | Implementado |
| Testes unitários (Vitest) | Implementado |

## Planejado (v0.2.0)

| Funcionalidade | Descrição |
|----------------|-----------|
| Provider Ollama | Suporte a Ollama como provider local alternativo |
| Circuit breaker | Desabilitar automaticamente providers com falhas consecutivas |
| Retry com backoff | Retry automático com exponential backoff em erros transientes |
| Métricas Prometheus | Endpoint `/metrics` com latência, throughput e erros por provider |
| Rate limiting | Limitar requisições por API key ou IP |

## Considerado (v0.3.0+)

| Funcionalidade | Descrição |
|----------------|-----------|
| Load balancing | Distribuir requisições entre múltiplas instâncias do mesmo provider |
| Provider LiteLLM | Suporte a LiteLLM como proxy universal |
| Embeddings endpoint | `POST /v1/embeddings` para geração de embeddings |
| Completions endpoint | `POST /v1/completions` (text completion legacy) |
| Request caching | Cache de respostas para prompts idênticos |
| Model aliasing | Mapear nomes de modelo genéricos para IDs específicos de cada provider |
| Webhook notifications | Notificar sistemas externos sobre falhas de provider |
| Admin API | Endpoints para gerenciar providers e configuração em runtime |

## Contribuindo

Contribuições são bem-vindas. Para sugerir funcionalidades ou reportar bugs, abra uma issue no [repositório GitHub](https://github.com/SperryTecnologia/debuga-llm-gateway/issues).

## Aviso

Este roadmap é do community skeleton. O debuga.ai pode implementar funcionalidades adicionais internamente que não estão listadas aqui.
