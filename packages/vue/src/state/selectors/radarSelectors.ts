import { createSelector } from '../createSelector'
import { last } from 'es-toolkit/compat'
import type { RechartsRootState } from '../chartState'
import type { BaseAxisWithScale } from './axisSelectors'
import { selectPolarAxisScale, selectPolarAxisTicks } from './polarScaleSelectors'
import { selectAngleAxis, selectPolarViewBox, selectRadiusAxis } from './polarAxisSelectors'
import type { AxisId } from '../chartCartesianAxis'
import { selectChartDataAndAlwaysIgnoreIndexes } from './dataSelectors'
import type { ChartDataState } from '../chartData'
import type { AngleAxisSettings, RadiusAxisSettings } from '../chartPolarAxis'
import { selectUnfilteredPolarItems } from './polarSelectors'
import type { RechartsScale } from '@/types/scale'
import type { AngleAxisForRadar, RadarComposedData, RadiusAxisForRadar } from '@/types/radar'
import type { DataKey, LayoutType, TickItem } from '@/types'
import type { PolarViewBoxRequired } from '@/cartesian/type'
import { isCategoricalAxis } from '@/utils'
import { getBandSizeOfAxis, getValueByDataKey } from '@/utils/chart'
import { selectChartLayout } from '@/state/selectors/common'
import { polarToCartesian } from '@/utils/polar'
import { toFiniteNumber } from '@/utils/validate'

function selectRadiusAxisScale(state: RechartsRootState, radiusAxisId: AxisId): RechartsScale | undefined {
  return selectPolarAxisScale(state, 'radiusAxis', radiusAxisId)
}

const selectRadiusAxisForRadar: (state: RechartsRootState, radiusAxisId: AxisId) => RadiusAxisForRadar | undefined = createSelector(
  [selectRadiusAxisScale],
  (scale: RechartsScale | undefined): RadiusAxisForRadar | undefined => {
    if (scale == null) {
      return undefined
    }
    return { scale }
  },
)

export const selectRadiusAxisForBandSize: (
  state: RechartsRootState,
  radiusAxisId: AxisId,
) => BaseAxisWithScale | undefined = createSelector(
  [selectRadiusAxis, selectRadiusAxisScale],
  (axisSettings: RadiusAxisSettings | undefined, scale: RechartsScale | undefined): BaseAxisWithScale | undefined => {
    if (axisSettings == null || scale == null) {
      return undefined
    }
    return {
      ...axisSettings,
      scale,
    }
  },
)

function selectRadiusAxisTicks(state: RechartsRootState, radiusAxisId: AxisId, _angleAxisId: AxisId, isPanorama: boolean): ReadonlyArray<TickItem> | undefined {
  return selectPolarAxisTicks(state, 'radiusAxis', radiusAxisId, isPanorama)
}

function selectAngleAxisForRadar(state: RechartsRootState, _radiusAxisId: AxisId, angleAxisId: AxisId): AngleAxisSettings | undefined {
  return selectAngleAxis(state, angleAxisId)
}

function selectPolarAxisScaleForRadar(state: RechartsRootState, _radiusAxisId: AxisId, angleAxisId: AxisId): RechartsScale | undefined {
  return selectPolarAxisScale(state, 'angleAxis', angleAxisId)
}

export const selectAngleAxisForBandSize = createSelector(
  [selectAngleAxisForRadar, selectPolarAxisScaleForRadar],
  (axisSettings: AngleAxisSettings | undefined, scale: RechartsScale | undefined): BaseAxisWithScale | undefined => {
    if (axisSettings == null || scale == null) {
      return undefined
    }
    return {
      ...axisSettings,
      scale,
    }
  },
)

function selectAngleAxisTicks(state: RechartsRootState, _radiusAxisId: AxisId, angleAxisId: AxisId, isPanorama: boolean): ReadonlyArray<TickItem> | undefined {
  return selectPolarAxisTicks(state, 'angleAxis', angleAxisId, isPanorama)
}

export const selectAngleAxisWithScaleAndViewport: (
  state: RechartsRootState,
  _radiusAxisId: AxisId,
  angleAxisId: AxisId,
) => AngleAxisForRadar | undefined = createSelector(
  [selectAngleAxisForRadar, selectPolarAxisScaleForRadar, selectPolarViewBox],
  (axisOptions: AngleAxisSettings | undefined, scale: RechartsScale | undefined, polarViewBox: PolarViewBoxRequired | undefined) => {
    if (polarViewBox == null || axisOptions == null || scale == null) {
      return undefined
    }
    return {
      scale,
      type: axisOptions.type,
      dataKey: axisOptions.dataKey,
      cx: polarViewBox.cx,
      cy: polarViewBox.cy,
    }
  },
)

