/* eslint-disable no-console -- CLI check results. */
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(root, 'scripts/fixtures/consumers')
const prepare = process.argv.includes('--prepare')
const temporary = await mkdtemp(join(tmpdir(), 'vccs-consumers-'))
const env = { ...process.env, CI: 'true', NODE_ENV: 'production' }
delete env.NODE_PATH
const failures = []

function run(cwd, args) {
  console.log(`\n[${cwd}] pnpm ${args.join(' ')}`)
  const result = spawnSync('pnpm', args, { cwd, env, stdio: 'inherit' })
  if (result.error)
    throw result.error
  if (result.status !== 0)
    throw new Error(`pnpm ${args.join(' ')} failed (exit ${result.status}, signal ${result.signal})`)
}

function check(cwd, args) {
  try {
    run(cwd, args)
  }
  catch (error) {
    console.error(error)
    failures.push(error)
  }
}

try {
  console.log(`Packed consumers; Node ${process.version}; ${prepare ? 'network-enabled preparation' : 'offline frozen installation'}; ${temporary}`)
  run(root, ['--filter', 'vccs', 'build'])
  run(join(root, 'packages/vue'), ['pack', '--pack-destination', temporary])
  const archives = (await readdir(temporary)).filter(name => name.endsWith('.tgz'))
  if (archives.length !== 1)
    throw new Error(`Expected one packed library, found ${archives.length}`)
  await copyFile(join(temporary, archives[0]), join(temporary, 'vccs.tgz'))

  for (const name of ['vite', 'nuxt']) {
    const app = join(temporary, name)
    await cp(join(fixtures, name), app, { recursive: true })
    for (const probe of ['nullability.ts', 'publicProps.ts', 'api-example-0.vue', 'api-example-1.vue', 'standalone.vue', 'renames.vue']) {
      const directory = name === 'vite' ? 'src' : 'app'
      if (probe === 'standalone.vue') {
        const source = await readFile(join(root, 'packages/vue/src/test/types/standalone.vue'), 'utf8')
        await writeFile(join(app, directory, probe), source.replace('from \'../../index\'', 'from \'vccs\''))
      }
      else {
        await copyFile(join(fixtures, probe), join(app, directory, probe))
      }
    }
    // pnpm refreshes the local archive's integrity. Existing registry resolutions
    // stay locked; fixture preparation is required if a new dependency is absent.
    run(app, ['update', 'vccs', '--lockfile-only', ...(prepare ? [] : ['--offline'])])
    if (prepare)
      run(app, ['fetch', '--prod=false'])
    run(app, ['install', '--prod=false', '--offline', '--frozen-lockfile'])
    const lock = await readFile(join(app, 'pnpm-lock.yaml'))
    console.log(`${name} lockfile SHA-256: ${createHash('sha256').update(lock).digest('hex')}`)
    if (prepare)
      await copyFile(join(app, 'pnpm-lock.yaml'), join(fixtures, name, 'pnpm-lock.yaml'))

    if (name === 'vite') {
      const config = JSON.parse(await readFile(join(app, 'tsconfig.json'), 'utf8'))
      if (config.vueCompilerOptions?.strictTemplates !== true)
        throw new Error('Vite must use strictTemplates: true')
      console.log('Vite: strictTemplates=true')
      check(app, ['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'])
      check(app, ['exec', 'vite', 'build'])
      check(app, ['exec', 'vite', 'build', '--config', 'selected.config.mjs'])
      const selected = await readFile(join(app, 'selected-dist/selected.js'), 'utf8')
      const excluded = ['v-charts-treemap', 'v-charts-sankey', 'v-charts-sunburst']
      for (const marker of excluded) {
        if (selected.includes(marker))
          failures.push(new Error(`Selected LineChart/Line bundle includes ${marker}`))
      }
      console.log(`Selected LineChart/Line bundle: ${Buffer.byteLength(selected)} bytes; excluded chart markers: ${excluded.filter(marker => selected.includes(marker)).length}.`)
    }
    else {
      run(app, ['exec', 'nuxi', 'prepare'])
      for (const context of ['app', 'server', 'shared', 'node']) {
        const config = JSON.parse(await readFile(join(app, `.nuxt/tsconfig.${context}.json`), 'utf8'))
        if (config.compilerOptions.strict !== true)
          throw new Error(`Nuxt ${context} must use strict: true`)
        if (context === 'app' && config.vueCompilerOptions?.strictTemplates !== true)
          throw new Error('Nuxt app must use strictTemplates: true')
        console.log(`Nuxt ${context}: strict=true, default skipLibCheck=${config.compilerOptions.skipLibCheck}${context === 'app' ? ', strictTemplates=true' : ''}`)
      }
      const guard = spawnSync(process.execPath, [join(root, 'scripts/check-consumer-declarations.mjs'), app], {
        env,
        stdio: 'inherit',
      })
      if (guard.status !== 0)
        failures.push(new Error('Strict packed vccs declaration guard failed'))
      check(app, ['exec', 'nuxi', 'typecheck'])
      check(app, ['exec', 'nuxi', 'build'])
    }
  }
  if (failures.length)
    throw new AggregateError(failures, `${failures.length} packed consumer checks failed`)
  console.log('\nPASS: fresh packed Vite and Nuxt consumers typecheck strictly and build.')
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  await rm(temporary, { recursive: true, force: true })
}
