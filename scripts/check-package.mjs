import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = await mkdtemp(join(tmpdir(), 'vccs-package-'))

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
  if (result.error)
    throw result.error
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  return result.stdout
}

try {
  run('pnpm', ['--filter', 'vccs', 'build'])
  run('pnpm', ['--dir', 'packages/vue', 'pack', '--pack-destination', temporary])
  const archives = (await readdir(temporary)).filter(name => name.endsWith('.tgz'))
  assert.equal(archives.length, 1, 'Expected exactly one tarball')
  const archive = join(temporary, archives[0])
  const files = new Set(run('tar', ['-tzf', archive], true).trim().split('\n').map(path => path.replace(/^package\//, '')))
  const pkg = JSON.parse(run('tar', ['-xOf', archive, 'package/package.json'], true))
  for (const file of ['package.json', 'README.md', 'LICENSE'])
    assert(files.has(file), `Missing ${file}`)
  for (const [name, entry] of Object.entries(pkg.exports)) {
    for (const condition of ['import', 'types']) {
      const path = entry[condition]?.replace(/^\.\//, '')
      assert(path?.startsWith('dist/'), `${name}: ${condition} must point into dist/`)
      assert(files.has(path), `${name}: missing ${condition} target ${path}`)
    }
    assert(entry.types.endsWith('.d.ts'), `${name}: expected a .d.ts declaration`)
  }
  const forbidden = [...files].filter(path => /(?:^|\/)(?:src|tests?|__tests__|__breakit__|stories|__stories__|storybook|fixtures|\.evidence)(?:\/|$)|\.(?:test|spec|stories|story)\.|\.tsbuildinfo$/.test(path))
  assert.deepEqual(forbidden, [], 'Tarball contains development files')
  run('pnpm', ['exec', 'publint', archive, '--strict'])
  // Strict profile checks every resolution, including legacy node10. Only the
  // expected CJS-to-ESM diagnostic is ignored: vccs supports ESM imports only.
  run('pnpm', ['exec', 'attw', archive, '--profile', 'strict', '--ignore-rules', 'cjs-resolves-to-esm'])
  console.log(`PASS: vccs tarball (${files.size} files), ${Object.keys(pkg.exports).length} exports and declarations, README/LICENSE/package.json; no development files; publint strict; attw strict (only CJS-to-ESM ignored).`)
}
finally {
  await rm(temporary, { recursive: true, force: true })
}
