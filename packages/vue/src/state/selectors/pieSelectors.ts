import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import { selectChartDataAndAlwaysIgnoreIndexes } from './dataSelectors'
import type { ChartData, ChartDataState } from '../chartData'
import { selectChartOffset } from './selectChartOffset'
import { selectUnfilteredPolarItems } from './polarSelectors'
import type { ChartOffset, Coordinate, DataKey, TooltipType } from '@/types'
import type { LegendType } from '@/types/legend'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import { getPercentValue, mathSign } from '@/utils/data'
import { getMaxRadius, polarToCartesian } from '@/utils/polar'
import { getValueByDataKey } from '@/utils/chart'
import { isNumber } from '@/utils/validate'

export type ResolvedPieSettings = {
  name?: string | number | undefined
  nameKey: DataKey<any>
  data?: ChartData | undefined
  dataKey: DataKey<any> | undefined
  tooltipType?: TooltipType | undefined

  legendType?: LegendType
  fill: string

  cx?: number | string
  cy?: number | string
  startAngle?: number
  endAngle?: number
  paddingAngle?: number
  minAngle?: number
  innerRadius?: number | string
  outerRadius?: number | string | ((element: any) => number)
  cornerRadius?: number | string
  presentationProps?: Record<string, string>
}

export type PieCoordinate = {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  maxRadius: number
}

export type PieSectorDataItem = ResolvedPieSettings &
  PieCoordinate & {
    cornerRadius: number | undefined
    percent: number
    value: number
    name: string | number
    startAngle: number
    endAngle: number
    midAngle: number
    middleRadius: number
    paddingAngle: number
    payload: any
    fill: string
    tooltipPosition: Coordinate
    dataKey: DataKey<any>
  }

const pickPieSettings = (_state: RechartsRootState, pieSettings: ResolvedPieSettings) => pieSettings

const EMPTY_CELLS: ReadonlyArray<any> = []

// Keep stable reference to an empty array to prevent re-renders
function pickCells(_state: RechartsRootState, _pieSettings: ResolvedPieSettings): ReadonlyArray<any> | undefined {
  return EMPTY_CELLS
}

export const selectDisplayedData: (
  state: RechartsRootState,
  pieSettings: ResolvedPieSettings,
) => ChartData | undefined = createSelector(
  [selectChartDataAndAlwaysIgnoreIndexes, pickPieSettings, pickCells],
  ({ chartData }: ChartDataState, pieSettings: ResolvedPieSettings, cells): ChartData | undefined => {
    let displayedData: ChartData | undefined
    if (pieSettings.data != null && pieSettings.data.length > 0) {
      displayedData = pieSettings.data
    }
    else {
      displayedData = chartData
    }

    if (!displayedData || !displayedData.length) {
      // cells-based fallback not yet implemented
    }

    if (displayedData == null) {
      return undefined
    }

    return displayedData
  },
)

export const selectPieLegend: (
  state: RechartsRootState,
  pieSettings: ResolvedPieSettings,
) => ReadonlyArray<LegendPayload> | undefined = createSelector(
  [selectDisplayedData, pickPieSettings],
  (
    displayedData,
    pieSettings: ResolvedPieSettings,
  ): ReadonlyArray<LegendPayload> | undefined => {
    if (displayedData == null) {
      return undefined
    }
    return displayedData.map((entry, i): LegendPayload => {
      const name = getValueByDataKey(entry, pieSettings.nameKey, pieSettings.name)
      let color: string
      if (typeof entry === 'object' && entry != null && 'fill' in entry && typeof entry.fill === 'string') {
        color = entry.fill
      }
      else {
        color = pieSettings.fill
      }
      return {
        value: name ?? String(pieSettings.dataKey ?? i),
        color,
        payload: entry as Record<string, unknown>,
        type: pieSettings.legendType,
      }
    })
  },
)

export const selectSynchronisedPieSettings: (
  state: RechartsRootState,
  pieSettings: ResolvedPieSettings,
) => ResolvedPieSettings | undefined = createSelector(
  [selectUnfilteredPolarItems, pickPieSettings],
  (graphicalItems, pieSettingsFromProps) => {
    if (
      graphicalItems.some(
        pgis =>
          pgis.type === 'pie'
          && pieSettingsFromProps.dataKey === pgis.dataKey,
      )
    ) {
      return pieSettingsFromProps
    }
    return undefined
  },
)

function parseDeltaAngle(startAngle: number, endAngle: number) {
  const sign = mathSign(endAngle - startAngle)
  const deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360)
  return sign * deltaAngle
}

function getOuterRadius(dataPoint: any, outerRadius: number | string | ((element: any) => number) | undefined, maxPieRadius: number): number {
  if (typeof outerRadius === 'function') {
    return getPercentValue(outerRadius(dataPoint), maxPieRadius, maxPieRadius * 0.8)
  }
  return getPercentValue(outerRadius ?? maxPieRadius * 0.8, maxPieRadius, maxPieRadius * 0.8)
}

