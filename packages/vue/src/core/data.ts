import type { DataKey } from '@/types/common'
import { get } from 'es-toolkit/compat'
import { isNullish, isNumOrStr } from '@/utils/validate'

export function getValueByDataKey<T>(
  obj: T,
  dataKey: DataKey<T> | undefined,
  defaultValue?: unknown,
) {
  if (isNullish(obj) || isNullish(dataKey)) {
    return defaultValue
  }

  if (isNumOrStr(dataKey)) {
    // An exact own key takes precedence, including an explicitly undefined value.
    if (Object.prototype.hasOwnProperty.call(obj, dataKey)) {
      const value = Reflect.get(Object(obj), dataKey)
      return value === undefined ? defaultValue : value
    }
    return get(obj, dataKey, defaultValue)
  }

  if (typeof dataKey === 'function') {
    return dataKey(obj)
  }

  return defaultValue
}
