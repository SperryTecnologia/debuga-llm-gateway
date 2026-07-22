# Providers

## Cloud

`CloudProvider` encaminha as rotas para `CLOUD_PROVIDER_URL` e inclui
`CLOUD_PROVIDER_API_KEY` como Bearer token quando configurada.

## Local

`VllmProvider` aponta para `VLLM_URL` e não adiciona chave por padrão.
Proteja o endpoint local por rede ou configure autenticação no engine.

## Fallback

No modo `auto`, o local é tentado primeiro. Uma falha de conexão, timeout ou resposta
HTTP não bem-sucedida pode acionar o cloud. Se ambos falharem, o gateway retorna erro 502.

## Health

O gateway consulta os endpoints dos providers e informa estado agregado em `/health`.
Health não substitui um teste de qualidade de inferência.

## Adicionando um provider

1. estenda `BaseProvider`;
2. implemente chat, streaming, modelos e health;
3. adicione configuração explícita;
4. crie testes;
5. documente retenção, autenticação e limites do provider.
