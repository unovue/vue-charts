import { createSelector } from '../createSelector'
import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'
import type { AngleAxisSettings, RadiusAxisSettings } from '../chartPolarAxis'
import type { PolarChartOptions } from '../chartPolarOptions'
import { selectChartHeight, selectChartWidth } from './containerSelectors'
import { selectChartOffset } from './selectChartOffset'
import type { AxisRange } from './axisSelectors'
import { combineAxisRangeWithReverse } from './combiners/combineAxisRangeWithReverse'
import { getMaxRadius } from '@/utils/polar'
import { getPercentValue } from '@/utils/data'
import type { LayoutType } from '@/types'
import type { PolarViewBoxRequired } from '@/cartesian/type'
import { selectChartLayout } from '@/state/selectors/common'

export const defaultPolarAngleAxisProps = {
  allowDuplicatedCategory: true, // if I set this to false then Tooltip synchronisation stops working in Radar, wtf
  angleAxisId: 0,
  axisLine: true,
  cx: 0,
  cy: 0,
  orientation: 'outer',
  reversed: false,
  scale: 'auto',
  tick: true,
  tickLine: true,
  tickSize: 8,
  type: 'category',
} as const
export const implicitAngleAxis: AngleAxisSettings = {
  allowDataOverflow: false,
  allowDecimals: false,
  allowDuplicatedCategory: false, // defaultPolarAngleAxisProps.allowDuplicatedCategory has it set to true but the actual axis rendering ignores the prop because reasons,
  dataKey: undefined,
  domain: undefined,
  id: undefined,
  includeHidden: false,
  name: undefined,
  reversed: defaultPolarAngleAxisProps.reversed,
  scale: defaultPolarAngleAxisProps.scale,
  tick: defaultPolarAngleAxisProps.tick,
  tickCount: undefined!,
  ticks: undefined,
  type: defaultPolarAngleAxisProps.type,
  unit: undefined,
}

export const defaultPolarRadiusAxisProps = {
  allowDataOverflow: false,
  allowDuplicatedCategory: true,
  angle: 0,
  axisLine: true,
  cx: 0,
  cy: 0,
  orientation: 'right',
  radiusAxisId: 0,
  scale: 'auto',
  stroke: 'var(--v-charts-grid, #ccc)',
  tick: true,
  tickCount: 5,
  type: 'number',
} as const

export const implicitRadiusAxis: RadiusAxisSettings = {
  allowDataOverflow: defaultPolarRadiusAxisProps.allowDataOverflow,
  allowDecimals: false,
  allowDuplicatedCategory: defaultPolarRadiusAxisProps.allowDuplicatedCategory,
  dataKey: undefined,
  domain: undefined,
  id: undefined,
  includeHidden: false,
  name: undefined,
  reversed: false,
  scale: defaultPolarRadiusAxisProps.scale,
  tick: defaultPolarRadiusAxisProps.tick,
  tickCount: defaultPolarRadiusAxisProps.tickCount,
  ticks: undefined,
  type: defaultPolarRadiusAxisProps.type,
  unit: undefined,
}

export const implicitRadialBarAngleAxis: AngleAxisSettings = {
  allowDataOverflow: false,
  allowDecimals: false,
  allowDuplicatedCategory: defaultPolarAngleAxisProps.allowDuplicatedCategory,
  dataKey: undefined,
  domain: undefined,
  id: undefined,
  includeHidden: false,
  name: undefined,
  reversed: false,
  scale: defaultPolarAngleAxisProps.scale,
  tick: defaultPolarAngleAxisProps.tick,
  tickCount: undefined!,
  ticks: undefined,
  type: 'number',
  unit: undefined,
}

export const implicitRadialBarRadiusAxis: RadiusAxisSettings = {
  allowDataOverflow: defaultPolarRadiusAxisProps.allowDataOverflow,
  allowDecimals: false,
  allowDuplicatedCategory: defaultPolarRadiusAxisProps.allowDuplicatedCategory,
  dataKey: undefined,
  domain: undefined,
  id: undefined,
  includeHidden: false,
  name: undefined,
  reversed: false,
  scale: defaultPolarRadiusAxisProps.scale,
  tick: defaultPolarRadiusAxisProps.tick,
  tickCount: defaultPolarRadiusAxisProps.tickCount,
  ticks: undefined,
  type: 'category',
  unit: undefined,
}

