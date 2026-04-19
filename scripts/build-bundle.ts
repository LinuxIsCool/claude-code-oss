import * as esbuild from 'esbuild'
import { resolve, dirname } from 'path'
import { chmodSync, readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

const __dir: string =
  (import.meta as any).dir ??
  (import.meta as any).dirname ??
  dirname(fileURLToPath(import.meta.url))

const ROOT = resolve(__dir, '..')
const watch = process.argv.includes('--watch')
const minify = process.argv.includes('--minify')
const noSourcemap = process.argv.includes('--no-sourcemap')

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
const version = pkg.version || '0.0.0-dev'
const buildTime = new Date().toISOString()

const FEATURE_FLAGS: Record<string, boolean> = {
  PROACTIVE: false,
  KAIROS: false,
  KAIROS_BRIEF: false,
  KAIROS_GITHUB_WEBHOOKS: false,
  KAIROS_CHANNELS: false,
  KAIROS_DREAM: false,
  KAIROS_PUSH_NOTIFICATION: false,
  BRIDGE_MODE: false,
  DAEMON: false,
  VOICE_MODE: false,
  AGENT_TRIGGERS: false,
  AGENT_TRIGGERS_REMOTE: false,
  MONITOR_TOOL: false,
  COORDINATOR_MODE: false,
  ABLATION_BASELINE: false,
  DUMP_SYSTEM_PROMPT: false,
  BG_SESSIONS: false,
  HISTORY_SNIP: false,
  WORKFLOW_SCRIPTS: false,
  CCR_REMOTE_SETUP: false,
  EXPERIMENTAL_SKILL_SEARCH: false,
  ULTRAPLAN: false,
  TORCH: false,
  UDS_INBOX: false,
  FORK_SUBAGENT: false,
  BUDDY: false,
  MCP_SKILLS: false,
  REACTIVE_COMPACT: false,
  CONNECTOR_TEXT: false,
  CONTEXT_COLLAPSE: false,
  BYOC_ENVIRONMENT_RUNNER: false,
  SELF_HOSTED_RUNNER: false,
  TEMPLATES: false,
  REVIEW_ARTIFACT: false,
  WEB_BROWSER_TOOL: false,
}

const srcResolverPlugin: esbuild.Plugin = {
  name: 'src-resolver',
  setup(build) {
    build.onResolve({ filter: /^src\// }, (args) => {
      const basePath = resolve(ROOT, args.path)
      if (existsSync(basePath)) {
        return { path: basePath }
      }

      const withoutExt = basePath.replace(/\.(js|jsx)$/, '')
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const candidate = withoutExt + ext
        if (existsSync(candidate)) {
          return { path: candidate }
        }
      }

      const dirPath = basePath.replace(/\.(js|jsx)$/, '')
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const candidate = resolve(dirPath, 'index' + ext)
        if (existsSync(candidate)) {
          return { path: candidate }
        }
      }

      return undefined
    })
  },
}

