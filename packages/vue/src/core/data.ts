import type { DataKey } from '@/types/common'

const keyPaths = new Map<string | number, readonly string[] | null>()

export function getValueByDataKey<T>(
  obj: unknown,
  dataKey: DataKey<T> | undefined,
  defaultValue?: unknown,
) {
  if (obj == null || dataKey == null)
    return defaultValue

  // Preserve the existing untyped boundary for consumer-owned accessors.
  if (typeof dataKey === 'function')
    return Reflect.apply(dataKey, undefined, [obj])

  let path = keyPaths.get(dataKey)
  if (path === undefined) {
    path = typeof dataKey === 'string' && /[.[]/.test(dataKey)
      ? dataKey.replace(/\[(\d+)\]/g, '.$1').split('.')
      : null
    keyPaths.set(dataKey, path)
  }
  // Property access also preserves JavaScript's boxing of primitive rows.
  const row = obj as Record<PropertyKey, unknown>
  let value = row[dataKey]
  if (value === undefined && path && !Object.hasOwn(row, dataKey)) {
    value = row
    for (const segment of path)
      value = (value as Record<PropertyKey, unknown> | null | undefined)?.[segment]
  }
  return value === undefined ? defaultValue : value
}
