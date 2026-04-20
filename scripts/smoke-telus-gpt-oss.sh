#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TELUS_BASE_URL:-}" ]]; then
  echo "TELUS_BASE_URL is required" >&2
  exit 1
fi

if [[ -z "${TELUS_AUTH_TOKEN:-}" ]]; then
  echo "TELUS_AUTH_TOKEN is required" >&2
  exit 1
fi

MODEL="${TELUS_MODEL_ID:-gpt-oss:120b}"
PROMPT="${1:-Reply with OK only.}"
PAYLOAD_FILE="$(mktemp)"
RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$PAYLOAD_FILE" "$RESPONSE_FILE"' EXIT

cat >"$PAYLOAD_FILE" <<JSON
{"model":"$MODEL","max_tokens":32,"messages":[{"role":"user","content":[{"type":"text","text":"$PROMPT"}]}]}
JSON

HTTP_CODE="$(
  curl -sS \
    -o "$RESPONSE_FILE" \
    -w '%{http_code}' \
    -H "Authorization: Bearer $TELUS_AUTH_TOKEN" \
    -H 'Content-Type: application/json' \
    --data @"$PAYLOAD_FILE" \
    "$TELUS_BASE_URL/v1/messages"
)"

echo "HTTP:$HTTP_CODE"

python - <<'PY' "$RESPONSE_FILE"
import json, sys
from pathlib import Path

resp = json.loads(Path(sys.argv[1]).read_text())
print("id:", resp.get("id"))
print("model:", resp.get("model"))
print("stop_reason:", resp.get("stop_reason"))
for block in resp.get("content", []):
    kind = block.get("type")
    if kind == "text":
        print("text:", block.get("text", ""))
    elif kind == "thinking":
        print("thinking:", block.get("thinking", "")[:200])
PY
