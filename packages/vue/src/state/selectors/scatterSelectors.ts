import { createSelector } from '../createSelector'
import { toRaw } from 'vue'
import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'
import { selectChartDataWithIndexes } from './dataSelectors'
import type { ChartData, ChartDataState } from '../chartData'

import {
  type BaseAxisWithScale,
  type ZAxisWithScale,
  implicitZAxis,
  selectAxisWithScale,
  selectTicksOfGraphicalItem,
  selectUnfilteredCartesianItems,
  selectZAxisWithScale,
} from './axisSelectors'
import type { Coordinate, DataKey, ScatterPointItem, ScatterPointNode, TickItem, TooltipType } from '@/types'
import type { TooltipPayloadEntry } from '@/state/chartTooltip'
import { getCateCoordinateOfLine, getValueByDataKey } from '@/utils/chart'
import { isNullish, toFiniteNumber } from '@/utils/validate'

export type ResolvedScatterSettings = {
  data: ChartData | undefined
  dataKey: DataKey<any> | undefined
  tooltipType: TooltipType | undefined
  name: string | number
}

function selectXAxisWithScale(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId, _zAxisId: AxisId, _scatterSettings: ResolvedScatterSettings | undefined) {
  return selectAxisWithScale(state, 'xAxis', xAxisId)
}

function selectXAxisTicks(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId, _zAxisId: AxisId, _scatterSettings: ResolvedScatterSettings | undefined) {
  return selectTicksOfGraphicalItem(state, 'xAxis', xAxisId)
}

function selectYAxisWithScale(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId, _zAxisId: AxisId, _scatterSettings: ResolvedScatterSettings | undefined) {
  return selectAxisWithScale(state, 'yAxis', yAxisId)
}

function selectYAxisTicks(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId, _zAxisId: AxisId, _scatterSettings: ResolvedScatterSettings | undefined) {
  return selectTicksOfGraphicalItem(state, 'yAxis', yAxisId)
}

function selectZAxis(state: RechartsRootState, _xAxisId: AxisId, _yAxisId: AxisId, zAxisId: AxisId) {
  return selectZAxisWithScale(state, 'zAxis', zAxisId)
}

function pickScatterSettings(_state: RechartsRootState, _xAxisId: AxisId, _yAxisId: AxisId, _zAxisId: AxisId, scatterSettings: ResolvedScatterSettings) {
  return scatterSettings
}

function scatterChartDataSelector(state: RechartsRootState, _xAxisId: AxisId, _yAxisId: AxisId, _zAxisId: AxisId, _scatterSettings: ResolvedScatterSettings | undefined): ChartDataState {
  return selectChartDataWithIndexes(state)
}

const selectSynchronisedScatterSettings: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  _zAxisId: AxisId,
  scatterSettings: ResolvedScatterSettings,
) => ResolvedScatterSettings | undefined = createSelector(
  [selectUnfilteredCartesianItems, pickScatterSettings],
  (graphicalItems, scatterSettingsFromProps) => {
    if (
      graphicalItems.some(
        cgis =>
          cgis.type === 'scatter'
          && scatterSettingsFromProps.dataKey === cgis.dataKey
          && scatterSettingsFromProps.data === cgis.data,
      )
    ) {
      return scatterSettingsFromProps
    }
    return undefined
  },
)

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
    const entry = toRaw(rawEntry)
    const x: unknown = getValueByDataKey(entry, xAxisDataKey)
    const y: unknown = getValueByDataKey(entry, yAxisDataKey)
    const z: unknown = (!isNullish(zAxisDataKey) && getValueByDataKey(entry, zAxisDataKey)) || '-'

    const tooltipPayload: Array<TooltipPayloadEntry> = [
      {
        name: isNullish(xAxis.dataKey) ? scatterSettings.name : xAxis.name || String(xAxis.dataKey),
        unit: xAxis.unit || '',
        value: x as any,
        payload: entry,
        dataKey: xAxisDataKey,
        type: scatterSettings.tooltipType,
      },
      {
        name: isNullish(yAxis.dataKey) ? scatterSettings.name : yAxis.name || String(yAxis.dataKey),
        unit: yAxis.unit || '',
        value: y as any,
        payload: entry,
        dataKey: yAxisDataKey,
        type: scatterSettings.tooltipType,
      },
    ]

    if (z !== '-' && zAxis != null) {
      tooltipPayload.push({
        name: zAxis.name || String(zAxis.dataKey),
        unit: zAxis.unit || '',
        value: z as any,
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
    const size = finiteZ != null && zAxis != null ? (zAxis.scale as any)(finiteZ) : defaultZ
    const radius = size == null ? 0 : Math.sqrt(Math.max(size, 0) / Math.PI)

    return {
      ...(entry as any),
      cx: cx ?? undefined,
      cy: cy ?? undefined,
      x: cx == null ? undefined : cx - radius,
      y: cy == null ? undefined : cy - radius,
      width: 2 * radius,
      height: 2 * radius,
      size,
      node: { x, y, z } as ScatterPointNode,
      tooltipPayload,
      tooltipPosition: { x: cx!, y: cy! } as Coordinate,
      payload: entry,
    }
  })
}

export const selectScatterPoints: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  zAxisId: AxisId,
  scatterSettings: ResolvedScatterSettings,
) => ReadonlyArray<ScatterPointItem> | undefined = createSelector(
  [
    scatterChartDataSelector,
    selectXAxisWithScale,
    selectXAxisTicks,
    selectYAxisWithScale,
    selectYAxisTicks,
    selectZAxis,
    selectSynchronisedScatterSettings,
  ],
  (
    { chartData, dataStartIndex, dataEndIndex }: ChartDataState,
    xAxis,
    xAxisTicks,
    yAxis,
    yAxisTicks,
    zAxis: ZAxisWithScale | undefined,
    scatterSettings: ResolvedScatterSettings | undefined,
  ): ReadonlyArray<ScatterPointItem> | undefined => {
    if (scatterSettings == null) {
      return undefined
    }
    let displayedData: ChartData | undefined
    if (scatterSettings?.data?.length! > 0) {
      displayedData = scatterSettings.data
    }
    else {
      displayedData = chartData?.slice(dataStartIndex, dataEndIndex + 1)
    }
    if (
      displayedData == null
      || xAxis == null
      || yAxis == null
      || xAxisTicks == null || xAxisTicks.length === 0
      || yAxisTicks == null || yAxisTicks.length === 0
    ) {
      return undefined
    }
    return computeScatterPoints({
      displayedData,
      xAxis,
      yAxis,
      zAxis,
      scatterSettings,
      xAxisTicks,
      yAxisTicks,
    })
  },
)
