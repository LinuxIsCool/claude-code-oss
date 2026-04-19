# Fork Notes

## Phase 1 status

This repo now has a working external build scaffold and can produce:

- `dist/cli.mjs`

Verified fast path:

- `node dist/cli.mjs --version`

## Temporary compromises

Phase 1 intentionally adds temporary placeholder modules so the leaked baseline
can build without Anthropic-internal packages or missing generated files.

Current placeholder areas include:

- `src/services/contextCollapse/`
- `src/services/compact/snipCompact.ts`
- `src/services/compact/snipProjection.ts`
- `src/services/compact/cachedMicrocompact.ts`
- `src/tools/TungstenTool/`
- `src/tools/VerifyPlanExecutionTool/`
- `src/tools/DiscoverSkillsTool/`
- `src/components/messages/*` placeholder renderers
- `src/entrypoints/sdk/*` generated/runtime type placeholders

These are scaffold enablers, not feature-complete implementations.

## Important constraint

The current build script aggressively inlines many `feature(...)` calls to
`false` so esbuild can discard missing internal code paths.

That means the Phase 1 artifact is intentionally biased toward:

- bootability
- bundleability
- external/private-fork fast paths

It is not yet a faithful reproduction of all historical feature gates.

## Next phases

- Phase 2: runtime compatibility fixes
- Phase 3: TELUS GPT OSS restoration
- Phase 4+: real provider and plugin reintegration
