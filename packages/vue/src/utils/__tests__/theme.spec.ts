import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { chartThemeTokens } from '@/index'

// A theme editor iterates chartThemeTokens; a token used in source but missing here stays unthemable.
it('lists every CSS variable the library reads', () => {
  const root = join(__dirname, '../..')
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(file => /\.(?:ts|tsx|vue)$/.test(file) && !/__tests__|__stories__|[\\/]test[\\/]/.test(file))
  const used = new Set(files.flatMap(file =>
    readFileSync(join(root, file), 'utf8').match(/--v-charts-[a-z0-9-]*[a-z0-9]/g) ?? []))
  expect([...used].sort()).toEqual([...chartThemeTokens].sort())
})
