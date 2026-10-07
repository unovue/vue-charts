import { describe, expect, it } from 'vitest'
import * as publicExports from '@/index'
import { componentNames, composableNames } from '../componentNames'

describe('public component names', () => {
  it('includes all public Vue components and no helpers or prop definitions', () => {
    const names = Object.entries(publicExports)
      .filter(([name, value]) => {
        // Vue options components expose setup/render. Functional components follow
        // Vue's PascalCase export convention; composables and helpers use camelCase.
        return (typeof value === 'object' && value !== null && ('setup' in value || 'render' in value))
          || (typeof value === 'function' && /^[A-Z]/.test(name))
      })
      .map(([name]) => name)
    expect([...componentNames].sort()).toEqual(names.sort())
  })

  // A new public composable must also be auto-imported by the Nuxt module.
  it('lists every public composable', () => {
    const names = Object.keys(publicExports).filter(name => /^use[A-Z]/.test(name))
    expect([...composableNames].sort()).toEqual(names.sort())
  })
})