const featureInliningPlugin: esbuild.Plugin = {
  name: 'feature-inlining',
  setup(build) {
    build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
      if (!args.path.startsWith(resolve(ROOT, 'src'))) {
        return undefined
      }

      const source = readFileSync(args.path, 'utf-8')
      const contents = source.replace(
        /feature\((['"])([A-Z0-9_]+)\1\)/g,
        (_match, _quote: string, name: string) =>
          String(FEATURE_FLAGS[name] ?? false),
      )

      return {
        contents,
        loader: args.path.endsWith('.tsx')
          ? 'tsx'
          : args.path.endsWith('.ts')
            ? 'ts'
            : args.path.endsWith('.jsx')
              ? 'jsx'
              : 'js',
      }
    })
  },
}

const assetStubPlugin: esbuild.Plugin = {
  name: 'asset-stubs',
  setup(build) {
    build.onLoad({ filter: /\.(txt|md)$/ }, async (args) => ({
      contents: readFileSync(args.path, 'utf-8'),
      loader: 'text',
    }))

    build.onLoad({ filter: /\.d\.ts$/ }, async () => ({
      contents: 'export {}',
      loader: 'ts',
    }))
  },
}

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [resolve(ROOT, 'src/entrypoints/cli.tsx')],
  bundle: true,
  platform: 'node',
  target: ['node20', 'es2022'],
  format: 'esm',
  outdir: resolve(ROOT, 'dist'),
  outExtension: { '.js': '.mjs' },
  splitting: false,
  plugins: [srcResolverPlugin, featureInliningPlugin, assetStubPlugin],
  tsconfig: resolve(ROOT, 'tsconfig.json'),
  alias: {
    '@anthropic-ai/sandbox-runtime': resolve(
      ROOT,
      'src/shims/anthropic-sandbox-runtime.ts',
    ),
    '@ant/claude-for-chrome-mcp': resolve(
      ROOT,
      'src/shims/ant-claude-for-chrome-mcp.ts',
    ),
    '@ant/computer-use-mcp': resolve(
      ROOT,
      'src/shims/ant-computer-use-mcp.ts',
    ),
    '@ant/computer-use-mcp/types': resolve(
      ROOT,
      'src/shims/ant-computer-use-mcp-types.ts',
    ),
    '@ant/computer-use-mcp/sentinelApps': resolve(
      ROOT,
      'src/shims/ant-computer-use-mcp-sentinelApps.ts',
    ),
    'color-diff-napi': resolve(ROOT, 'src/native-ts/color-diff/index.ts'),
    'bun:bundle': resolve(ROOT, 'src/shims/bun-bundle.ts'),
  },
  external: [
    'fs', 'path', 'os', 'crypto', 'child_process', 'http', 'https',
    'net', 'tls', 'url', 'util', 'stream', 'events', 'buffer',
    'querystring', 'readline', 'zlib', 'assert', 'tty', 'worker_threads',
    'perf_hooks', 'async_hooks', 'dns', 'dgram', 'cluster',
    'string_decoder', 'module', 'vm', 'constants', 'domain',
    'console', 'process', 'v8', 'inspector',
    'node:*',
    'fsevents',
    'sharp',
    'image-processor-napi',
    '@anthropic-ai/sdk',
    '@anthropic-ai/sdk/*',
    '@anthropic-ai/claude-agent-sdk',
    '@anthropic-ai/bedrock-sdk',
    '@anthropic-ai/foundry-sdk',
    '@anthropic-ai/vertex-sdk',
    '@anthropic-ai/mcpb',
    '@aws-sdk/client-sts',
    '@aws-sdk/client-bedrock',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/credential-provider-node',
    '@azure/identity',
    '@smithy/core',
    '@smithy/node-http-handler',
    'google-auth-library',
    'https-proxy-agent',
    'modifiers-napi',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-proto',
    '@opentelemetry/exporter-prometheus',
    '@opentelemetry/exporter-logs-otlp-grpc',
    '@opentelemetry/exporter-logs-otlp-http',
    '@opentelemetry/exporter-logs-otlp-proto',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-trace-otlp-proto',
  ],
  jsx: 'automatic',
  sourcemap: noSourcemap ? false : 'external',
  minify,
  treeShaking: true,
  define: {
    'MACRO.VERSION': JSON.stringify(version),
    'MACRO.BUILD_TIME': JSON.stringify(buildTime),
    'MACRO.FEEDBACK_CHANNEL': JSON.stringify('#claude-code-oss'),
    'MACRO.NATIVE_PACKAGE_URL': JSON.stringify('@linuxiscool/claude-code-oss-native'),
    'MACRO.PACKAGE_URL': JSON.stringify('@linuxiscool/claude-code-oss'),
    'MACRO.VERSION_CHANGELOG': JSON.stringify('private fork baseline - changelog unavailable'),
    'MACRO.ISSUES_EXPLAINER': JSON.stringify(
      'private fork baseline - no public issue tracker configured'
    ),
    'process.env.USER_TYPE': '"external"',
    'process.env.CLAUDE_CODE_VERIFY_PLAN': '"false"',
    'process.env.NODE_ENV': minify ? '"production"' : '"development"',
  },
  banner: {
    js:
      '#!/usr/bin/env node\n' +
      'import { createRequire as __createRequire } from "node:module";\n' +
      'const require = __createRequire(import.meta.url);\n',
  },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  logLevel: 'info',
  metafile: true,
}

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions)
    await ctx.watch()
    console.log('Watching for changes...')
    return
  }

  const startTime = Date.now()
  const result = await esbuild.build(buildOptions)

  if (result.errors.length > 0) {
    console.error('Build failed')
    process.exit(1)
  }

  const outPath = resolve(ROOT, 'dist/cli.mjs')
  try {
    chmodSync(outPath, 0o755)
  } catch {
    // Non-fatal on platforms where chmod is unsupported.
  }

  const elapsed = Date.now() - startTime

  if (result.metafile) {
    const outFiles = Object.entries(result.metafile.outputs)
    for (const [file, info] of outFiles) {
      if (file.endsWith('.mjs')) {
        const sizeMB = ((info as { bytes: number }).bytes / 1024 / 1024).toFixed(2)
        console.log(`${file}: ${sizeMB} MB`)
      }
    }

    const { writeFileSync } = await import('fs')
    writeFileSync(
      resolve(ROOT, 'dist/meta.json'),
      JSON.stringify(result.metafile, null, 2),
    )
    console.log(`Build complete in ${elapsed}ms`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
