/* eslint-disable no-console -- Command-line gate and compact verdict. */
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import madge from 'madge'
import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = join(root, 'packages/vue/src')
const evidence = join(root, '.evidence/code')
const ignored = spawnSync('git', ['check-ignore', join(evidence, 'report.json')], { cwd: root })
if (ignored.status !== 0)
  throw new Error('Code evidence must be git-ignored: .evidence/code/report.json')
await mkdir(evidence, { recursive: true })
const excluded = /(?:^|\/)(?:__tests__|__stories__|storybook|test|__breakit__|fixtures)(?:\/|$)|\.(?:spec|test|stories|story)\./
const files = (await readdir(source, { recursive: true }))
  .filter(file => /\.(?:ts|tsx|vue)$/.test(file) && !excluded.test(file)).sort()
const config = JSON.parse(await readFile(join(root, 'packages/vue/tsconfig.json'), 'utf8'))
const report = {
  strict: config.compilerOptions.strict === true,
  files: files.length,
  lines: 0,
  watch: 0,
  any: 0,
  longest: { file: '', lines: 0 },
  disables: 0,
  tsIgnore: 0,
  unexplained: [],
  cycles: [],
  unused: [],
  errors: [],
}
function countAnyTypes(file, text) {
  const descriptor = file.endsWith('.vue') ? parse(text, { filename: file }).descriptor : undefined
  const scripts = descriptor
    ? [descriptor.script, descriptor.scriptSetup].filter(Boolean).map(script => script.content)
    : [text]
  let count = 0
  for (const code of scripts) {
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    function visit(node) {
      if (node.kind === ts.SyntaxKind.AnyKeyword)
        count++
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  const seen = new WeakSet()
  function visitTemplate(node) {
    if (!node || typeof node !== 'object' || seen.has(node))
      return
    seen.add(node)
    if (node.type === 'TSAnyKeyword')
      count++
    for (const value of Object.values(node))
      visitTemplate(value)
  }
  visitTemplate(descriptor?.template?.ast)
  return count
}

for (const file of files) {
  const text = await readFile(join(source, file), 'utf8')
  const lines = text.split('\n')
  if (text.endsWith('\n'))
    lines.pop()
  report.lines += lines.length
  report.watch += (text.match(/\bwatch\s*\(/g) ?? []).length
  report.any += countAnyTypes(file, text)
  if (lines.length > report.longest.lines)
    report.longest = { file, lines: lines.length }
  for (const [index, line] of lines.entries()) {
    report.tsIgnore += (line.match(/@ts-ignore\b/g) ?? []).length
    if (/@ts-expect-error\b/.test(line) && !/@ts-expect-error\s+\S.*\S/.test(line))
      report.unexplained.push(`${file}:${index + 1}: @ts-expect-error needs a reason`)
    if (line.includes('eslint-disable') && line.includes('ts/no-explicit-any')) {
      report.disables++
      if (!/eslint-disable-next-line ts\/no-explicit-any -- \S/.test(line))
        report.unexplained.push(`${file}:${index + 1}: use a next-line disable with a boundary reason`)
    }
  }
}
const graph = await madge(files.map(file => join(source, file)), {
  baseDir: source,
  fileExtensions: ['ts', 'tsx', 'vue'],
  tsConfig: join(root, 'packages/vue/tsconfig.json'),
  excludeRegExp: [excluded],
})
report.cycles = graph.circular()
const knip = spawnSync('pnpm', [
  'exec',
  'knip',
  '--workspace',
  'packages/vue',
  '--include',
  'files,exports,types',
  '--reporter',
  'json',
], { cwd: root, encoding: 'utf8' })
await writeFile(join(evidence, 'knip.json'), knip.stdout)
await writeFile(join(evidence, 'knip-stderr.log'), knip.stderr)
try {
  report.unused = JSON.parse(knip.stdout).issues
  if (!Array.isArray(report.unused))
    throw new Error('Missing knip issue list')
}
catch (error) {
  report.errors.push(`knip did not return a report: ${error.message}`)
}
if (knip.status !== 0)
  report.errors.push(`knip exited ${knip.status}`)
const lint = spawnSync('pnpm', [
  'exec',
  'eslint',
  ...files.map(file => relative(root, join(source, file))),
  '--max-warnings',
  '0',
], { cwd: root, encoding: 'utf8' })
await writeFile(join(evidence, 'eslint.log'), lint.stdout + lint.stderr)
if (lint.status !== 0)
  report.errors.push(`production eslint exited ${lint.status}`)
if (!report.strict)
  report.errors.push('TypeScript strict must remain enabled')
if (report.cycles.length)
  report.errors.push(`${report.cycles.length} import cycles`)
if (report.unused.length)
  report.errors.push(`${report.unused.length} files with unused code`)
if (report.longest.lines > 600)
  report.errors.push(`${report.longest.file}: ${report.longest.lines} lines exceeds 600`)
if (report.any > 0)
  report.errors.push(`${report.any} real any types exceeds 0`)
if (report.disables > 40)
  report.errors.push(`${report.disables} explicit-any disables exceeds 40`)
if (report.tsIgnore)
  report.errors.push(`${report.tsIgnore} @ts-ignore comments`)
report.errors.push(...report.unexplained)
report.passed = report.errors.length === 0
await writeFile(join(evidence, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log([
  `${report.passed ? 'PASS' : 'FAIL'} code: ${report.cycles.length} cycles`,
  `${report.unused.length} unused files/exports`,
  `longest ${report.longest.lines} lines`,
  `${report.any} real any types`,
  `${report.disables} any disables`,
  `${report.tsIgnore} ts-ignore`,
].join(', '))
for (const error of report.errors)
  console.error(error)
process.exitCode = report.passed ? 0 : 1