function pickDataKey(_state: RechartsRootState, _radiusAxisId: AxisId, _angleAxisId: AxisId, _isPanorama: boolean, radarDataKey: DataKey<any> | undefined): DataKey<any> | undefined {
  return radarDataKey
}

const selectBandSizeOfAxis: (
  state: RechartsRootState,
  radiusAxisId: AxisId,
  angleAxisId: AxisId,
  isPanorama: boolean,
  radarDataKey: DataKey<any> | undefined,
) => number | undefined = createSelector(
  [
    selectChartLayout,
    selectRadiusAxisForBandSize,
    selectRadiusAxisTicks,
    selectAngleAxisForBandSize,
    selectAngleAxisTicks,
  ],
  (
    layout: LayoutType,
    radiusAxis: BaseAxisWithScale | undefined,
    radiusAxisTicks: ReadonlyArray<TickItem> | undefined,
    angleAxis: BaseAxisWithScale | undefined,
    angleAxisTicks: ReadonlyArray<TickItem> | undefined,
  ) => {
    if (isCategoricalAxis(layout, 'radiusAxis')) {
      return getBandSizeOfAxis(radiusAxis, radiusAxisTicks, false)
    }
    return getBandSizeOfAxis(angleAxis, angleAxisTicks, false)
  },
)

const selectSynchronisedRadarDataKey: (
  state: RechartsRootState,
  _radiusAxisId: AxisId,
  _angleAxisId: AxisId,
  _isPanorama: boolean,
  radarDataKey: DataKey<any> | undefined,
) => DataKey<any> | undefined = createSelector(
  [selectUnfilteredPolarItems, pickDataKey],
  (graphicalItems, radarDataKey) => {
    if (graphicalItems.some(pgis => pgis.type === 'radar' && radarDataKey === pgis.dataKey)) {
      return radarDataKey
    }
    return undefined
  },
)

export function computeRadarPoints({
  radiusAxis,
  angleAxis,
  displayedData,
  dataKey,
  bandSize,
}: {
  radiusAxis: RadiusAxisForRadar
  angleAxis: AngleAxisForRadar
  displayedData: any[]
  dataKey: DataKey<any>
  bandSize: number
}): RadarComposedData {
  const { cx, cy } = angleAxis
  let isRange = false
  const points: any[] = []
  const angleBandSize = angleAxis.type !== 'number' ? (bandSize ?? 0) : 0

  displayedData.forEach((entry, i) => {
    const name = getValueByDataKey(entry, angleAxis.dataKey, i)
    const value = getValueByDataKey(entry, dataKey)
    const angle: number = (angleAxis.scale(name) ?? 0) + angleBandSize
    const pointValue = toFiniteNumber(Array.isArray(value) ? last(value) : value)
    const radius: number = pointValue == null ? 0 : (radiusAxis.scale(pointValue) ?? 0)

    if (Array.isArray(value) && value.length >= 2) {
      isRange = true
    }

    points.push({
      ...polarToCartesian(cx, cy, radius, angle),
      name,
      value,
      cx,
      cy,
      radius,
      angle,
      payload: entry,
    })
  })

  const baseLinePoints: any[] = []

  if (isRange) {
    points.forEach((point: any) => {
      if (Array.isArray(point.value)) {
        const baseValue = toFiniteNumber(point.value[0])
        const radius: number = baseValue == null ? 0 : (radiusAxis.scale(baseValue) ?? 0)
        baseLinePoints.push({
          ...point,
          radius,
          ...polarToCartesian(cx, cy, radius, point.angle),
        })
      }
      else {
        baseLinePoints.push(point)
      }
    })
  }

  return { points, isRange, baseLinePoints }
}

export const selectRadarPoints: (
  state: RechartsRootState,
  radiusAxisId: AxisId,
  angleAxisId: AxisId,
  isPanorama: boolean,
  radarDataKey: DataKey<any> | undefined,
) => RadarComposedData | undefined = createSelector(
  [
    selectRadiusAxisForRadar,
    selectAngleAxisWithScaleAndViewport,
    selectChartDataAndAlwaysIgnoreIndexes,
    selectSynchronisedRadarDataKey,
    selectBandSizeOfAxis,
  ],
  (
    radiusAxis: RadiusAxisForRadar | undefined,
    angleAxis: AngleAxisForRadar | undefined,
    { chartData, dataStartIndex, dataEndIndex }: ChartDataState,
    dataKey: DataKey<any> | undefined,
    bandSize: number | undefined,
  ) => {
    if (radiusAxis == null || angleAxis == null || chartData == null || bandSize == null || dataKey == null) {
      return undefined
    }
    const displayedData = chartData.slice(dataStartIndex, dataEndIndex + 1)
    return computeRadarPoints({
      radiusAxis,
      angleAxis,
      displayedData,
      dataKey,
      bandSize,
    })
  },
)
