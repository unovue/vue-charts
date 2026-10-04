import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

const projectRootDir = resolve(__dirname)

const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
].map(dep => new RegExp(`^${dep}(/.*)?$`))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx() as any,
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
      // Node ESM requires explicit file extensions, including inside declarations.
      // Resolve against emitted declarations so directory barrels and Vue files
      // use the same paths that consumers receive in the tarball.
      async afterBuild() {
        const dist = resolve(__dirname, 'dist')
        const files = await readdir(dist, { recursive: true })
        for (const file of files.filter(file => file.endsWith('.d.ts'))) {
          const path = join(dist, file)
          const content = await readFile(path, 'utf8')
          const rewritten = content.replace(/((?:from\s*|import\s*\(\s*)['"])(\.[^'"]*)(['"])/g, (match, prefix, specifier, suffix) => {
            if (/\.(?:js|mjs|json)$/.test(specifier))
              return match
            const clean = specifier.replace(/\.(?:vue|tsx?)$/, '')
            const target = resolve(dirname(path), clean)
            if (existsSync(`${target}.d.ts`))
              return `${prefix}${clean}.js${suffix}`
            if (existsSync(join(target, 'index.d.ts')))
              return `${prefix}${clean}/index.js${suffix}`
            throw new Error(`Unresolved declaration import ${specifier} in ${file}`)
          })
          if (rewritten !== content)
            await writeFile(path, rewritten)
        }
      },
      cleanVueFileName: true,
      include: [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.vue',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.spec.*',
        'src/**/*.test.*',
        'src/__breakit__/**',
        'src/test/*.ts',
        'src/storybook/**/*',
        'src/**/*.stories.*',
        'src/**/*.story.*',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRootDir, 'src'),
    },
  },
  build: {
    minify: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        nuxt: resolve(__dirname, 'src/nuxt.ts'),
        resolver: resolve(__dirname, 'src/resolver.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: externalDeps,
      output: {
        format: 'es',
        entryFileNames: '[name].mjs',
        dir: './dist/es',
        exports: 'named',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})
