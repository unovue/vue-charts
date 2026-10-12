/* eslint-disable no-console -- CLI check results. */
import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { copyFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchBrowser } from './lib/browser.mjs'
import { stopProcess, waitForServer } from './lib/check-process.mjs'
import { checkPorts, portText } from './lib/ports.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(root, 'scripts/fixtures/consumers')
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

/**
 * `nuxi dev` serves the packed library without pre-bundling it (Nuxt transpiles module packages),
 * so a dependency that only works pre-bundled breaks the dev client while `nuxi build` passes.
 * Load the page in a browser and require rendered bars, no page errors and clean hydration.
 * `--skip-dev` skips this browser step (used by `pnpm verify --quick`).
 */
async function checkNuxtDev(app) {
  const ports = checkPorts(4670, 4679)
  const port = await firstFreePort(ports)
  if (!port)
    return failures.push(new Error(`Nuxt dev: no free port in ${portText(ports)}`))
  const origin = `http://127.0.0.1:${port}`
  let output = ''
  // Own process group: nuxi forks the dev server, and the whole group must stop.
  const server = spawn(process.execPath, [join(app, 'node_modules/nuxt/bin/nuxt.mjs'), 'dev', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: app,
    env: { ...env, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  server.stdout.on('data', chunk => output += chunk)
  server.stderr.on('data', chunk => output += chunk)
  let browser
  try {
    if (!await waitForServer(server, origin, 120000))
      throw new Error(`nuxi dev did not start on ${origin}:\n${output.slice(-2000)}`)
    browser = await launchBrowser()
    const page = await browser.newPage()
    const problems = []
    page.on('pageerror', error => problems.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error' || /hydration/i.test(message.text()))
        problems.push(`console ${message.type()}: ${message.text()}`)
    })
    await page.goto(origin, { waitUntil: 'networkidle', timeout: 120000 })
    const bars = await page.locator('.v-charts-bar-rectangle').count()
    console.log(`Nuxt dev: ${bars} bars, ${problems.length} problems`)
    if (bars === 0 || problems.length)
      failures.push(new Error(`Nuxt dev page: ${bars} bars; ${problems.join('; ') || 'no problems logged'}`))
  }
  catch (error) {
    failures.push(error)
  }
  finally {
    await browser?.close()
    try {
      process.kill(-server.pid, 'SIGTERM')
    }
    catch {}
    await stopProcess(server)
  }
}

async function firstFreePort(ports) {
  for (const port of ports) {
    const free = await new Promise((resolve) => {
      const probe = createServer().once('error', () => resolve(false))
      probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)))
    })
    if (free)
      return port
  }
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
  console.log(`Packed consumers; Node ${process.version}; ${temporary}`)
  run(root, ['--filter', 'vccs', 'build'])
  run(join(root, 'packages/vue'), ['pack', '--pack-destination', temporary])
  const archives = (await readdir(temporary)).filter(name => name.endsWith('.tgz'))
  if (archives.length !== 1)
    throw new Error(`Expected one packed library, found ${archives.length}`)
  await copyFile(join(temporary, archives[0]), join(temporary, 'vccs.tgz'))

  for (const name of ['vite', 'nuxt']) {
    const app = join(temporary, name)
    await cp(join(fixtures, name), app, { recursive: true })
    const directory = name === 'vite' ? 'src' : 'app'
    // Consumer-only probes live with the fixtures.
    for (const probe of ['nullability.ts', 'publicProps.ts'])
      await copyFile(join(fixtures, probe), join(app, directory, probe))
    // The other probes are the library's own vue-tsc probes, importing the packed 'vccs' instead.
    for (const probe of ['api-example-0.vue', 'api-example-1.vue', 'standalone.vue', 'renames.vue']) {
      const source = await readFile(join(root, 'packages/vue/src/test/types', probe), 'utf8')
      if (!source.includes('from \'../../index\''))
        throw new Error(`${probe} must import the library from '../../index'`)
      await writeFile(join(app, directory, probe), source.replaceAll('from \'../../index\'', 'from \'vccs\''))
    }
    // Direct dependencies are pinned; their dependencies resolve fresh, as for a new user.
    run(app, ['install', '--prod=false', '--prefer-offline', '--no-frozen-lockfile'])

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
      if (!process.argv.includes('--skip-dev'))
        await checkNuxtDev(app)
    }
  }
  if (failures.length)
    throw new AggregateError(failures, `${failures.length} packed consumer checks failed`)
  console.log('\nPASS: fresh packed Vite and Nuxt consumers typecheck strictly and build, and the Nuxt dev page renders.')
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  await rm(temporary, { recursive: true, force: true })
}
