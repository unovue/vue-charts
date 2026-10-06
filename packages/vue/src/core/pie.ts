import { seriesColor } from '@/utils/theme'
import type { ChartDataKey } from '@/types/base'
import type { ChartOffset, Coordinate } from '@/types/common'
import type { TooltipType } from '@/types/tooltip'
import type { ChartData } from '@/types/chartData'
import type { LegendPayload, LegendType } from '@/types/legend'
import { getPercentValue, mathSign } from '@/utils/data'
import { getMaxRadius, polarToCartesian } from '@/utils/polar'
import { getValueByDataKey } from '@/core/data'
import { toFiniteNumber } from '@/utils/validate'

export type ResolvedPieSettings = {
  name?: string | number | undefined
  nameKey: ChartDataKey
  data?: ChartData | undefined
  dataKey: ChartDataKey | undefined
  tooltipType?: TooltipType | undefined

  legendType?: LegendType
  fill: string | undefined

  cx?: number | string
  cy?: number | string
  startAngle?: number
  endAngle?: number
  paddingAngle?: number
  minAngle?: number
  innerRadius?: number | string
  outerRadius?: number | string | ((element: unknown) => number)
  cornerRadius?: number | string
  presentationProps?: Record<string, string>
}

type PieCoordinate = {
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
    payload: unknown
    fill: string
    tooltipPosition: Coordinate
    dataKey: ChartDataKey
  }

function parseDeltaAngle(startAngle: number, endAngle: number) {
  const sign = mathSign(endAngle - startAngle)
  const deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360)
  return sign * deltaAngle
}

function getOuterRadius(dataPoint: unknown, outerRadius: number | string | ((element: unknown) => number) | undefined, maxPieRadius: number): number {
  if (typeof outerRadius === 'function') {
    return getPercentValue(outerRadius(dataPoint), maxPieRadius, maxPieRadius * 0.8)
  }
  return getPercentValue(outerRadius ?? maxPieRadius * 0.8, maxPieRadius, maxPieRadius * 0.8)
}

function parseCoordinateOfPie(pieSettings: ResolvedPieSettings, offset: ChartOffset, dataPoint: unknown): PieCoordinate {
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

  if (dataKey == null)
    return undefined

  const startAngle = pieSettings.startAngle ?? 0
  const endAngle = pieSettings.endAngle ?? 360
  const minAngle = Math.abs(pieSettings.minAngle ?? 0)
  const deltaAngle = parseDeltaAngle(startAngle, endAngle)
  const absDeltaAngle = Math.abs(deltaAngle)
  const paddingAngle = displayedData.length <= 1 ? 0 : (pieSettings.paddingAngle ?? 0)

  const values = displayedData.map((entry) => {
    const value = getValueByDataKey(entry, dataKey)
    return toFiniteNumber(value) ?? 0
  })
  const notZeroItemCount = values.filter(value => value !== 0).length
  const totalPaddingAngle = (absDeltaAngle >= 360 ? notZeroItemCount : notZeroItemCount - 1) * paddingAngle
  const realTotalAngle = absDeltaAngle - notZeroItemCount * minAngle - totalPaddingAngle
  const sum = values.reduce((result, value) => result + value, 0)

  if (sum <= 0) {
    return undefined
  }

  let prev: PieSectorDataItem
  const sectors = displayedData.map((entry: unknown, i: number) => {
    const val = values[i]
    const name = getValueByDataKey(entry, nameKey, i) as string | number
    const coordinate: PieCoordinate = parseCoordinateOfPie(pieSettings, offset, entry)
    const percent = val / sum

    const entryWithInfo: Record<string, unknown> = { ...(entry as object) }
    const sectorColor: string
      = (entryWithInfo != null && 'fill' in entryWithInfo && typeof entryWithInfo.fill === 'string')
        ? entryWithInfo.fill
        : pieSettings.fill ?? seriesColor(i)

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
      dataKey,
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

export function pieLegend(
  displayedData: ChartData | undefined,
  settings: ResolvedPieSettings,
): readonly LegendPayload[] | undefined {
  return displayedData?.map((entry, index) => {
    const name = getValueByDataKey(entry, settings.nameKey, settings.name)
    const color = typeof entry === 'object' && entry != null
      && 'fill' in entry && typeof entry.fill === 'string'
      ? entry.fill
      : settings.fill ?? seriesColor(index)
    return {
      value: (name ?? String(settings.dataKey ?? index)) as string,
      color,
      payload: entry as Record<string, unknown>,
      type: settings.legendType,
    }
  })
}
