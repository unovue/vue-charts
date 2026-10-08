import { isNan, isNumber, isPercent } from '@/utils/validate'
import { get } from 'es-toolkit/compat'

export function mathSign(value: number) {
  if (value === 0) {
    return 0
  }
  if (value > 0) {
    return 1
  }

  return -1
}

export function hasDuplicate(ary: ReadonlyArray<unknown>): boolean {
  if (!Array.isArray(ary)) {
    return false
  }

  const len = ary.length
  const cache: Record<string, boolean> = {}

  for (let i = 0; i < len; i++) {
    if (!cache[ary[i]]) {
      cache[ary[i]] = true
    }
    else {
      return true
    }
  }

  return false
}

/**
 * Get percent value of a total value
 * @param {number|string} percent A percent
 * @param {number} totalValue     Total value
 * @param {number} defaultValue   The value returned when percent is undefined or invalid
 * @param {boolean} validate      If set to be true, the result will be validated
 * @return {number} value
 */
export function getPercentValue(percent: number | string, totalValue: number, defaultValue = 0, validate = false) {
  if (!isNumber(percent) && typeof percent !== 'string') {
    return defaultValue
  }

  let value: number

  if (isPercent(percent)) {
    const index = percent.indexOf('%')
    value = (totalValue * parseFloat((percent as string).slice(0, index))) / 100
  }
  else {
    value = +percent
  }

  if (isNan(value)) {
    value = defaultValue
  }

  if (validate && value > totalValue) {
    value = totalValue
  }

  return value
}

export function findEntryInArray<T>(
  ary: ReadonlyArray<T>,
  specifiedKey: number | string | ((entry: T) => unknown),
  specifiedValue: unknown,
) {
  if (!ary || !ary.length) {
    return null
  }

  return ary.find(
    entry =>
      entry && (typeof specifiedKey === 'function' ? specifiedKey(entry) : get(entry, specifiedKey)) === specifiedValue,
  )
}
