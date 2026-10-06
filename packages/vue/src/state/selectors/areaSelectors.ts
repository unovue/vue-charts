import { createSelector } from '../createSelector'
import type { StackGroup } from '@/core/axis/stacks'
import { selectAxisWithScale, selectStackGroups, selectTicksOfGraphicalItem, selectUnfilteredCartesianItems } from '@/state/chartContext'
import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'
import { selectChartDataWithIndexes } from './dataSelectors'
import type { ChartData } from '../chartData'
import type { Point as CurvePoint } from '@/shape'
import type { BaseValue } from '@/types/area'
import type { Coordinate, DataKey } from '@/types'
import type { StackId } from '@/types/tick'
import { isCategoricalAxis } from '@/utils'
import { getBandSizeOfAxis, getNormalizedStackId } from '@/utils/chart'
import { computeArea } from '@/cartesian/area/utils'
import { selectChartLayout } from '@/state/selectors/common'

export interface AreaPointItem extends CurvePoint {
  value?: number | number[]
  payload?: any
}
export type AreaSettings = {
  connectNulls: boolean
  baseValue: BaseValue | undefined
  dataKey: DataKey<any>
  stackId: StackId | undefined
  data: ChartData | undefined
}

export type ComputedArea = {
  points: ReadonlyArray<AreaPointItem>
  baseLine: number | Coordinate[]
  isRange: boolean
}

function selectXAxisWithScale(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId) {
  return selectAxisWithScale(state, 'xAxis', xAxisId)
}

function selectXAxisTicks(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId) {
  return selectTicksOfGraphicalItem(state, 'xAxis', xAxisId)
}

function selectYAxisWithScale(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId) {
  return selectAxisWithScale(state, 'yAxis', yAxisId)
}

function selectYAxisTicks(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId) {
  return selectTicksOfGraphicalItem(state, 'yAxis', yAxisId)
}

const selectBandSize = createSelector(
  [selectChartLayout, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks],
  (layout, xAxis, yAxis, xAxisTicks, yAxisTicks) => {
    if (isCategoricalAxis(layout, 'xAxis')) {
      return getBandSizeOfAxis(xAxis, xAxisTicks!, false)
    }
    return getBandSizeOfAxis(yAxis, yAxisTicks!, false)
  },
)

function selectGraphicalItemStackedData(
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  areaSettings: AreaSettings,
) {
  const layout = selectChartLayout(state)
  const isXAxisCategorical = isCategoricalAxis(layout, 'xAxis')
  let stackGroups: Record<StackId, StackGroup> | undefined
  if (isXAxisCategorical) {
    stackGroups = selectStackGroups(state, 'yAxis', yAxisId)
  }
  else {
    stackGroups = selectStackGroups(state, 'xAxis', xAxisId)
  }
  if (stackGroups == null) {
    return undefined
  }
  const { dataKey, stackId } = areaSettings
  const groups = stackGroups[stackId!]?.stackedData
  return groups?.find(v => v.key === dataKey)
}

function pickAreaSettings(
  _state: RechartsRootState,
  _xAxisId: AxisId,
  _yAxisId: AxisId,
  areaSettings: AreaSettings,
) {
  return areaSettings
}

/*
 * There is a race condition problem because we read some data from props and some from the state.
 * The state is updated through a dispatch and is one render behind,
 * and so we have this weird one tick render where the displayedData in one selector have the old dataKey
 * but the new dataKey in another selector.
 *
 * A proper fix is to either move everything into the state, or read the dataKey always from props
 * - but this is a smaller change.
 */
const selectSynchronisedAreaSettings: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  areaSettings: AreaSettings,
) => AreaSettings | undefined = createSelector(
  [selectUnfilteredCartesianItems, pickAreaSettings],
  (graphicalItems, areaSettingsFromProps) => {
    if (
      graphicalItems.some(
        cgis =>
          cgis.type === 'area'
          && areaSettingsFromProps.dataKey === cgis.dataKey
          && getNormalizedStackId(areaSettingsFromProps.stackId) === cgis.stackId
          && areaSettingsFromProps.data === cgis.data,
      )
    ) {
      /*
       * now, at least one of the areas has the same dataKey as the one in props.
       * Is this a perfect match? Maybe not because we could theoretically have two different Areas with the same dataKey
       * and the same stackId and the same data but still different areas, yes,
       * but the chances of that happening are ... lowish.
       *
       * A proper fix would be to store the areaSettings in a state too, and compare references directly instead of enumerating the properties.
       */
      return areaSettingsFromProps
    }
    return undefined
  },
)

export const selectArea: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  areaSettings: AreaSettings,
) => ComputedArea | undefined = createSelector(
  [
    selectChartLayout,
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks,
    selectGraphicalItemStackedData,
    selectChartDataWithIndexes,
    selectBandSize,
    selectSynchronisedAreaSettings,
  ],
  (
    layout,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    stackedData,
    { chartData, dataStartIndex, dataEndIndex },
    bandSize,
    areaSettings,
  ) => {
    if (
      areaSettings == null
      || (layout !== 'horizontal' && layout !== 'vertical')
      || xAxis == null
      || yAxis == null
      || xAxisTicks == null
      || yAxisTicks == null
      || xAxisTicks.length === 0
      || yAxisTicks.length === 0
    ) {
      return undefined
    }
    const { data } = areaSettings

    let displayedData: ChartData | undefined
    if (data && data.length > 0) {
      displayedData = data
    }
    else {
      displayedData = chartData?.slice(dataStartIndex, dataEndIndex + 1)
    }

    if (displayedData == null) {
      return undefined
    }

    // Where is this supposed to come from? No charts have that as a prop.
    const chartBaseValue: undefined = undefined

    return computeArea({
      layout,
      xAxis,
      yAxis,
      xAxisTicks,
      yAxisTicks,
      dataStartIndex,
      areaSettings,
      stackedData: stackedData!,
      displayedData,
      chartBaseValue,
      bandSize: bandSize!,
    })
  },
)
