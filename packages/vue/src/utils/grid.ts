import type { TickItem } from '@/types'

/**
 * Calculate the Coordinates of grid
 * @param  {Array} ticks           The ticks in axis
 * @param {number} minValue        The minimum value of axis
 * @param {number} maxValue        The maximum value of axis
 * @param {boolean} syncWithTicks  Synchronize grid lines with ticks or not
 * @return {Array}                 Coordinates
 */
export function getCoordinatesOfGrid(ticks: ReadonlyArray<TickItem>, minValue: number, maxValue: number, syncWithTicks: boolean) {
  if (syncWithTicks) {
    return ticks.map(entry => entry.coordinate)
  }

  let hasMin, hasMax

  const values = ticks.map((entry) => {
    if (entry.coordinate === minValue) {
      hasMin = true
    }
    if (entry.coordinate === maxValue) {
      hasMax = true
    }

    return entry.coordinate
  })

  if (!hasMin) {
    values.push(minValue)
  }
  if (!hasMax) {
    values.push(maxValue)
  }

  return values
}
