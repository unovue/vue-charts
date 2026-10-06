import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { ErrorBarDirection } from '@/types/bar'

export interface ErrorBarDataItem {
  x: number | null | undefined
  y: number | null | undefined
  value: number
  errorVal?: number[] | number
}

export interface LineCoordinate {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function combineErrorBarLines(
  { x, y, value, errorVal }: ErrorBarDataItem,
  axis: BaseAxisWithScale,
  direction: ErrorBarDirection,
  offset: number,
  width: number,
): LineCoordinate[] | null {
  if (!errorVal || x == null || y == null)
    return null
  if (direction === 'x' && axis.type !== 'number')
    return null

  const [low, high] = Array.isArray(errorVal) ? errorVal : [errorVal, errorVal]
  if (low == null || high == null)
    return null

  const min = axis.scale(value - low)
  const max = axis.scale(value + high)
  if (min == null || max == null)
    return []

  if (direction === 'x') {
    const mid = y + offset
    return [
      { x1: max, y1: mid + width, x2: max, y2: mid - width },
      { x1: min, y1: mid, x2: max, y2: mid },
      { x1: min, y1: mid + width, x2: min, y2: mid - width },
    ]
  }
  const mid = x + offset
  return [
    { x1: mid - width, y1: max, x2: mid + width, y2: max },
    { x1: mid, y1: min, x2: mid, y2: max },
    { x1: mid - width, y1: min, x2: mid + width, y2: min },
  ]
}
