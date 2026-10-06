import type { ChartOffset, Coordinate, TooltipType } from '@/types'
import type { FunnelComposedData, FunnelTrapezoidItem } from '@/types/funnel'
import type { DataKey } from '@/types/common'
import { isNumber, toFiniteNumber } from '@/utils/validate'
import { getValueByDataKey } from '@/core/data'

export type ResolvedFunnelSettings = {
  dataKey: DataKey<unknown>
  data: unknown[] | undefined
  nameKey: DataKey<unknown>
  tooltipType?: TooltipType
  lastShapeType?: 'triangle' | 'rectangle'
  reversed?: boolean
  customWidth?: string | number
  presentationProps: Record<string, unknown> | null
}

function getRealWidthHeight({ customWidth }: { customWidth?: number | string }, offset: ChartOffset) {
  const { width, height, left, right, top, bottom } = offset
  const realHeight = height
  let realWidth = width

  if (isNumber(customWidth)) {
    realWidth = customWidth
  }
  else if (typeof customWidth === 'string') {
    realWidth = (realWidth! * parseFloat(customWidth)) / 100
  }

  return {
    realWidth: realWidth! - left! - right!,
    realHeight: realHeight! - bottom! - top!,
    offsetX: (width! - realWidth!) / 2,
    offsetY: (height! - realHeight!) / 2,
  }
}

export function computeFunnelTrapezoids({
  dataKey,
  nameKey,
  displayedData,
  tooltipType,
  lastShapeType,
  reversed,
  offset,
  customWidth,
}: {
  dataKey: DataKey<unknown>
  nameKey: DataKey<unknown> | undefined
  offset: ChartOffset
  displayedData: unknown[]
  tooltipType?: TooltipType
  lastShapeType?: 'triangle' | 'rectangle'
  reversed?: boolean
  customWidth?: number | string
}): FunnelComposedData {
  const { left, top } = offset
  const { realHeight, realWidth, offsetX, offsetY } = getRealWidthHeight({ customWidth }, offset)
  const values = displayedData.map((entry) => {
    const value = getValueByDataKey(entry, dataKey)
    return Array.isArray(value) ? value.map(part => toFiniteNumber(part) ?? 0) : toFiniteNumber(value) ?? 0
  })
  const maxValue = values.flat().reduce((max, value) => Math.max(max, value), 0) || 1
  const len = displayedData.length
  const rowHeight = realHeight / len
  const parentViewBox = { x: offset.left, y: offset.top, width: offset.width, height: offset.height }

  let trapezoids: ReadonlyArray<FunnelTrapezoidItem> = displayedData.map(
    (entry, i: number): FunnelTrapezoidItem => {
      const rawVal = values[i]
      const name = getValueByDataKey(entry, nameKey!, i)
      let val = Array.isArray(rawVal) ? rawVal[0] : rawVal
      let nextVal

      if (i !== len - 1) {
        nextVal = values[i + 1]

        if (Array.isArray(nextVal)) {
          [nextVal] = nextVal
        }
      }
      else if (Array.isArray(rawVal) && rawVal.length === 2) {
        [val, nextVal] = rawVal
      }
      else if (lastShapeType === 'rectangle') {
        nextVal = val
      }
      else {
        nextVal = 0
      }

      const x = ((maxValue - val) * realWidth) / (2 * maxValue) + left! + offsetX
      const y = rowHeight * i + top! + offsetY
      const upperWidth = (val / maxValue) * realWidth
      const lowerWidth = (nextVal / maxValue) * realWidth

      const tooltipPayload = [{ name, value: val, payload: entry, dataKey, type: tooltipType }]
      const tooltipPosition: Coordinate = {
        x: x + upperWidth / 2,
        y: y + rowHeight / 2,
      }

      return {
        ...Object(entry),
        x,
        y,
        width: Math.max(upperWidth, lowerWidth),
        upperWidth,
        lowerWidth,
        height: rowHeight,
        name,
        val,
        tooltipPayload,
        tooltipPosition,
        payload: entry,
        parentViewBox,
        labelViewBox: {
          x: x + (upperWidth - lowerWidth) / 4,
          y,
          width: Math.abs(upperWidth - lowerWidth) / 2 + Math.min(upperWidth, lowerWidth),
          height: rowHeight,
        },
      }
    },
  )

  if (reversed) {
    trapezoids = trapezoids.map((entry, index: number) => {
      const newY = entry.y - index * rowHeight + (len - 1 - index) * rowHeight
      return {
        ...Object(entry),
        upperWidth: entry.lowerWidth,
        lowerWidth: entry.upperWidth,
        x: entry.x - (entry.lowerWidth - entry.upperWidth) / 2,
        y: entry.y - index * rowHeight + (len - 1 - index) * rowHeight,
        tooltipPosition: { ...entry.tooltipPosition, y: newY + rowHeight / 2 },
        labelViewBox: {
          ...entry.labelViewBox,
          y: newY,
        },
      }
    })
  }

  return {
    trapezoids,
    data: displayedData,
  }
}

export function combineFunnelTrapezoids(
  offset: ChartOffset,
  settings: ResolvedFunnelSettings,
  chartData: unknown[] | undefined,
) {
  const { data, presentationProps, ...geometry } = settings
  const displayedData = data?.length ? data : chartData
  if (!displayedData?.length)
    return { trapezoids: [], data: displayedData }
  return computeFunnelTrapezoids({
    ...geometry,
    displayedData: displayedData.map(entry => ({ payload: entry, ...presentationProps, ...Object(entry) })),
    offset,
  })
}
