import { getValueByDataKey } from '../../utils/chart'
import type { BrushStartEndIndex } from './type'

function getIndexInRange(valueRange: number[], x: number) {
  const len = valueRange.length
  let start = 0
  let end = len - 1

  while (end - start > 1) {
    const middle = Math.floor((start + end) / 2)
    if (valueRange[middle] > x) {
      end = middle
    }
    else {
      start = middle
    }
  }

  return x >= valueRange[end] ? end : start
}

export function getIndex({
  startX,
  endX,
  scaleValues,
  gap,
  data,
}: {
  startX: number
  endX: number
  scaleValues: number[]
  gap: number
  data: unknown[]
}): BrushStartEndIndex {
  const lastIndex = data.length - 1
  const min = Math.min(startX, endX)
  const max = Math.max(startX, endX)
  const minIndex = getIndexInRange(scaleValues, min)
  const maxIndex = getIndexInRange(scaleValues, max)

  return {
    startIndex: minIndex - (minIndex % gap),
    endIndex: maxIndex === lastIndex ? lastIndex : maxIndex - (maxIndex % gap),
  }
}

export function getTextOfTick({
  index,
  data,
  tickFormatter,
  dataKey,
}: {
  index: number
  data: unknown[] | undefined
  tickFormatter?: (value: unknown, index: number) => number | string
  dataKey: import('@/types').DataKey<Record<string, unknown>> | undefined
}): number | string {
  const text = getValueByDataKey(data?.[index], dataKey, index)
  return typeof tickFormatter === 'function' ? tickFormatter(text, index) : text
}
