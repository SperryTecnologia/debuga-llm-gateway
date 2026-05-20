# debuga-llm-gateway

**Gateway OpenAI-compatible experimental para roteamento híbrido entre modelos locais e providers cloud.**

Desenvolvida por [Sperry Tecnologia](https://www.sperrytecnologia.com.br).

---

## O que é

Este repositório contém estudos e protótipos de um gateway unificado compatível com a API OpenAI, projetado para rotear requisições entre modelos locais (GPU) e providers cloud de forma transparente. O gateway abstrai a complexidade de múltiplos providers atrás de uma interface única.

Este é um repositório de **componente experimental**, não é o gateway utilizado em produção.

---

## Status

| Aspecto | Classificação |
|---------|--------------|
| Tipo | Componente experimental |
| Código de produção | Não incluso |
| Maturidade | Community / Lab |
| Uso atual na plataforma | Não (roteamento é interno ao backend) |

---

## Como se conecta à debuga.ai

A [debuga.ai](https://github.com/SperryTecnologia/debuga-ai) implementa roteamento LLM internamente no backend (via `streamRoute`). Este repositório estuda a viabilidade de extrair essa lógica para um serviço dedicado, útil em cenários:

- Multi-tenant enterprise (múltiplas instâncias da plataforma)
- Compartilhamento de GPU entre serviços
- Observabilidade centralizada de inferência
- Rate limiting e caching por tenant

---

## Conceito de Gateway

```
┌─────────────────────────────────────────────────┐
│                 LLM Gateway                      │
│  ┌───────────────────────────────────────────┐  │
│  │         OpenAI-compatible API             │  │
│  ├───────────────────────────────────────────┤  │
│  │         Roteamento Inteligente            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │  │
│  │  │ Ollama  │  │ OpenAI  │  │ Gemini  │  │  │
│  │  │ (local) │  │ (cloud) │  │ (cloud) │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  │  │
│  ├───────────────────────────────────────────┤  │
│  │         Observabilidade                   │  │
│  │  Latência | Tokens | Custos | Erros       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Funcionalidades Estudadas

| Feature | Descrição | Status |
|---------|-----------|--------|
| API OpenAI-compatible | `/v1/chat/completions` drop-in | Prototipado |
| Roteamento por modelo | Direciona para provider correto | Prototipado |
| Fallback automático | Retry em provider alternativo | Prototipado |
| Rate limiting | Por API key / tenant | Planejado |
| Caching de respostas | Cache semântico para queries repetidas | Planejado |
| Observabilidade | Métricas Prometheus-compatible | Planejado |
| Load balancing | Distribuição entre múltiplas GPUs | Planejado |

---

## Roteamento

Estratégias de roteamento estudadas:

| Estratégia | Descrição |
|-----------|-----------|
| Priority-based | Tenta provider primário, fallback em ordem |
| Latency-based | Escolhe provider com menor latência recente |
| Cost-based | Prioriza local (custo zero), cloud como fallback |
| Capability-based | Direciona por tipo de tarefa (código, texto, imagem) |
| Round-robin | Distribuição uniforme (para load balancing) |

---

## Observabilidade

Métricas planejadas para o gateway:

| Métrica | Descrição |
|---------|-----------|
| Latência por provider | P50, P95, P99 |
| Tokens consumidos | Input + output por provider |
| Custo estimado | USD por provider/tenant |
| Taxa de erro | Por provider e por tipo |
| Cache hit rate | Eficiência do cache semântico |
| Fallback rate | Frequência de acionamento de fallback |

---

## Uso Previsto

- Avaliar viabilidade de gateway dedicado para cenários enterprise
- Documentar padrões de roteamento LLM
- Prototipar observabilidade de inferência
- Preparar arquitetura para multi-tenant

---

## Limitações

- O gateway dedicado adiciona latência (hop extra)
- Para instância única, o roteamento interno do backend é suficiente
- Caching semântico tem trade-offs de consistência
- Este repositório não contém o código de produção da plataforma
- Não é necessário para deploy padrão da debuga.ai

---

## Roadmap

| Item | Status |
|------|--------|
| Estudo de viabilidade | Concluído |
| Protótipo de roteamento | Concluído |
| Fallback automático | Concluído |
| Rate limiting por tenant | Planejado |
| Cache semântico | Planejado |
| Métricas Prometheus | Planejado |
| Documentação de migração | Planejado |

---

## Licença

Protótipos e documentação sob licença MIT. O código de produção da plataforma é privado.

---

## Sperry Tecnologia

Desenvolvido por [Sperry Tecnologia](https://www.sperrytecnologia.com.br) — infraestrutura, segurança, DevOps e automação com IA.
