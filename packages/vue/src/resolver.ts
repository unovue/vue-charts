import { componentNames } from './componentNames'

export function VccsResolver(options: { prefix?: string } = {}) {
  const prefix = options.prefix ?? ''
  const names: ReadonlySet<string> = new Set(componentNames)

  return {
    type: 'component' as const,
    resolve(name: string) {
      if (!name.startsWith(prefix))
        return

      const exportedName = name.slice(prefix.length)
      if (names.has(exportedName))
        return { name: exportedName, from: 'vccs' }
    },
  }
}
