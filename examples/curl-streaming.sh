#!/usr/bin/env bash
# ============================================================
# curl-streaming.sh — Streaming chat completion via gateway
# ============================================================
# Usage:
#   ./examples/curl-streaming.sh
#   GATEWAY_URL=http://gpu-server:3100 ./examples/curl-streaming.sh
# ============================================================

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3100}"
API_KEY="${GATEWAY_API_KEY:-your-local-dev-key}"

echo "============================================================"
echo "debuga-llm-gateway — Streaming Example"
echo "Target: $GATEWAY_URL"
echo "============================================================"
echo ""
echo "Sending streaming request..."
echo "---"
echo ""

curl -sN "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "default",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful DevOps assistant. Be concise."
      },
      {
        "role": "user",
        "content": "Explain what a reverse proxy is in 3 sentences."
      }
    ],
    "temperature": 0.1,
    "max_tokens": 256,
    "stream": true
  }'

echo ""
echo ""
echo "============================================================"
echo "Stream complete."
echo "============================================================"
