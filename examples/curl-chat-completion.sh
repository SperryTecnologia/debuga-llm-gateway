#!/usr/bin/env bash
# ============================================================
# curl-chat-completion.sh — Chat completion via gateway
# ============================================================
# Usage:
#   ./examples/curl-chat-completion.sh
#   GATEWAY_URL=http://gpu-server:3100 ./examples/curl-chat-completion.sh
# ============================================================

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3100}"
API_KEY="${GATEWAY_API_KEY:-your-local-dev-key}"

echo "============================================================"
echo "debuga-llm-gateway — Chat Completion Example"
echo "Target: $GATEWAY_URL"
echo "============================================================"
echo ""

# 1. Health check
echo "1. Health Check"
echo "---"
curl -s "$GATEWAY_URL/health" | python3 -m json.tool 2>/dev/null || \
    curl -s "$GATEWAY_URL/health"
echo ""
echo ""

# 2. List models
echo "2. List Models"
echo "---"
curl -s "$GATEWAY_URL/v1/models" \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool 2>/dev/null || \
    curl -s "$GATEWAY_URL/v1/models" -H "Authorization: Bearer $API_KEY"
echo ""
echo ""

# 3. Chat completion (non-streaming)
echo "3. Chat Completion (non-streaming)"
echo "---"
curl -s "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "default",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful DevOps assistant."
      },
      {
        "role": "user",
        "content": "How do I check disk usage on Linux?"
      }
    ],
    "temperature": 0.1,
    "max_tokens": 512
  }' | python3 -m json.tool 2>/dev/null || \
    curl -s "$GATEWAY_URL/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d '{"model":"default","messages":[{"role":"user","content":"How do I check disk usage on Linux?"}],"max_tokens":512}'
echo ""
echo ""

# 4. Check which provider was used
echo "4. Provider Header (X-Provider)"
echo "---"
curl -sI "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"model":"default","messages":[{"role":"user","content":"ping"}],"max_tokens":5}' \
  2>/dev/null | grep -i "x-provider" || echo "(Header visible in full response)"
echo ""

echo "============================================================"
echo "Done."
echo "============================================================"
