# TELUS Backend Bring-Up

This fork supports Anthropic-compatible backends via:

- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`

The historical working TELUS path used that contract rather than a native
provider integration.

## Supported shortcut aliases

These aliases resolve to the backend model IDs used in the earlier working fork:

- `telus:gpt-oss-120b` -> `gpt-oss:120b`
- `telus:mistral-small-3.2` -> `mistralai/Mistral-Small-3.2-24B-Instruct-2506`
- `telus:gemma-3-27b` -> `google/gemma-3-27b-it`

## Quick start

Build first:

```bash
bun run build
```

Set the TELUS backend environment:

```bash
export TELUS_BASE_URL="https://your-telus-endpoint.example/v1"
export TELUS_AUTH_TOKEN="your-token"
```

Run with the historical wrapper:

```bash
./scripts/run-telus-claude-code --model telus:gpt-oss-120b
```

Or rely on the wrapper default model:

```bash
./scripts/run-telus-claude-code
```

## Notes

- The wrapper defaults `CLAUDE_CODE_SKIP_UPDATE_CHECK=1`
- The wrapper defaults `CLAUDE_CONFIG_DIR` to `~/.claude/claude-code-telus`
- You can override the wrapper model with `TELUS_MODEL`
- `ANTHROPIC_BASE_URL` is now passed into the Anthropic SDK client directly
- TELUS GPT OSS was the historically successful path for native tool-use bring-up
- TELUS Mistral and Gemma previously required more compatibility work around tool calling
