import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// eslint-disable-next-line test/no-import-node-test
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadCatalog, retrieveGuides, searchCatalog, validateCatalog } from '../packages/vue/usage/vccs-usage.mjs'

test('catalog reads its library version from the owning package', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../packages/vue/package.json', import.meta.url), 'utf8'))
  const catalog = loadCatalog()
  assert.equal(catalog.schemaVersion, 1)
  assert.equal(catalog.vccsVersion, packageJson.version)
})

test('validation accepts complete coverage and reports a missing chart type', () => {
  const catalog = loadCatalog()
  assert.deepEqual(validateCatalog(catalog), [])

  const incomplete = structuredClone(catalog)
  incomplete.guides = incomplete.guides.filter(guide => guide.id !== 'sankey')
  assert.deepEqual(validateCatalog(incomplete), ['Missing chart guide: sankey'])
})

test('every public Chart-suffixed component has a usage guide', () => {
  const source = readFileSync(new URL('../packages/vue/src/componentNames.ts', import.meta.url), 'utf8')
  const componentList = source.match(/export const componentNames = \[([\s\S]*?)\] as const/)?.[1] ?? ''
  const publicNames = [...componentList.matchAll(/'([^']+)'/g)].map(match => match[1])
  const catalog = loadCatalog()
  const documentedRoots = new Set(catalog.guides.filter(guide => guide.category === 'chart').map(guide => guide.components[0]))
  const missing = publicNames.filter(name => name.endsWith('Chart') && !documentedRoots.has(name))

  assert.ok(publicNames.includes('AreaChart'))
  assert.ok(documentedRoots.has('AreaChart'))
  assert.deepEqual(missing, [])
})

test('search routes component names and action-oriented queries', () => {
  const catalog = loadCatalog()
  assert.equal(searchCatalog(catalog, 'build a Sankey flow')[0].id, 'sankey')
  assert.equal(searchCatalog(catalog, '分析分群留存')[0].id, 'cohort-chart')
  assert.equal(searchCatalog(catalog, 'Nuxt SSR deterministic test')[0].id, 'ssr-testing')
})

test('every chart is the first result for its exact public name', () => {
  const catalog = loadCatalog()
  for (const guide of catalog.guides.filter(entry => entry.category === 'chart'))
    assert.equal(searchCatalog(catalog, guide.title)[0]?.id, guide.id)
})

test('retrieve loads one or more guides and rejects unknown ids', () => {
  const catalog = loadCatalog()
  const guides = retrieveGuides(catalog, ['line-chart', 'vue-api'])
  assert.match(guides, /# LineChart/)
  assert.match(guides, /# Vue API rules/)
  assert.throws(() => retrieveGuides(catalog, ['missing-chart']), /Unknown guide/)
})

test('CLI runs through a package-manager bin symlink', () => {
  const directory = mkdtempSync(join(tmpdir(), 'vccs-usage-bin-'))
  try {
    const link = join(directory, 'vccs-usage')
    symlinkSync(fileURLToPath(new URL('../packages/vue/usage/vccs-usage.mjs', import.meta.url)), link)
    const result = spawnSync(process.execPath, [link, 'validate'], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /PASS: vccs /)
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
