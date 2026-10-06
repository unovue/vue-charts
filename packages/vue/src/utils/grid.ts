import { CartesianGridDefaultProps } from '@/cartesian/cartesian-grid/const'
import type { AxisPropsForCartesianGridTicksGeneration } from '@/cartesian/cartesian-grid/type'
import { getTicks } from '@/cartesian/utils/get-ticks'
import type { ChartOffset, TickItem } from '@/types'
import { getTicksOfAxis } from '@/core/axis/ticks'

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

export type HorizontalCoordinatesGenerator = (
  props: {
    yAxis: AxisPropsForCartesianGridTicksGeneration
    width: number
    height: number
    offset: ChartOffset
  },
  syncWithTicks: boolean,
) => number[]

export const defaultHorizontalCoordinatesGenerator: HorizontalCoordinatesGenerator = (
  { yAxis, width, height, offset },
  syncWithTicks,
) => {
  return getCoordinatesOfGrid(
    getTicks({
      ...CartesianGridDefaultProps,
      ...yAxis,
      ticks: getTicksOfAxis(yAxis, true)!,
      viewBox: { x: 0, y: 0, width, height },
    }),
    offset.top!,
    offset.top! + offset.height!,
    syncWithTicks,
  )
}

export type VerticalCoordinatesGenerator = (
  props: {
    xAxis: AxisPropsForCartesianGridTicksGeneration
    width: number
    height: number
    offset: ChartOffset
  },
  syncWithTicks: boolean,
) => number[]

export const defaultVerticalCoordinatesGenerator: VerticalCoordinatesGenerator = (
  { xAxis, width, height, offset },
  syncWithTicks,
) => {
  return getCoordinatesOfGrid(
    getTicks({
      ...CartesianGridDefaultProps,
      ...xAxis,
      ticks: getTicksOfAxis(xAxis, true)!,
      viewBox: { x: 0, y: 0, width, height },
    }),
    offset.left!,
    offset.left! + offset.width!,
    syncWithTicks,
  )
}
