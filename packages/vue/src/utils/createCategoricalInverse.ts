import type { RechartsScale } from '@/types/scale'

export type InverseScaleFunction = (pixelValue: number) => unknown

/**
 * Binary search for sorted arrays (ascending or descending).
 */
function bisect(haystack: ReadonlyArray<number>, needle: number): number {
  let lo = 0
  let hi = haystack.length
  const ascending = haystack[0]! < haystack[haystack.length - 1]!

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (ascending ? haystack[mid]! < needle : haystack[mid]! > needle) {
      lo = mid + 1
    }
    else {
      hi = mid
    }
  }
  return lo
}

/**
 * Creates an inverse scale function for categorical/ordinal scales.
 * Uses bisect to find the closest domain value for a given pixel coordinate.
 */
export function createCategoricalInverse(
  scale: RechartsScale | undefined,
  allDataPointsOnAxis?: ReadonlyArray<unknown>,
): InverseScaleFunction | undefined {
  if (!scale) {
    return undefined
  }
  const domain = allDataPointsOnAxis ?? scale.domain()
  const pixelPositions: number[] = domain.map(d => scale(d) ?? 0)
  const range = scale.range()

  if (domain.length === 0 || range.length < 2) {
    return undefined
  }

  return (pixelValue: number): unknown => {
    const index = bisect(pixelPositions, pixelValue)

    if (index <= 0) {
      return domain[0]
    }
    if (index >= domain.length) {
      return domain[domain.length - 1]
    }

    const leftPixel = pixelPositions[index - 1] ?? 0
    const rightPixel = pixelPositions[index] ?? 0
    if (Math.abs(pixelValue - leftPixel) <= Math.abs(pixelValue - rightPixel)) {
      return domain[index - 1]
    }
    return domain[index]
  }
}

/**
 * Creates an inverse function: uses native `.invert` for numeric scales,
 * falls back to categorical bisect for ordinal/band/point scales.
 */
export function combineInverseScaleFunction(
  scale: RechartsScale | undefined,
): InverseScaleFunction | undefined {
  if (scale == null) {
    return undefined
  }
  if ('invert' in scale && typeof scale.invert === 'function') {
    return scale.invert.bind(scale)
  }
  return createCategoricalInverse(scale, undefined)
}