export function selectAngleAxis(state: RechartsRootState, angleAxisId: AxisId): AngleAxisSettings | undefined {
  if (state.polarAxis.angleAxis[angleAxisId] != null) {
    return state.polarAxis.angleAxis[angleAxisId]
  }
  if (state.layout.layoutType === 'radial') {
    return implicitRadialBarAngleAxis
  }
  return implicitAngleAxis
}

export function selectRadiusAxis(state: RechartsRootState, radiusAxisId: AxisId): RadiusAxisSettings | undefined {
  if (state.polarAxis.radiusAxis[radiusAxisId] != null) {
    return state.polarAxis.radiusAxis[radiusAxisId]
  }
  if (state.layout.layoutType === 'radial') {
    return implicitRadialBarRadiusAxis
  }
  return implicitRadiusAxis
}

export const selectPolarOptions = (state: RechartsRootState): PolarChartOptions | null => state.polarOptions

export const selectMaxRadius: (state: RechartsRootState) => number = createSelector(
  [selectChartWidth, selectChartHeight, selectChartOffset],
  getMaxRadius,
)

const selectInnerRadius: (state: RechartsRootState) => number | undefined = createSelector(
  [selectPolarOptions, selectMaxRadius],
  (polarChartOptions: PolarChartOptions | null, maxRadius: number) => {
    if (polarChartOptions == null) {
      return undefined
    }
    return getPercentValue(polarChartOptions.innerRadius, maxRadius, 0)
  },
)

export const selectOuterRadius: (state: RechartsRootState) => number | undefined = createSelector(
  [selectPolarOptions, selectMaxRadius],
  (polarChartOptions: PolarChartOptions | null, maxRadius: number) => {
    if (polarChartOptions == null) {
      return undefined
    }
    return getPercentValue(polarChartOptions.outerRadius, maxRadius, maxRadius * 0.8)
  },
)

function combineAngleAxisRange(polarOptions: PolarChartOptions | null): AxisRange {
  if (polarOptions == null) {
    return [0, 0]
  }
  const { startAngle, endAngle } = polarOptions
  return [startAngle, endAngle]
}

export const selectAngleAxisRange: (state: RechartsRootState) => AxisRange = createSelector(
  [selectPolarOptions],
  combineAngleAxisRange,
)

export const selectAngleAxisRangeWithReversed: (
  state: RechartsRootState,
  angleAxisId: AxisId,
) => AxisRange | undefined = createSelector([selectAngleAxis, selectAngleAxisRange], combineAxisRangeWithReverse)

export const selectRadiusAxisRange: (state: RechartsRootState, radiusAxisId: AxisId) => AxisRange | undefined
  = createSelector([selectMaxRadius, selectInnerRadius, selectOuterRadius], (maxRadius, innerRadius, outerRadius) => {
    if (maxRadius == null || innerRadius == null || outerRadius == null) {
      return undefined
    }
    return [innerRadius, outerRadius]
  })

export const selectRadiusAxisRangeWithReversed: (
  state: RechartsRootState,
  radiusAxisId: AxisId,
) => AxisRange | undefined = createSelector([selectRadiusAxis, selectRadiusAxisRange], combineAxisRangeWithReverse)

export const selectPolarViewBox: (state: RechartsRootState) => PolarViewBoxRequired | undefined = createSelector(
  [selectChartLayout, selectPolarOptions, selectInnerRadius, selectOuterRadius, selectChartWidth, selectChartHeight],
  (
    layout: LayoutType,
    polarOptions: PolarChartOptions | null,
    innerRadius,
    outerRadius,
    width,
    height,
  ): PolarViewBoxRequired | undefined => {
    if (
      (layout !== 'centric' && layout !== 'radial')
      || polarOptions == null
      || innerRadius == null
      || outerRadius == null
    ) {
      return undefined
    }
    const { cx, cy, startAngle, endAngle } = polarOptions
    return {
      cx: getPercentValue(cx, width, width / 2),
      cy: getPercentValue(cy, height, height / 2),
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      clockWise: false,
    }
  },
)
