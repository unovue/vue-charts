# Installation and registration

vccs requires Vue `^3.5`, the `motion-v` `^2.4` peer, and an ESM bundler. The Nuxt module requires Nuxt 4; the Vite resolver requires `unplugin-vue-components` in the application's dev dependencies.

## Install

```sh
pnpm add vccs motion-v
```

Install `motion-v` explicitly because not every package manager installs peers automatically.

## Explicit imports in Vite

Import components from `vccs` and compose them in the template. Retrieve the chart guide before choosing its children.

```ts
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'vccs'
```

Do not deep-import source files, runtime prop definitions, or internal helpers. The only public subpaths are `vccs/nuxt` and `vccs/resolver`.

## Auto-imports in Vite

```sh
pnpm add -D unplugin-vue-components
```

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { VccsResolver } from 'vccs/resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [VccsResolver()] }),
  ],
})
```

The resolver imports a component only when the template uses it. Keep explicit imports for types and `defineChartComponents`.

## Nuxt 4

```ts
export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
})
```

The module registers every public component and composable. Import types and `defineChartComponents` from `vccs`.

When another UI library also registers `Tooltip`, `Legend`, or `Label`, add a prefix:

```ts
export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
  vccs: { prefix: 'V' },
})
```

This registers names such as `VBarChart` and `VLine`. Nuxt 3 is unsupported by the module; do not hide its build error with `transpile` or `ClientOnly` workarounds.

## Related guides

`vue-api`, `typed-rows`, `ssr-testing`.
