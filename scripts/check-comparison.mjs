// Fails when the comparison disagrees with itself: a library without a chart or a lockfile, a pin
// that differs between the site and its bundle, results measured at other versions, or an omission
// without a note and a source. Offline.
/* eslint-disable no-console -- the problem list is the interface */
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { libraries, reference } from '../benchmark/libraries.mjs'
import { comparisonProblems } from './lib/compare-libraries.mjs'

const benchmark = fileURLToPath(new URL('../benchmark/', import.meta.url))
const json = async path => JSON.parse(await readFile(join(benchmark, path), 'utf8'))

const ids = [...libraries, reference].map(library => library.id)
const manifests = await Promise.all(ids.map(id => existsSync(join(benchmark, 'bundles', id, 'package.json')) ? json(`bundles/${id}/package.json`) : null))
const problems = comparisonProblems({
  libraries,
  reference,
  sitePins: (await json('site/package.json')).dependencies,
  bundleManifests: Object.fromEntries(ids.flatMap((id, index) => manifests[index] ? [[id, manifests[index]]] : [])),
  lockfiles: ids.filter(id => existsSync(join(benchmark, 'bundles', id, 'pnpm-lock.yaml'))),
  chartFiles: await readdir(join(benchmark, 'site/src/charts/line')),
  results: await json('results/latest.json'),
})

if (problems.length) {
  console.error(`The comparison disagrees with itself:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`Comparison consistent: ${libraries.length} libraries and the ${reference.name} reference.`)
