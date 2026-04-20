#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_CWD="${ROOT}"

OUTPUT="$(
  "${ROOT}/scripts/run-telus-claude-code" \
    --bare \
    --print \
    --output-format text \
    --model telus:mistral-small-3.2 \
    'Use the Bash tool to run pwd, then reply with only the resulting path.'
)"

if [[ "${OUTPUT}" != "${EXPECTED_CWD}" ]]; then
  echo "Unexpected Mistral shim output: ${OUTPUT}" >&2
  exit 1
fi

echo "${OUTPUT}"
