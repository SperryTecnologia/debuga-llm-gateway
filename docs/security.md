# Segurança

Este documento descreve as considerações de segurança do debuga-llm-gateway.

## Aviso Importante

A autenticação incluída neste skeleton é uma implementação simples para ambiente de laboratório. **Não é segurança enterprise completa.** Para produção, considere as recomendações na seção "Produção" deste documento.

## Autenticação por API Key

O gateway implementa autenticação simples via Bearer token no header `Authorization`.

### Como Funciona

1. O cliente envia o header `Authorization: Bearer <GATEWAY_API_KEY>`
2. O middleware compara o token com a variável `GATEWAY_API_KEY`
3. Se o token for válido, a requisição prossegue
4. Se o token for inválido ou ausente, retorna HTTP 401

### Configuração

```bash
# .env
GATEWAY_API_KEY=your-local-dev-key
```

Se `GATEWAY_API_KEY` estiver vazio ou não definido, o gateway opera em modo aberto (sem autenticação). Isso é útil para desenvolvimento local, mas nunca deve ser usado em produção.

### Endpoints sem Autenticação

O endpoint `/health` não requer autenticação, permitindo que load balancers e sistemas de monitoramento verifiquem o status do gateway.

## Comunicação com Providers

### Cloud Provider

A comunicação com o cloud provider usa o header `Authorization: Bearer <CLOUD_PROVIDER_API_KEY>`. A API key do cloud provider é armazenada na variável de ambiente `CLOUD_PROVIDER_API_KEY` e nunca é exposta ao cliente.

### vLLM Local

A comunicação com o vLLM local geralmente não requer autenticação, pois ambos estão na mesma rede. Se o vLLM estiver configurado com `--api-key`, o provider pode ser estendido para incluir autenticação.

## Boas Práticas para Laboratório

Mesmo em ambiente de laboratório, as seguintes práticas são recomendadas:

| Prática | Descrição |
|---------|-----------|
| Usar `.env` | Nunca hardcode API keys no código |
| Não commitar `.env` | O `.gitignore` já bloqueia `.env` |
| Rede isolada | Rodar o gateway em rede Docker isolada |
| Firewall local | Não expor a porta 3100 para a internet |
| API key forte | Usar uma key aleatória, mesmo em dev |

## Recomendações para Produção

Para um deploy de produção, as seguintes funcionalidades devem ser implementadas (não incluídas neste skeleton):

| Funcionalidade | Descrição |
|----------------|-----------|
| TLS/HTTPS | Terminar TLS no load balancer ou reverse proxy |
| Rate limiting | Limitar requisições por IP ou por API key |
| JWT ou OAuth | Substituir API key simples por autenticação robusta |
| CORS | Configurar origins permitidos |
| Input validation | Validar e sanitizar todos os campos do body |
| Audit logging | Registrar todas as requisições com metadados |
| Secrets management | Usar vault ou secrets manager em vez de `.env` |
| Network policies | Isolar o gateway em rede privada |

## Aviso

Este é um community skeleton. A versão de produção do debuga.ai implementa camadas adicionais de segurança, autenticação, autorização e isolamento não publicadas neste repositório.


## Estado revisado

A revisão pública de 22/07/2026 confirma que a autenticação é uma única API key opcional e que não há rate limiting, RBAC ou isolamento de tenant no código atual.
