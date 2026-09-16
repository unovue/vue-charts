import type { TooltipPayloadConfiguration } from '@/state/tooltipSlice'
import type { BarProps, BarSettings, Rectangle } from './type'
import type { BarPositionPosition, BarRectangleItem } from '@/types/bar'
import type { BaseAxisWithScale } from '@/state/selectors/axisSelectors'
import type { DataKey, TickItem } from '@/types'
import type { Series } from 'd3-shape'
import type { ChartOffsetInternal } from '@/utils/types'
import { getBaseValueOfBar, getCateCoordinateOfBar, getTooltipNameProp, getValueByDataKey, truncateByDomain } from '@/utils/chart'
import { isNullish, isNumber } from '@/utils'
import { toRaw } from 'vue'
import type { MinPointSize } from '@/shape'
import { invariant } from 'es-toolkit'
import { isNaN } from 'es-toolkit/compat'
import { mathSign } from '@/utils/data'
import type { LegendPayload } from '@/components/DefaultLegendContent'

export function computeLegendPayloadFromBarData(props: BarProps): ReadonlyArray<LegendPayload> {
  const { dataKey, name, fill, legendType, hide } = props
  return [
    {
      inactive: hide,
      dataKey,
      type: legendType,
      color: fill,
      value: getTooltipNameProp(name, dataKey),
      payload: props as any,
    },
  ]
}

export function getTooltipEntrySettings(props: BarProps): TooltipPayloadConfiguration {
  const { dataKey, stroke, strokeWidth, fill, name, hide, unit } = props
  return {
    dataDefinedOnItem: undefined,
    positions: undefined,
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      nameKey: undefined,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: props.tooltipType,
      color: props.fill,
      unit: unit as string,
    },
  }
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
  xAxis?: BaseAxisWithScale
  yAxis?: BaseAxisWithScale
  xAxisTicks: TickItem[]
  yAxisTicks: TickItem[]
  stackedData: Series<Record<number, number>, DataKey<any>> | undefined
  offset: ChartOffsetInternal
  displayedData: any[]
}): ReadonlyArray<BarRectangleItem> | undefined {
  const parentViewBox = { x: offset.left, y: offset.top, width: offset.width, height: offset.height }
  const numericAxis = layout === 'horizontal' ? yAxis : xAxis
  // @ts-expect-error this assumes that the domain is always numeric, but doesn't check for it
  const stackedDomain: ReadonlyArray<number> = stackedData ? numericAxis.scale.domain() : null
  const baseValue = getBaseValueOfBar({ numericAxis })
  const stackedBarStart: number | undefined = numericAxis.scale(baseValue)

  return displayedData.map((rawEntry, index): BarRectangleItem => {
    const entry = toRaw(rawEntry)
    let value, x, y, width, height, background: Rectangle

    if (stackedData) {
      // we don't need to use dataStartIndex here, because stackedData is already sliced from the selector
      value = truncateByDomain(stackedData[index], stackedDomain)
    }
    else {
      value = getValueByDataKey(entry, dataKey)

      if (!Array.isArray(value)) {
        value = [baseValue, value]
      }
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
      y = currentValueScale ?? baseValueScale ?? undefined
      width = pos.size
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
      height = pos.size
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
      value: stackedData ? value : value[1],
      payload: entry,
      background,
      tooltipPosition: { x: x + width / 2, y: y + height / 2 },
      parentViewBox,
    } satisfies BarRectangleItem

    return barRectangleItem
  })
}
