import { type ComputedRef, computed } from 'vue'
import { selectAxisInverseDataSnapScale, selectAxisInverseScale, selectAxisInverseTickSnapScale, selectAxisScale, selectTicksOfAxis, useAppSelector, useChartAxes } from '@/state/chartContext'
import {
  selectActiveLabel,
  selectActiveTooltipCoordinate,
  selectIsTooltipActive,
} from '@/state/selectors/tooltipSelectors'
import {
  useChartHeight,
  useChartWidth,
  useMargin,
  useOffset,
  useViewBox,
} from '@/context/chartLayoutContext'
import type { AxisId } from '@/state/chartCartesianAxis'
import type { Coordinate } from '@/types/common'

export type { InverseScaleFunction } from '@/utils/createCategoricalInverse'

export type ScaleFunction = (value: unknown) => number | undefined

export interface CartesianDataPoint {
  x: number | string
  y: number | string
}

// Re-export existing layout hooks
export { useChartWidth, useChartHeight, useMargin, useOffset }

/**
 * Returns whether the tooltip is currently active (visible).
 *
 * Must be used inside a chart component tree (where chart-local Vue state is provided).
 *
 * @returns A reactive boolean indicating tooltip active state
 */
export function useIsTooltipActive() {
  return useAppSelector(selectIsTooltipActive)
}

/**
 * Returns the current coordinate of the active tooltip.
 *
 * Must be used inside a chart component tree (where chart-local Vue state is provided).
 *
 * @returns A reactive Coordinate ({ x, y }) or undefined when no tooltip is active
 */
export function useActiveTooltipCoordinate() {
  return useAppSelector(selectActiveTooltipCoordinate)
}

/**
 * Returns the label of the currently active tooltip (the value from the axis dataKey at the hovered index).
 *
 * Must be used inside a chart component tree (where chart-local Vue state is provided).
 *
 * @returns A reactive string label or undefined when no tooltip is active
 */
export function useActiveTooltipLabel() {
  return useAppSelector(selectActiveLabel)
}

/**
 * Returns the plot area rectangle { x, y, width, height }.
 * This is the area inside all axes, legend, and brush — where graphical items render.
 *
 * Must be used inside a chart component tree (where chart-local Vue state is provided).
 *
 * @returns A reactive object with x, y, width, height or undefined if offset is not yet available
 */
export function usePlotArea() {
  return useViewBox()
}

/**
 * Returns the computed domain of an X axis.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive domain (categorical or numerical) or undefined
 */
export function useXAxisDomain(axisId: AxisId = 0) {
  return useChartAxes()('xAxis', axisId).domain
}

/**
 * Returns the computed domain of a Y axis.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive domain (categorical or numerical) or undefined
 */
export function useYAxisDomain(axisId: AxisId = 0) {
  return useChartAxes()('yAxis', axisId).domain
}

/**
 * Returns the computed tick items of an X axis.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive array of TickItem or undefined
 */
export function useXAxisTicks(axisId: AxisId = 0) {
  return useAppSelector(state => selectTicksOfAxis(state, 'xAxis', axisId))
}

/**
 * Returns the computed tick items of a Y axis.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive array of TickItem or undefined
 */
export function useYAxisTicks(axisId: AxisId = 0) {
  return useAppSelector(state => selectTicksOfAxis(state, 'yAxis', axisId))
}

/**
 * Returns the scale function for an X axis, mapping data values to pixel coordinates.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive ScaleFunction or undefined if the axis is not yet initialized
 */
export function useXAxisScale(axisId: AxisId = 0): ComputedRef<ScaleFunction | undefined> {
  const scale = useAppSelector(state => selectAxisScale(state, 'xAxis', axisId))
  return computed(() => {
    const s = scale.value
    if (s == null)
      return undefined
    return (value: unknown) => {
      const result = s(value)
      return typeof result === 'number' ? result : undefined
    }
  })
}

/**
 * Returns the scale function for a Y axis, mapping data values to pixel coordinates.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive ScaleFunction or undefined if the axis is not yet initialized
 */
export function useYAxisScale(axisId: AxisId = 0): ComputedRef<ScaleFunction | undefined> {
  const scale = useAppSelector(state => selectAxisScale(state, 'yAxis', axisId))
  return computed(() => {
    const s = scale.value
    if (s == null)
      return undefined
    return (value: unknown) => {
      const result = s(value)
      return typeof result === 'number' ? result : undefined
    }
  })
}

/**
 * Returns the inverse scale function for an X axis, mapping pixel coordinates back to data values.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useXAxisInverseScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseScale(state, 'xAxis', axisId))
}

/**
 * Returns the inverse scale function for a Y axis, mapping pixel coordinates back to data values.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useYAxisInverseScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseScale(state, 'yAxis', axisId))
}

/**
 * Returns the inverse scale function for an X axis that snaps to the nearest data point.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useXAxisInverseDataSnapScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseDataSnapScale(state, 'xAxis', axisId))
}

/**
 * Returns the inverse scale function for a Y axis that snaps to the nearest data point.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useYAxisInverseDataSnapScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseDataSnapScale(state, 'yAxis', axisId))
}

/**
 * Returns the inverse scale function for an X axis that snaps to the nearest tick.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useXAxisInverseTickSnapScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseTickSnapScale(state, 'xAxis', axisId))
}

/**
 * Returns the inverse scale function for a Y axis that snaps to the nearest tick.
 *
 * @param axisId - The axis ID (defaults to 0)
 * @returns A reactive InverseScaleFunction or undefined
 */
export function useYAxisInverseTickSnapScale(axisId: AxisId = 0) {
  return useAppSelector(state => selectAxisInverseTickSnapScale(state, 'yAxis', axisId))
}

/**
 * Convenience hook that maps a data point to pixel coordinates using both X and Y axis scales.
 *
 * @param dataPoint - An object with x and y data values
 * @param xAxisId - The X axis ID (defaults to 0)
 * @param yAxisId - The Y axis ID (defaults to 0)
 * @returns A reactive Coordinate ({ x, y }) or undefined if either scale is unavailable
 */
export function useCartesianScale(
  dataPoint: CartesianDataPoint,
  xAxisId: AxisId = 0,
  yAxisId: AxisId = 0,
): ComputedRef<Coordinate | undefined> {
  const xScale = useXAxisScale(xAxisId)
  const yScale = useYAxisScale(yAxisId)

  return computed(() => {
    const xFn = xScale.value
    const yFn = yScale.value
    if (xFn == null || yFn == null)
      return undefined

    const pixelX = xFn(dataPoint.x)
    const pixelY = yFn(dataPoint.y)
    if (pixelX == null || pixelY == null)
      return undefined

    return { x: pixelX, y: pixelY }
  })
}
