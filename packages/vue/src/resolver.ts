import type { ComponentResolver } from 'unplugin-vue-components'
import { componentNames } from './componentNames'

export function VccsResolver(options: { prefix?: string } = {}): ComponentResolver {
  const prefix = options.prefix ?? ''
  const names: ReadonlySet<string> = new Set(componentNames)

  return {
    type: 'component',
    resolve(name) {
      if (!name.startsWith(prefix))
        return

      const exportedName = name.slice(prefix.length)
      if (names.has(exportedName))
        return { name: exportedName, from: 'vccs' }
    },
  }
}
