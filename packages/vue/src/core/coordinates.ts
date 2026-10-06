import type { SeriesPoint } from 'd3-shape'
import type { DataKey, TickItem } from '@/types/common'
import type { StackId } from '@/types/tick'
import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { NormalizedStackId } from '@/shape'
import { getValueByDataKey } from '@/core/data'
import { findEntryInArray } from '@/utils/data'
import { isNullish, isNumber, toFiniteNumber } from '@/utils/validate'

export function truncateByDomain(
  value: SeriesPoint<unknown>,
  domain: ReadonlyArray<number>,
): [number, number] | SeriesPoint<unknown> {
  if (!domain || domain.length !== 2 || !isNumber(domain[0]) || !isNumber(domain[1])) {
    return value
  }

  const minValue = Math.min(domain[0], domain[1])
  const maxValue = Math.max(domain[0], domain[1])

  const result: [number, number] = [value[0], value[1]]
  if (!isNumber(value[0]) || value[0] < minValue) {
    result[0] = minValue
  }

  if (!isNumber(value[1]) || value[1] > maxValue) {
    result[1] = maxValue
  }

  if (result[0] > maxValue) {
    result[0] = maxValue
  }

  if (result[1] < minValue) {
    result[1] = minValue
  }

  return result
}

export function getNormalizedStackId(
  publicStackId: StackId | undefined,
): NormalizedStackId | undefined {
  return publicStackId == null ? undefined : String(publicStackId)
}

export function getCateCoordinateOfLine<T extends Record<string, unknown>>({
  axis,
  ticks,
  bandSize,
  entry,
  index,
  dataKey,
}: {
  axis: {
    dataKey?: DataKey<T>
    allowDuplicatedCategory?: boolean
    type?: 'number' | 'category'
    scale: (v: number) => number
  }
  ticks: Array<TickItem>
  bandSize: number
  entry: T
  index: number
  dataKey?: DataKey<T>
}): number | null {
  if (axis.type === 'category') {
    // find coordinate of category axis by the value of category
    // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
    if (!axis.allowDuplicatedCategory && axis.dataKey && !isNullish(entry[axis.dataKey])) {
      // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
      const matchedTick = findEntryInArray(ticks, 'value', entry[axis.dataKey])

      if (matchedTick) {
        return matchedTick.coordinate + bandSize / 2
      }
    }

    return ticks[index] ? ticks[index].coordinate + bandSize / 2 : null
  }

  const value = getValueByDataKey(entry, !isNullish(dataKey) ? dataKey! : axis.dataKey!)

  const number = toFiniteNumber(value instanceof Date ? Number(value) : value)
  return number != null ? axis.scale(number) : null
}

export function getBaseValueOfBar(
  { numericAxis }: { numericAxis: BaseAxisWithScale },
): number | unknown {
  const domain = numericAxis.scale.domain()

  if (numericAxis.type === 'number') {
    // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
    const minValue = Math.min(domain[0], domain[1])
    // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
    const maxValue = Math.max(domain[0], domain[1])

    if (minValue <= 0 && maxValue >= 0) {
      return 0
    }
    if (maxValue < 0) {
      return maxValue
    }

    return minValue
  }

  return domain[0]
}

export function getCateCoordinateOfBar({
  axis,
  ticks,
  offset,
  bandSize,
  entry,
  index,
}: {
  axis: BaseAxisWithScale
  ticks: ReadonlyArray<TickItem>
  offset: number
  bandSize: number
  entry: unknown
  index: number
}): number | null {
  if (axis.type === 'category') {
    return ticks[index] ? ticks[index].coordinate + offset : null
  }
  const value = getValueByDataKey(entry, axis.dataKey, axis.scale.domain()[index])

  const number = toFiniteNumber(value instanceof Date ? Number(value) : value)
  return number != null ? axis.scale(number) - bandSize / 2 + offset : null
}
