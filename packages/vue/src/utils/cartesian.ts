import type { Sign } from '@/types/viewBox'
import type { Size } from '@/types'
import type { CartesianTickItem } from '@/types/tick'
import { getEveryNthWithCondition } from '@/utils/tick'
import { isVisible } from '@/utils/validate'

/**
 * Normalizes the angle so that 0 <= angle < 180.
 * @param {number} angle Angle in degrees.
 * @return {number} the normalized angle with a value of at least 0 and never greater or equal to 180.
 */
export function normalizeAngle(angle: number) {
  return ((angle % 180) + 180) % 180
}

/**
 * Calculates the width of the largest horizontal line that fits inside a rectangle that is displayed at an angle.
 * @param {object} size Width and height of the text in a horizontal position.
 * @param {number} size.width Horizontal text width.
 * @param {number} size.height Horizontal text height.
 * @param {number} angle Angle in degrees in which the text is displayed.
 * @return {number} The width of the largest horizontal line that fits inside a rectangle that is displayed at an angle.
 */
export function getAngledRectangleWidth({ width, height }: Size, angle: number | undefined = 0) {
  // Ensure angle is >= 0 && < 180
  const normalizedAngle = normalizeAngle(angle)
  const angleRadians = (normalizedAngle * Math.PI) / 180

  /* Depending on the height and width of the rectangle, we may need to use different formulas to calculate the angled
   * width. This threshold defines when each formula should kick in. */
  const angleThreshold = Math.atan(height / width)

  const angledWidth
    = angleRadians > angleThreshold && angleRadians < Math.PI - angleThreshold
      ? height / Math.sin(angleRadians)
      : width / Math.cos(angleRadians)

  return Math.abs(angledWidth)
}

export function getEquidistantTicks(
  sign: Sign,
  boundaries: { start: number, end: number },
  getTickSize: (tick: CartesianTickItem, index: number) => number,
  ticks: ReadonlyArray<CartesianTickItem>,
  minTickGap: number,
): ReadonlyArray<CartesianTickItem> {
  // If the ticks are readonly, then the slice might not be necessary
  const result = (ticks || []).slice()

  const { start: initialStart, end } = boundaries
  let index = 0
  // Premature optimisation idea 1: Estimate a lower bound, and start from there.
  // For now, start from every tick
  let stepsize = 1
  let start = initialStart

  while (stepsize <= result.length) {
    // Given stepsize, evaluate whether every stepsize-th tick can be shown.
    // If it can not, then increase the stepsize by 1, and try again.

    const entry = ticks?.[index]

    // Break condition - If we have evaluated all the ticks, then we are done.
    if (entry === undefined) {
      return getEveryNthWithCondition(ticks, stepsize) ?? []
    }

    // Check if the element collides with the next element
    const i = index
    let size: number | undefined
    const getSize = () => {
      if (size === undefined) {
        size = getTickSize(entry, i)
      }

      return size
    }

    const tickCoord = entry.coordinate
    // We will always show the first tick.
    const isShow = index === 0 || isVisible(sign, tickCoord, getSize, start, end)

    if (!isShow) {
      // Start all over with a larger stepsize
      index = 0
      start = initialStart
      stepsize += 1
    }

    if (isShow) {
      // If it can be shown, update the start
      start = tickCoord + sign * (getSize() / 2 + minTickGap)
      index += stepsize
    }
  }

  return []
}
