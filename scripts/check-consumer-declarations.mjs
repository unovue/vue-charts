/* eslint-disable no-console -- CLI declaration diagnostics. */
import { readdirSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const app = resolve(process.argv[2])
const require = createRequire(join(app, 'package.json'))
const ts = require('typescript')

const library = realpathSync(join(app, 'node_modules/vccs'))
const dist = join(library, 'dist')

function declarations(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? declarations(path) : path.endsWith('.d.ts') ? [path] : []
  })
}

const files = declarations(dist)
const program = ts.createProgram(files, {
  strict: true,
  skipLibCheck: false,
  noEmit: true,
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  types: [],
})
const diagnostics = ts.getPreEmitDiagnostics(program)
const own = diagnostics.filter(diagnostic => diagnostic.file?.fileName.startsWith(`${dist}/`))
const external = diagnostics.filter(diagnostic => !own.includes(diagnostic))
const host = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: () => app,
  getNewLine: () => '\n',
}
console.log(ts.formatDiagnostics(diagnostics, host))
console.log(`Strict packed declarations: ${files.length} files; ${own.length} vccs errors; ${external.length} third-party diagnostics.`)
if (own.length)
  process.exitCode = 1
