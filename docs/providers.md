# Providers

Este documento descreve como os providers funcionam no debuga-llm-gateway.

## Conceito

Um provider é uma abstração que encapsula a comunicação com um backend LLM. Cada provider implementa a interface `BaseProvider` e expõe métodos para chat completion, streaming, listagem de modelos e health check.

O gateway inclui dois providers prontos e um mecanismo de fallback.

## Cloud Provider

O `CloudProvider` é um provider genérico que se conecta a qualquer API OpenAI-compatible. Pode ser usado com:

- OpenAI API
- Azure OpenAI
- Anthropic (via proxy OpenAI-compatible)
- Together AI
- Groq
- Qualquer endpoint que implemente o formato `/v1/chat/completions`

### Configuração

| Variável | Descrição |
|----------|-----------|
| `CLOUD_PROVIDER_URL` | URL base do provider (ex.: `http://localhost:9000/v1`) |
| `CLOUD_PROVIDER_API_KEY` | API key para autenticação no provider |

### Exemplo

```bash
# Usando OpenAI como cloud provider
CLOUD_PROVIDER_URL=https://api.openai.com/v1
CLOUD_PROVIDER_API_KEY=sk-...
```

## vLLM Provider

O `VllmProvider` se conecta a uma instância local de [vLLM](https://github.com/vllm-project/vllm). O vLLM já expõe uma API OpenAI-compatible nativamente, então o provider segue o mesmo padrão do cloud.

A diferença principal é o health check: o vLLM expõe um endpoint `/health` dedicado (fora do path `/v1`), que o provider usa para verificar disponibilidade.

### Configuração

| Variável | Descrição |
|----------|-----------|
| `VLLM_URL` | URL base do vLLM (ex.: `http://localhost:8000/v1`) |
| `ENABLE_LOCAL_INFERENCE` | Habilitar o provider local (`true`/`false`) |

### Exemplo

```bash
# vLLM rodando localmente
VLLM_URL=http://localhost:8000/v1
ENABLE_LOCAL_INFERENCE=true
```

## Fallback Router

O `FallbackRouter` gerencia a seleção de provider e implementa a lógica de fallback.

### Modos de Operação

| Modo (`PREFERRED_PROVIDER`) | Comportamento |
|----------------------------|--------------|
| `cloud` | Usa apenas o cloud provider. Se falhar, retorna erro. |
| `local` | Usa apenas o vLLM local (requer `ENABLE_LOCAL_INFERENCE=true`). Se falhar, retorna erro. |
| `auto` | Tenta o provider primário. Se falhar, tenta o fallback. Se ambos falharem, retorna erro. |

### Fluxo do Modo Auto

```
Requisição recebida
    │
    ▼
Tenta provider primário
    │
    ├── Sucesso → Retorna resposta
    │
    └── Falha → Tenta fallback
                    │
                    ├── Sucesso → Retorna resposta
                    │
                    └── Falha → Retorna erro
                                "All providers failed"
```

### Header X-Provider

Todas as respostas incluem o header `X-Provider` indicando qual provider processou a requisição. Isso é útil para debugging e monitoramento.

```
X-Provider: cloud
X-Provider: local
```

## Criando um Novo Provider

Para adicionar um novo provider (ex.: Ollama, LiteLLM):

1. Crie um arquivo em `src/providers/novo-provider.ts`
2. Estenda a classe `BaseProvider`
3. Implemente os métodos obrigatórios:
   - `chatCompletion(request)` — Completion síncrono
   - `chatCompletionStream(request)` — Completion com streaming
   - `listModels()` — Listar modelos disponíveis
4. Opcionalmente, sobrescreva `checkHealth()` se o provider tiver um endpoint de health check específico
5. Registre o provider no `src/router.ts`

```typescript
import { BaseProvider } from "./base.js";
import type { ProviderConfig } from "../types.js";

export class OllamaProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async chatCompletion(request) {
    // Implementar comunicação com Ollama
  }

  async chatCompletionStream(request) {
    // Implementar streaming com Ollama
  }

  async listModels() {
    // Implementar listagem de modelos
  }
}
```

## Aviso

Este é um community skeleton. Os providers incluídos são implementações básicas para laboratório. A versão de produção do debuga.ai pode incluir providers adicionais, load balancing, circuit breakers e outras funcionalidades não publicadas.
