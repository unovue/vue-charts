import type { Series } from 'd3-shape'
import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { DataKey, LayoutType, TickItem } from '@/types/common'
import type { BarPositionPosition } from '@/types/bar'
import type { StackId } from '@/types/tick'
import type { MaybeStackedGraphicalItem } from '@/types/graphical'
import type { RadialBarDataItem } from '@/types/radialBar'
import type { LegendPayload, LegendType } from '@/types/legend'
import { getCateCoordinateOfBar, truncateByDomain } from '@/core/coordinates'
import { getValueByDataKey } from '@/core/data'
import { mathSign } from '@/utils/data'
import { toFiniteNumber } from '@/utils/validate'

export interface RadialBarSettings extends MaybeStackedGraphicalItem {
  dataKey: DataKey<any> | undefined
  minPointSize: number
  stackId: StackId | undefined
  maxBarSize: number | undefined
}

export function computeRadialBarDataItems({
  displayedData,
  stackedData,
  dataStartIndex,
  stackedDomain,
  dataKey,
  baseValue,
  layout,
  radiusAxis,
  radiusAxisTicks,
  bandSize,
  pos,
  angleAxis,
  minPointSize,
  cx,
  cy,
  angleAxisTicks,
  startAngle: rootStartAngle,
  endAngle: rootEndAngle,
}: {
  displayedData: ReadonlyArray<unknown>
  stackedData: Series<unknown, DataKey<unknown>> | undefined
  dataStartIndex: number
  stackedDomain: ReadonlyArray<unknown> | null
  dataKey: DataKey<any> | undefined
  baseValue: number | unknown
  layout: LayoutType
  radiusAxis: BaseAxisWithScale
  radiusAxisTicks: ReadonlyArray<TickItem>
  bandSize: number
  pos: BarPositionPosition
  angleAxis: BaseAxisWithScale
  minPointSize: number
  cx: number
  cy: number
  angleAxisTicks: ReadonlyArray<TickItem>
  startAngle: number
  endAngle: number
}): ReadonlyArray<RadialBarDataItem> {
  return (displayedData ?? []).flatMap((entry: unknown, index: number) => {
    let value: unknown[],
      innerRadius: number | null | undefined,
      outerRadius: number | undefined,
      startAngle: number | null,
      endAngle: number | undefined,
      backgroundSector: { background: NonNullable<RadialBarDataItem['background']> } | undefined

    if (stackedData) {
      // @ts-expect-error truncateByDomain expects only numerical domain, but it can receive categorical domain too
      value = truncateByDomain(stackedData[dataStartIndex + index], stackedDomain)
    }
    else {
      const rawValue = getValueByDataKey(entry, dataKey)
      value = Array.isArray(rawValue) ? rawValue : [baseValue, rawValue]
    }

    const valueAxis = layout === 'radial' ? angleAxis : radiusAxis
    const invalidValue = value.some((part: unknown) => valueAxis.type === 'number'
      ? toFiniteNumber(part) == null
      : typeof part === 'number' && !Number.isFinite(part))
    if (invalidValue) {
      return []
    }

    if (layout === 'radial') {
      startAngle = angleAxis.scale(value[0]) ?? rootStartAngle
      endAngle = angleAxis.scale(value[1]) ?? rootEndAngle
      innerRadius = getCateCoordinateOfBar({
        axis: radiusAxis,
        ticks: radiusAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index,
      })
      // Recharts v2 PolarRadiusAxis defaults type='number' with a forced scaleBand,
      // so getCateCoordinateOfBar takes the number path: scale(value) - bandSize/2 + offset.
      // Our type='category' path returns ticks[index].coordinate + offset (no centering).
      // Apply -bandSize/2 to match v2's centering behavior.
      if (innerRadius != null) {
        innerRadius = innerRadius - bandSize / 2
      }
      if (innerRadius != null && endAngle != null && startAngle != null) {
        outerRadius = innerRadius + pos.size!
        const deltaAngle = endAngle - startAngle

        if (Math.abs(minPointSize) > 0 && Math.abs(deltaAngle) < Math.abs(minPointSize)) {
          const delta = mathSign(deltaAngle || minPointSize) * (Math.abs(minPointSize) - Math.abs(deltaAngle))
          endAngle += delta
        }
        backgroundSector = {
          background: {
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle: rootStartAngle,
            endAngle: rootEndAngle,
          },
        }
      }
    }
    else {
      innerRadius = radiusAxis.scale(value[0])
      outerRadius = radiusAxis.scale(value[1])
      startAngle = getCateCoordinateOfBar({
        axis: angleAxis,
        ticks: angleAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index,
      })
      if (innerRadius != null && outerRadius != null && startAngle != null) {
        endAngle = startAngle + pos.size!
        const deltaRadius = outerRadius - innerRadius

        if (Math.abs(minPointSize) > 0 && Math.abs(deltaRadius) < Math.abs(minPointSize)) {
          const delta = mathSign(deltaRadius || minPointSize) * (Math.abs(minPointSize) - Math.abs(deltaRadius))
          outerRadius += delta
        }
      }
    }

    return {
      ...Object(entry),
      ...backgroundSector,
      payload: entry,
      value: stackedData ? value : value[1],
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
    } as RadialBarDataItem
  })
}

export function combineRadialBarLegend(
  data: readonly unknown[] | undefined,
  legendType: LegendType,
): readonly LegendPayload[] {
  return (data ?? []).map((row) => {
    const entry = (typeof row === 'object' && row != null) || typeof row === 'function' ? row : {}
    return {
      type: legendType,
      value: ('name' in entry ? entry.name : undefined) as string | undefined,
      color: ('fill' in entry ? entry.fill : undefined) as string | undefined,
      payload: row as Record<string, unknown>,
    }
  })
}
