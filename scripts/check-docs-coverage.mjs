// Fails when a public component has no docs entry: every name in packages/vue/src/componentNames.ts
// must be in a page title (`title: Bar List`, spaces ignored), a heading (`## Bar props`,
// `## Per-item styling with Cell`) or the first cell of a table row (`| \`Dot\` | … |`) somewhere
// in docs/content. A mention in prose does not count.
/* eslint-disable no-console -- the missing list is the interface */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
// Deprecated components that get a migration row instead of a page.
const exempt = new Set([])

const source = await readFile(join(root, 'packages/vue/src/componentNames.ts'), 'utf8')
const names = [...source.matchAll(/^\s*'([A-Z]\w*)',$/gm)].map(match => match[1])
if (names.length < 10)
  throw new Error('Could not read the component list from componentNames.ts')

const content = join(root, 'docs/content')
const pages = (await readdir(content, { recursive: true })).filter(file => file.endsWith('.md'))
const covered = new Map()
for (const page of pages) {
  for (const line of (await readFile(join(content, page), 'utf8')).split('\n')) {
    const title = line.match(/^title:\s*(.+)$/)?.[1].replace(/\s+/g, '')
    if (title && names.includes(title) && !covered.has(title))
      covered.set(title, page)
    const heading = line.match(/^#{1,6}\s+(.+)$/)?.[1]
    const cell = line.match(/^\|\s*([^|]+?)\s*\|/)?.[1]
    for (const name of names) {
      const token = name.replace(/\W/g, '\\$&')
      const inHeading = heading && new RegExp(`(?:^|[^\\w-])${token}(?:$|[^\\w-])`).test(heading)
      const inTable = cell && new RegExp(`^[\`<]*${token}[\`/>]*$`).test(cell)
      if ((inHeading || inTable) && !covered.has(name))
        covered.set(name, page)
    }
  }
}

const missing = names.filter(name => !covered.has(name) && !exempt.has(name))
if (missing.length) {
  console.error(`FAIL docs coverage: ${missing.length} of ${names.length} public components have no heading or table entry in docs/content:`)
  console.error(`  ${missing.join(', ')}`)
  process.exitCode = 1
}
else {
  console.log(`PASS docs coverage: ${names.length - exempt.size} public components have a heading or table entry (${exempt.size} exempt).`)
}