function parseCoordinateOfPie(pieSettings: ResolvedPieSettings, offset: ChartOffset, dataPoint: any): PieCoordinate {
  const { top, left, width, height } = offset
  const maxPieRadius = getMaxRadius(width, height)
  const cx = left + getPercentValue(pieSettings.cx ?? width / 2, width, width / 2)
  const cy = top + getPercentValue(pieSettings.cy ?? height / 2, height, height / 2)
  const innerRadius = getPercentValue(pieSettings.innerRadius ?? 0, maxPieRadius, 0)
  const outerRadius = getOuterRadius(dataPoint, pieSettings.outerRadius, maxPieRadius)
  const maxRadius = Math.sqrt(width * width + height * height) / 2

  return { cx, cy, innerRadius, outerRadius, maxRadius }
}

export function computePieSectors({
  pieSettings,
  displayedData,
  offset,
}: {
  pieSettings: ResolvedPieSettings
  displayedData: ChartData
  offset: ChartOffset
}): ReadonlyArray<PieSectorDataItem> | undefined {
  if (!displayedData || displayedData.length === 0) {
    return undefined
  }

  const {
    cornerRadius,
    dataKey,
    nameKey,
    tooltipType,
  } = pieSettings

  const startAngle = pieSettings.startAngle ?? 0
  const endAngle = pieSettings.endAngle ?? 360
  const minAngle = Math.abs(pieSettings.minAngle ?? 0)
  const deltaAngle = parseDeltaAngle(startAngle, endAngle)
  const absDeltaAngle = Math.abs(deltaAngle)
  const paddingAngle = displayedData.length <= 1 ? 0 : (pieSettings.paddingAngle ?? 0)

  const notZeroItemCount = displayedData.filter(entry => getValueByDataKey(entry, dataKey, 0) !== 0).length
  const totalPaddingAngle = (absDeltaAngle >= 360 ? notZeroItemCount : notZeroItemCount - 1) * paddingAngle
  const realTotalAngle = absDeltaAngle - notZeroItemCount * minAngle - totalPaddingAngle

  const sum: number = displayedData.reduce<number>((result, entry: any) => {
    const val = getValueByDataKey(entry, dataKey, 0)
    return result + (isNumber(val) ? (val as number) : 0)
  }, 0)

  if (sum <= 0) {
    return undefined
  }

  let prev: PieSectorDataItem
  const sectors = displayedData.map((entry: unknown, i: number) => {
    const val = getValueByDataKey(entry, dataKey, 0) as number
    const name = getValueByDataKey(entry, nameKey, i) as string | number
    const coordinate: PieCoordinate = parseCoordinateOfPie(pieSettings, offset, entry)
    const percent = (isNumber(val) ? val : 0) / sum

    const entryWithInfo: Record<string, any> = { ...(entry as object) }
    const sectorColor: string
      = (entryWithInfo != null && 'fill' in entryWithInfo && typeof entryWithInfo.fill === 'string')
        ? entryWithInfo.fill
        : pieSettings.fill

    let tempStartAngle: number
    if (i) {
      tempStartAngle = prev.endAngle + mathSign(deltaAngle) * paddingAngle * (val !== 0 ? 1 : 0)
    }
    else {
      tempStartAngle = startAngle
    }

    const tempEndAngle
      = tempStartAngle + mathSign(deltaAngle) * ((val !== 0 ? minAngle : 0) + percent * realTotalAngle)
    const midAngle = (tempStartAngle + tempEndAngle) / 2
    const middleRadius = (coordinate.innerRadius + coordinate.outerRadius) / 2
    const tooltipPosition = polarToCartesian(coordinate.cx, coordinate.cy, middleRadius, midAngle)

    prev = {
      ...pieSettings.presentationProps,
      percent,
      cornerRadius: typeof cornerRadius === 'string' ? parseFloat(cornerRadius) : cornerRadius,
      name,
      midAngle,
      middleRadius,
      tooltipPosition,
      ...entryWithInfo,
      ...coordinate,
      value: val,
      dataKey: dataKey!,
      startAngle: tempStartAngle,
      endAngle: tempEndAngle,
      payload: entryWithInfo,
      paddingAngle: mathSign(deltaAngle) * paddingAngle,
      fill: sectorColor,
      nameKey,
      tooltipType,
    }
    return prev
  })

  return sectors
}

export const selectPieSectors: (
  state: RechartsRootState,
  pieSettings: ResolvedPieSettings,
  // @ts-ignore
) => Readonly<PieSectorDataItem[]> | undefined = createSelector(
  [selectDisplayedData, selectSynchronisedPieSettings, pickCells, selectChartOffset],
  (
    displayedData: ChartData | undefined,
    pieSettings: ResolvedPieSettings | undefined,
    _cells: ReadonlyArray<any> | undefined,
    offset: ChartOffset,
  ): Readonly<PieSectorDataItem[]> | undefined => {
    if (pieSettings == null || displayedData == null) {
      return undefined
    }
    return computePieSectors({
      offset,
      pieSettings,
      displayedData,
    }) as Readonly<PieSectorDataItem[]> | undefined
  },
)
