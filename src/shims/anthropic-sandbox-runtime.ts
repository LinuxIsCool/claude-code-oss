export type FsReadRestrictionConfig = {
  denyOnly?: string[]
  allowWithinDeny?: string[]
}

export type FsWriteRestrictionConfig = {
  allowOnly: string[]
  denyWithinAllow?: string[]
}

export type IgnoreViolationsConfig = Record<string, unknown>

export type NetworkHostPattern = {
  host: string
  port?: number
}

export type NetworkRestrictionConfig = {
  allowedHosts?: string[]
  deniedHosts?: string[]
}

export type SandboxAskCallback = (
  hostPattern: NetworkHostPattern,
) => Promise<boolean> | boolean

export type SandboxDependencyCheck = {
  errors: string[]
  warnings: string[]
}

export type SandboxRuntimeConfig = Record<string, unknown>

export type SandboxViolationEvent = Record<string, unknown>

export class SandboxViolationStore {
  getViolations(): SandboxViolationEvent[] {
    return []
  }
}

const MISSING_SANDBOX_RUNTIME =
  '@anthropic-ai/sandbox-runtime not installed in private fork'

export class SandboxManager {
  static initialize(
    _config?: SandboxRuntimeConfig,
    _callback?: SandboxAskCallback,
  ): Promise<void> {
    return Promise.resolve()
  }

  static updateConfig(_config?: SandboxRuntimeConfig): void {}

  static reset(): Promise<void> {
    return Promise.resolve()
  }

  static checkDependencies(): SandboxDependencyCheck {
    return {
      errors: [MISSING_SANDBOX_RUNTIME],
      warnings: [],
    }
  }

  static isSupportedPlatform(): boolean {
    return false
  }

  static getFsReadConfig(): FsReadRestrictionConfig {
    return {}
  }

  static getFsWriteConfig(): FsWriteRestrictionConfig {
    return { allowOnly: [] }
  }

  static getNetworkRestrictionConfig(): NetworkRestrictionConfig | undefined {
    return undefined
  }

  static getIgnoreViolations(): IgnoreViolationsConfig | undefined {
    return undefined
  }

  static getAllowUnixSockets(): string[] | undefined {
    return undefined
  }

  static getAllowLocalBinding(): boolean | undefined {
    return undefined
  }

  static getEnableWeakerNestedSandbox(): boolean | undefined {
    return undefined
  }

  static getProxyPort(): number | undefined {
    return undefined
  }

  static getSocksProxyPort(): number | undefined {
    return undefined
  }

  static getLinuxHttpSocketPath(): string | undefined {
    return undefined
  }

  static getLinuxSocksSocketPath(): string | undefined {
    return undefined
  }

  static waitForNetworkInitialization(): Promise<boolean> {
    return Promise.resolve(false)
  }

  static wrapWithSandbox(
    command: string,
    _binShell?: string,
    _customConfig?: Partial<SandboxRuntimeConfig>,
    _abortSignal?: AbortSignal,
  ): Promise<string> {
    return Promise.resolve(command)
  }

  static cleanupAfterCommand(): void {}

  static getSandboxViolationStore(): SandboxViolationStore {
    return new SandboxViolationStore()
  }

  static annotateStderrWithSandboxFailures(
    _command: string,
    stderr: string,
  ): string {
    return stderr
  }
}

export const SandboxRuntimeConfigSchema = {
  parse<T>(value: T): T {
    return value
  },
}
