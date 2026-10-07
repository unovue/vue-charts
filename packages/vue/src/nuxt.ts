import type { NuxtModule } from 'nuxt/schema'
import { addComponent, addImports, defineNuxtModule, extendViteConfig, getNuxtVersion, isNuxtMajorVersion } from '@nuxt/kit'
import { componentNames, composableNames } from './componentNames'

export interface ModuleOptions {
  /** Prefix for every registered component name, e.g. `'V'` registers `<VBarChart>`. */
  prefix?: string
}

// Keep the declaration portable without importing Nuxt's transitive schema types.
const module: NuxtModule<ModuleOptions, ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: { name: 'vccs', configKey: 'vccs' },
  defaults: { prefix: '' },
  setup(options, nuxt) {
    // Only Nuxt 4 is exercised by the packed consumer check; Nuxt 3 is end-of-life. A compatibility
    // range only warns and skips the module, which ships pages without charts, so fail the build.
    if (!isNuxtMajorVersion(4, nuxt))
      throw new Error(`vccs/nuxt needs Nuxt 4, found ${getNuxtVersion(nuxt)}. On Nuxt 3, import components from 'vccs' or use 'vccs/resolver'.`)
    for (const name of componentNames)
      addComponent({ name: options.prefix + name, export: name, filePath: 'vccs' })
    // Composables keep their names: the prefix only applies to components.
    addImports(composableNames.map(name => ({ name, from: 'vccs' })))
    // Nuxt transpiles module packages, so Vite does not pre-bundle vccs in dev. decimal.js-light then
    // resolves through its "browser" field to a UMD file without a default export; pre-bundle it.
    extendViteConfig((config) => {
      config.optimizeDeps ??= {}
      ;(config.optimizeDeps.include ??= []).push('vccs > decimal.js-light')
    })
  },
})

export default module
