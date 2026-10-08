import type { DataKey } from '@/types'
import { getValueByDataKey as readDataKey } from '@/core/data'
import { toRaw } from 'vue'

export function getValueByDataKey<T>(
  obj: unknown,
  dataKey: DataKey<T> | undefined,
  defaultValue?: unknown,
) {
  return readDataKey(typeof dataKey === 'function' ? obj : toRaw(obj), dataKey, defaultValue)
}
