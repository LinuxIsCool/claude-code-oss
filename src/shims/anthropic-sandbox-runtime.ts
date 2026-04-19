export class SandboxManager {}

export class SandboxViolationStore {}

export const SandboxRuntimeConfigSchema = {
  parse<T>(value: T): T {
    return value
  },
}
