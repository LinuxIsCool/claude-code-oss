import { plugin } from 'bun'
import { resolve } from 'path'

plugin({
  name: 'bun-bundle-shim',
  setup(build) {
    const shimPath = resolve(import.meta.dir, '../src/shims/bun-bundle.ts')

    build.onResolve({ filter: /^bun:bundle$/ }, () => ({
      path: shimPath,
    }))
  },
})
