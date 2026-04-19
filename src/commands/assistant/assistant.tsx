import type { Command } from '../../types/command.js'

export const assistantCommand: Command = {
  type: 'local-jsx',
  name: 'assistant',
  description: 'Assistant command unavailable in this external build',
  isEnabled: () => false,
  userFacingName() {
    return '/assistant'
  },
  async call() {
    return null
  },
}
