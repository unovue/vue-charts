#!/usr/bin/env node
/* eslint-disable no-console -- a command-line report */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(root, '..', 'package.json'), 'utf8'))

const chartIds = [
  'area-chart',
  'bar-chart',
  'bar-list',
  'calendar-heatmap',
  'cohort-chart',
  'composed-chart',
  'funnel-chart',
  'heatmap',
  'journey-sankey',
  'line-chart',
  'pie-chart',
  'radar-chart',
  'radial-bar-chart',
  'sankey',
  'scatter-chart',
  'sparkline',
  'sunburst-chart',
  'tracker',
  'treemap',
]

export function loadCatalog() {
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
  return { ...catalog, vccsVersion: packageJson.version }
}

function normalize(value) {
  return value.toLowerCase().replaceAll('_', '-').trim()
}

const stopwords = new Set(['a', 'an', 'and', 'are', 'build', 'by', 'chart', 'create', 'for', 'from', 'graph', 'how', 'in', 'is', 'make', 'need', 'of', 'on', 'plot', 'show', 'the', 'to', 'use', 'using', 'want', 'with'])

function queryTokens(query) {
  return normalize(query).split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length > 1 && !stopwords.has(token))
}

function compact(value) {
  return normalize(value).replace(/[^\p{L}\p{N}]/gu, '')
}

function summary(entry, score) {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    category: entry.category,
    path: entry.path,
    score,
  }
}

function score(entry, query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery)
    return 0

  const names = [entry.id, entry.title, ...entry.components]
  const identity = normalize(names.join(' '))
  const topics = normalize([entry.description, ...entry.useCases, ...entry.keywords].join(' '))
  const exactName = names.some(name => compact(name) === compact(query))
  let result = exactName ? 160 : identity.includes(normalizedQuery) ? 60 : 0

  for (const token of queryTokens(query)) {
    if (identity.includes(token))
      result += 20
    if (topics.includes(token))
      result += 6
  }
  for (const phrase of [...entry.useCases, ...entry.keywords]) {
    const normalizedPhrase = normalize(phrase)
    if (normalizedPhrase.length > 1 && normalizedQuery.includes(normalizedPhrase))
      result += 12
  }
  return result
}

export function searchCatalog(catalog, query, limit = 8) {
  return catalog.guides
    .map(entry => summary(entry, score(entry, query)))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit)
}

export function retrieveGuides(catalog, ids) {
  return ids.map((id) => {
    const entry = catalog.guides.find(guide => guide.id === id)
    if (!entry)
      throw new Error(`Unknown guide "${id}". Run the list command to see valid ids.`)
    return readFileSync(join(root, entry.path), 'utf8')
  }).join('\n\n---\n\n')
}

export function validateCatalog(catalog) {
  const errors = []
  const seen = new Set()
  for (const entry of catalog.guides) {
    if (seen.has(entry.id))
      errors.push(`Duplicate guide id: ${entry.id}`)
    seen.add(entry.id)
    for (const field of ['title', 'description', 'category', 'path']) {
      if (!entry[field]) {
        errors.push(`${entry.id}: missing ${field}`)
      }
    }
    if (entry.path.includes('..') || !entry.path.startsWith('guides/'))
      errors.push(`${entry.id}: unsafe guide path ${entry.path}`)
    if (!existsSync(join(root, entry.path))) {
      errors.push(`${entry.id}: missing file ${entry.path}`)
      continue
    }
    if (entry.category === 'chart') {
      const content = readFileSync(join(root, entry.path), 'utf8')
      for (const marker of ['## Data shape', '## Minimal example', '## Chart-specific rules', '```vue']) {
        if (!content.includes(marker)) {
          errors.push(`${entry.id}: missing ${marker}`)
        }
      }
      if (!content.includes(entry.components[0]))
        errors.push(`${entry.id}: example does not name ${entry.components[0]}`)
    }
  }

  const actualChartIds = catalog.guides.filter(entry => entry.category === 'chart').map(entry => entry.id).sort()
  for (const id of chartIds) {
    if (!actualChartIds.includes(id)) {
      errors.push(`Missing chart guide: ${id}`)
    }
  }
  for (const id of actualChartIds) {
    if (!chartIds.includes(id)) {
      errors.push(`Unexpected chart guide: ${id}`)
    }
  }
  return errors
}

function usage() {
  return 'Usage: vccs-usage <search "query" | list | retrieve "id[,id...]" | validate>'
}

function run(argv) {
  const [command, argument] = argv
  const catalog = loadCatalog()
  if (command === 'search' && argument) {
    const results = searchCatalog(catalog, argument)
    if (!results.length)
      throw new Error('No matching guides. Run the list command to browse all guides.')
    console.log(JSON.stringify(results, null, 2))
    return
  }
  if (command === 'list' && !argument) {
    console.log(JSON.stringify(catalog.guides.map(entry => summary(entry, undefined)), null, 2))
    return
  }
  if (command === 'retrieve' && argument) {
    const ids = argument.split(',').map(id => id.trim()).filter(Boolean)
    process.stdout.write(retrieveGuides(catalog, ids))
    return
  }
  if (command === 'validate' && !argument) {
    const errors = validateCatalog(catalog)
    if (errors.length)
      throw new Error(errors.join('\n'))
    const chartCount = catalog.guides.filter(entry => entry.category === 'chart').length
    console.log(`PASS: vccs ${catalog.vccsVersion}; ${catalog.guides.length} guides; ${chartCount} chart types; all chart guides have data and Vue examples.`)
    return
  }
  throw new Error(usage())
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    run(process.argv.slice(2))
  }
  catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
