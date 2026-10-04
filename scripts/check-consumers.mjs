import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = await mkdtemp(join(tmpdir(), 'vccs-consumers-'))
const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const libraryPackage = JSON.parse(await readFile(join(root, 'packages/vue/package.json'), 'utf8'))
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

async function write(directory, name, contents) {
  const path = join(directory, name)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, typeof contents === 'string' ? contents : `${JSON.stringify(contents, null, 2)}\n`)
}

const chart = `<script setup lang="ts">
IMPORTS
const data = [{ name: 'A', value: 12 }, { name: 'B', value: 24 }]
</script>

<template>
  <BarChart :width="600" :height="300" :data="data">
    <Bar data-key="value" :is-animation-active="false" />
    <XAxis data-key="name" />
    <YAxis />
    <Tooltip>
      <template #content="{ active, payload, label }">
        <div v-if="active">{{ label }}: {{ payload.map(item => item.value).join(', ') }}</div>
      </template>
      <template #cursor="{ width, height }"><rect :width="width" :height="height" /></template>
    </Tooltip>
    <Legend />
  </BarChart>
  <LineChart :width="600" :height="300" :data="data">
    <Line data-key="value" :is-animation-active="false" />
    <Tooltip />
    <Legend />
  </LineChart>
</template>
`

try {
  console.log(`Packed consumer checks; Node ${process.version}; temporary apps: ${temporary}`)
  run(root, ['--filter', 'vccs', 'build'])
  run(join(root, 'packages/vue'), ['pack', '--pack-destination', temporary])
  const archives = (await readdir(temporary)).filter(name => name.endsWith('.tgz'))
  if (archives.length !== 1)
    throw new Error(`Expected one packed library, found ${archives.length}`)
  const dependencies = {
    'vccs': `file:${join(temporary, archives[0])}`,
    'vue': '^3.5.0',
    'motion-v': libraryPackage.peerDependencies['motion-v'],
  }
  const devDependencies = {
    'typescript': rootPackage.devDependencies.typescript,
    'vue-tsc': rootPackage.devDependencies['vue-tsc'],
    '@types/node': rootPackage.devDependencies['@types/node'],
  }
  const vite = join(temporary, 'vite')
  await write(vite, 'package.json', {
    name: 'vccs-vite-consumer',
    private: true,
    type: 'module',
    packageManager: rootPackage.packageManager,
    dependencies,
    devDependencies: {
      ...devDependencies,
      'vite': rootPackage.devDependencies.vite,
      '@vitejs/plugin-vue': rootPackage.devDependencies['@vitejs/plugin-vue'],
    },
  })
  await write(vite, 'tsconfig.json', {
    compilerOptions: {
      target: 'ES2023',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      types: ['node'],
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    include: ['src/**/*.ts', 'src/**/*.vue'],
  })
  await write(vite, 'vite.config.mjs', 'import { defineConfig } from \'vite\'\nimport vue from \'@vitejs/plugin-vue\'\nexport default defineConfig({ plugins: [vue()] })\n')
  await write(vite, 'index.html', '<!doctype html><html><head><title>vccs consumer</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n')
  await write(vite, 'src/main.ts', 'import { createApp } from \'vue\'\nimport App from \'./App.vue\'\ncreateApp(App).mount(\'#app\')\n')
  await write(vite, 'src/App.vue', chart.replace('IMPORTS', 'import { BarChart, Bar, LineChart, Line, Tooltip, Legend, XAxis, YAxis } from \'vccs\''))
  run(vite, ['install', '--prod=false', '--no-frozen-lockfile'])
  check(vite, ['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'])
  check(vite, ['exec', 'vite', 'build'])

  if (!libraryPackage.exports['./nuxt'])
    throw new Error('The packed library must export vccs/nuxt for the Nuxt consumer check')
  const nuxt = join(temporary, 'nuxt')
  await write(nuxt, 'package.json', {
    name: 'vccs-nuxt-consumer',
    private: true,
    type: 'module',
    packageManager: rootPackage.packageManager,
    dependencies,
    devDependencies: { ...devDependencies, nuxt: libraryPackage.devDependencies.nuxt },
  })
  await write(nuxt, 'nuxt.config.ts', `export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
  devtools: { enabled: false },
  typescript: { strict: true },
})\n`)
  await write(nuxt, 'tsconfig.json', {
    files: [],
    references: ['app', 'server', 'shared', 'node'].map(context => ({ path: `./.nuxt/tsconfig.${context}.json` })),
  })
  // Components stay auto-imported; the explicit slot type also checks the packed public types.
  await write(nuxt, 'app/app.vue', chart
    .replace('IMPORTS', 'import type { TooltipContentProps } from \'vccs\'')
    .replace('const data =', 'const rows: { name: string, value: number }[] =')
    .replaceAll(':data="data"', ':data="rows"')
    .replace('#content="{ active, payload, label }"', '#content="{ active, payload, label }: TooltipContentProps"')
    .replace('payload.map(item => item.value).join(\', \')', 'payload?.[0]?.value'))
  run(nuxt, ['install', '--prod=false', '--no-frozen-lockfile'])
  run(nuxt, ['exec', 'nuxi', 'prepare'])
  for (const context of ['app', 'server', 'shared', 'node']) {
    const config = JSON.parse(await readFile(join(nuxt, `.nuxt/tsconfig.${context}.json`), 'utf8'))
    if (config.compilerOptions.strict !== true)
      throw new Error(`Nuxt ${context} must use strict: true`)
    console.log(`Nuxt ${context}: strict=true, default skipLibCheck=${config.compilerOptions.skipLibCheck}`)
  }
  check(nuxt, ['exec', 'nuxi', 'typecheck'])
  check(nuxt, ['exec', 'nuxi', 'build'])
  if (failures.length)
    throw new AggregateError(failures, `${failures.length} packed consumer checks failed`)
  console.log('\nPASS: packed Vite and Nuxt consumers typecheck strictly and build.')
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  await rm(temporary, { recursive: true, force: true })
}
