import { resolve } from 'node:path'
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
      cleanVueFileName: true,
      include: [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.vue',
      ],
      exclude: [
        'src/**/__tests__/**',
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
