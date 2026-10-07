import type { NuxtModule } from 'nuxt/schema'
import { addComponent, addImports, defineNuxtModule } from '@nuxt/kit'
import { componentNames, composableNames } from './componentNames'

export interface ModuleOptions {
  /** Prefix for every registered component name, e.g. `'V'` registers `<VBarChart>`. */
  prefix?: string
}

// Keep the declaration portable without importing Nuxt's transitive schema types.
const module: NuxtModule<ModuleOptions, ModuleOptions> = defineNuxtModule<ModuleOptions>({
  // Only Nuxt 4 is exercised by the packed consumer check; Nuxt 3 is end-of-life.
  meta: { name: 'vccs', configKey: 'vccs', compatibility: { nuxt: '>=4.0.0' } },
  defaults: { prefix: '' },
  setup(options) {
    for (const name of componentNames)
      addComponent({ name: options.prefix + name, export: name, filePath: 'vccs' })
    // Composables keep their names: the prefix only applies to components.
    addImports(composableNames.map(name => ({ name, from: 'vccs' })))
  },
})

export default module
