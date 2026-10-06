import type { BaseAxisWithScale, ZAxisWithScale } from '@/types/axisSettings'
import { implicitZAxis } from '@/core/axis/settings'
import type { DataKey, ScatterPointItem, ScatterPointNode, TickItem } from '@/types/common'
import type { NameType, Payload, TooltipType, ValueType } from '@/types/tooltip'

type TooltipPayloadEntry = Payload<ValueType, NameType>
import { getCateCoordinateOfLine } from '@/core/coordinates'
import { getValueByDataKey } from '@/core/data'
import { isNullish, toFiniteNumber } from '@/utils/validate'

export type ResolvedScatterSettings = {
  data: readonly unknown[] | undefined
  dataKey: DataKey<unknown> | undefined
  tooltipType: TooltipType | undefined
  name: string | number
}

export function computeScatterPoints({
  displayedData,
  xAxis,
  yAxis,
  zAxis,
  scatterSettings,
  xAxisTicks,
  yAxisTicks,
}: {
  displayedData: ReadonlyArray<unknown>
  xAxis: BaseAxisWithScale
  yAxis: BaseAxisWithScale
  zAxis: ZAxisWithScale | undefined
  scatterSettings: ResolvedScatterSettings
  xAxisTicks: ReadonlyArray<TickItem> | undefined
  yAxisTicks: ReadonlyArray<TickItem> | undefined
}): ReadonlyArray<ScatterPointItem> {
  const xAxisDataKey = isNullish(xAxis.dataKey) ? scatterSettings.dataKey : xAxis.dataKey
  const yAxisDataKey = isNullish(yAxis.dataKey) ? scatterSettings.dataKey : yAxis.dataKey
  const zAxisDataKey = zAxis && zAxis.dataKey
  const defaultRangeZ = zAxis ? zAxis.range : implicitZAxis.range
  const defaultZ = defaultRangeZ && defaultRangeZ[0]
  const xBandSize = xAxis.scale.bandwidth ? xAxis.scale.bandwidth() : 0
  const yBandSize = yAxis.scale.bandwidth ? yAxis.scale.bandwidth() : 0

  return displayedData.map((rawEntry: unknown, index): ScatterPointItem => {
    const entry = rawEntry
    const x: unknown = getValueByDataKey(entry, xAxisDataKey)
    const y: unknown = getValueByDataKey(entry, yAxisDataKey)
    const z: unknown = (!isNullish(zAxisDataKey) && getValueByDataKey(entry, zAxisDataKey)) || '-'

    const tooltipPayload: Array<TooltipPayloadEntry> = [
      {
        name: isNullish(xAxis.dataKey) ? scatterSettings.name : xAxis.name || String(xAxis.dataKey),
        unit: xAxis.unit || '',
        value: x as ValueType,
        payload: entry,
        dataKey: xAxisDataKey,
        type: scatterSettings.tooltipType,
      },
      {
        name: isNullish(yAxis.dataKey) ? scatterSettings.name : yAxis.name || String(yAxis.dataKey),
        unit: yAxis.unit || '',
        value: y as ValueType,
        payload: entry,
        dataKey: yAxisDataKey,
        type: scatterSettings.tooltipType,
      },
    ]

    if (z !== '-' && zAxis != null) {
      tooltipPayload.push({
        name: zAxis.name || String(zAxis.dataKey),
        unit: zAxis.unit || '',
        value: z as ValueType,
        payload: entry,
        dataKey: zAxisDataKey,
        type: scatterSettings.tooltipType,
      })
    }

    const cx: number | null = getCateCoordinateOfLine({
      axis: xAxis,
      ticks: xAxisTicks as Array<TickItem>,
      bandSize: xBandSize,
      entry: entry as Record<string, unknown>,
      index,
      dataKey: xAxisDataKey,
    })
    const cy: number | null = getCateCoordinateOfLine({
      axis: yAxis,
      ticks: yAxisTicks as Array<TickItem>,
      bandSize: yBandSize,
      entry: entry as Record<string, unknown>,
      index,
      dataKey: yAxisDataKey,
    })
    const finiteZ = toFiniteNumber(z)
    const size = finiteZ != null && zAxis != null ? zAxis.scale(finiteZ) : defaultZ
    const radius = size == null ? 0 : Math.sqrt(Math.max(size, 0) / Math.PI)

    return {
      ...Object(entry),
      cx: cx ?? undefined,
      cy: cy ?? undefined,
      x: cx == null ? undefined : cx - radius,
      y: cy == null ? undefined : cy - radius,
      width: 2 * radius,
      height: 2 * radius,
      size,
      node: { x, y, z } as ScatterPointNode,
      tooltipPayload,
      tooltipPosition: cx == null || cy == null ? undefined : { x: cx, y: cy },
      payload: entry,
    }
  })
}
