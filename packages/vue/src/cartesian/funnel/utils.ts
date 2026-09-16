import type { ChartOffset, Coordinate, TooltipType } from '@/types'
import type { FunnelComposedData, FunnelProps, FunnelTrapezoidItem } from './type'
import { isNumber } from '@/utils'
import { getValueByDataKey } from '@/utils/chart'
import { omit } from 'es-toolkit/compat'

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
  dataKey: FunnelProps['dataKey']
  nameKey: FunnelProps['nameKey']
  offset: ChartOffset
  displayedData: any[]
  tooltipType?: TooltipType
  lastShapeType?: FunnelProps['lastShapeType']
  reversed?: boolean
  customWidth?: number | string
}): FunnelComposedData {
  const { left, top } = offset
  const { realHeight, realWidth, offsetX, offsetY } = getRealWidthHeight({ customWidth }, offset)
  const maxValue = Math.max.apply(
    null,
    displayedData.map((entry: any) => getValueByDataKey(entry, dataKey, 0)),
  )
  const len = displayedData.length
  const rowHeight = realHeight / len
  const parentViewBox = { x: offset.left, y: offset.top, width: offset.width, height: offset.height }

  let trapezoids: ReadonlyArray<FunnelTrapezoidItem> = displayedData.map(
    (entry: any, i: number): FunnelTrapezoidItem => {
      const rawVal = getValueByDataKey(entry, dataKey, 0)
      const name = getValueByDataKey(entry, nameKey!, i)
      let val = rawVal
      let nextVal

      if (i !== len - 1) {
        nextVal = getValueByDataKey(displayedData[i + 1], dataKey, 0)

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
        ...omit(entry, 'width'),
        payload: entry,
        parentViewBox,
        labelViewBox: {
          x: x + (upperWidth - lowerWidth) / 4,
          y,
          width: Math.abs(upperWidth - lowerWidth) / 2 + Math.min(upperWidth, lowerWidth),
          height: rowHeight,
        },
      } as any
    },
  )

  if (reversed) {
    trapezoids = trapezoids.map((entry: any, index: number) => {
      const newY = entry.y - index * rowHeight + (len - 1 - index) * rowHeight
      return {
        ...entry,
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
