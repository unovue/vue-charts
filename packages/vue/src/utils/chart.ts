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

/**
 * Reads a value as a number for the standalone charts. `null`, `undefined`, an empty string and
 * anything that is not a finite number are missing values (`null`), never `0`.
 */
export function toFiniteNumber(raw: unknown): number | null {
  if (raw == null || (typeof raw === 'string' && raw.trim() === ''))
    return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}
