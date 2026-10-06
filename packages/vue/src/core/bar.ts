import type { DataKey, TickItem } from '@/types/common'
import type { BarPositionPosition, BarRectangleItem, BarSettings } from '@/types/bar'
import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { Series, SeriesPoint } from 'd3-shape'
import type { ChartOffsetInternal } from '@/utils/types'
import type { MinPointSize } from '@/shape'
import { getBaseValueOfBar, getCateCoordinateOfBar, truncateByDomain } from '@/core/coordinates'
import { getValueByDataKey } from '@/core/data'
import { isNullish, isNumber } from '@/utils/validate'
import { invariant } from 'es-toolkit'
import { isNaN } from 'es-toolkit/compat'
import { mathSign } from '@/utils/data'

interface Rectangle {
  x: number | null
  y: number | null
  width: number
  height: number
}

/**
 * Safely gets minPointSize from the minPointSize prop if it is a function
 * @param minPointSize minPointSize as passed to the Bar component
 * @param defaultValue default minPointSize
 * @returns minPointSize
 */
export function minPointSizeCallback(minPointSize: MinPointSize, defaultValue = 0) {
  return (value: unknown, index: number): number => {
    if (isNumber(minPointSize))
      return minPointSize
    const isValueNumberOrNil = isNumber(value) || isNullish(value)
    if (isValueNumberOrNil) {
      return minPointSize(value as number, index)
    }

    invariant(
      isValueNumberOrNil,
      `minPointSize callback function received a value with type of ${typeof value}. Currently only numbers or null/undefined are supported.`,
    )
    return defaultValue
  }
}

const defaultMinPointSize: number = 0
export function computeBarRectangles({
  layout,
  barSettings: { dataKey, minPointSize: minPointSizeProp },
  pos,
  bandSize,
  xAxis,
  yAxis,
  xAxisTicks,
  yAxisTicks,
  stackedData,
  displayedData,
  offset,
}: {
  layout: 'horizontal' | 'vertical'
  barSettings: BarSettings
  pos: BarPositionPosition
  bandSize: number
  xAxis: BaseAxisWithScale
  yAxis: BaseAxisWithScale
  xAxisTicks: TickItem[]
  yAxisTicks: TickItem[]
  stackedData: Series<unknown, DataKey<unknown>> | undefined
  offset: ChartOffsetInternal
  displayedData: readonly unknown[]
}): ReadonlyArray<BarRectangleItem> | undefined {
  const parentViewBox = { x: offset.left, y: offset.top, width: offset.width, height: offset.height }
  const numericAxis = layout === 'horizontal' ? yAxis : xAxis
  // @ts-expect-error this assumes that the domain is always numeric, but doesn't check for it
  const stackedDomain: ReadonlyArray<number> = stackedData ? numericAxis.scale.domain() : null
  const baseValue = getBaseValueOfBar({ numericAxis })
  const stackedBarStart: number | undefined = numericAxis.scale(baseValue)

  return displayedData.map((rawEntry, index): BarRectangleItem => {
    const entry = rawEntry
    let value: [number, number] | SeriesPoint<unknown>
    let x, y, width, height, background: Rectangle

    if (stackedData) {
      // The axis stack already contains the displayed data range.
      value = truncateByDomain(stackedData[index], stackedDomain)
    }
    else {
      const rawValue = getValueByDataKey(entry, dataKey)
      // Preserve scalar/range data and the scale's existing coercion at this input boundary.
      value = Array.isArray(rawValue)
        ? rawValue as [number, number]
        : [baseValue as number, rawValue as number]
    }

    const minPointSize = minPointSizeCallback(minPointSizeProp, defaultMinPointSize)(value[1], index)

    if (layout === 'horizontal') {
      const [baseValueScale, currentValueScale] = [yAxis.scale(value[0]), yAxis.scale(value[1])]
      x = getCateCoordinateOfBar({
        axis: xAxis,
        ticks: xAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index,
      })
      y = currentValueScale ?? baseValueScale
      width = pos.size!
      const computedHeight = baseValueScale - currentValueScale
      height = isNaN(computedHeight) ? 0 : computedHeight
      background = { x, y: offset.top, width, height: offset.height }

      if (Math.abs(minPointSize) > 0 && Math.abs(height) < Math.abs(minPointSize)) {
        const delta = mathSign(height || minPointSize) * (Math.abs(minPointSize) - Math.abs(height))

        y -= delta
        height += delta
      }
    }
    else {
      const [baseValueScale, currentValueScale] = [xAxis.scale(value[0]), xAxis.scale(value[1])]
      x = baseValueScale
      y = getCateCoordinateOfBar({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index,
      })
      width = currentValueScale - baseValueScale
      height = pos.size!
      background = { x: offset.left, y, width: offset.width, height }

      if (Math.abs(minPointSize) > 0 && Math.abs(width) < Math.abs(minPointSize)) {
        const delta = mathSign(width || minPointSize) * (Math.abs(minPointSize) - Math.abs(width))
        width += delta
      }
    }

    const barRectangleItem: BarRectangleItem = {
      x,
      y,
      width,
      height,
      stackedBarStart: stackedBarStart ?? 0,
      value: stackedData ? [value[0], value[1]] : value[1],
      payload: entry,
      background,
      tooltipPosition: { x: (x ?? 0) + width / 2, y: (y ?? 0) + height / 2 },
      parentViewBox,
    } satisfies BarRectangleItem

    return barRectangleItem
  })
}
