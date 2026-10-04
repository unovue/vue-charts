import type { NuxtModule } from 'nuxt/schema'
import { addComponent, defineNuxtModule } from '@nuxt/kit'
import { componentNames } from './componentNames'

export interface ModuleOptions {
  prefix?: string
  components?: boolean
}

// Keep the declaration portable without importing Nuxt's transitive schema types.
const module: NuxtModule<ModuleOptions, ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: { name: 'vccs', configKey: 'vccs' },
  defaults: { prefix: '', components: true },
  setup(options) {
    if (!options.components)
      return

    for (const name of componentNames) {
      addComponent({ name: options.prefix + name, export: name, filePath: 'vccs' })
    }
  },
})

export default module
