import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import type { AxisId } from '../chartCartesianAxis'
import { selectChartDataWithIndexesIfNotInPanorama } from './dataSelectors'
import { selectAxisWithScale, selectTicksOfGraphicalItem, selectUnfilteredCartesianItems } from './axisSelectors'
import type { ChartData } from '../chartData'
import type { DataKey } from '@/types'
import { isCategoricalAxis } from '@/utils'
import { getBandSizeOfAxis } from '@/utils/chart'
import { computeLinePoints } from '@/cartesian/line/utils'
import { selectChartLayout } from '@/state/selectors/common'

export type ResolvedLineSettings = {
  data: ChartData | undefined
  dataKey: DataKey<any> | undefined
}

function selectXAxisWithScale(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId, isPanorama: boolean) {
  return selectAxisWithScale(state, 'xAxis', xAxisId, isPanorama)
}

function selectXAxisTicks(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId, isPanorama: boolean) {
  return selectTicksOfGraphicalItem(state, 'xAxis', xAxisId, isPanorama)
}

function selectYAxisWithScale(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean) {
  return selectAxisWithScale(state, 'yAxis', yAxisId, isPanorama)
}

function selectYAxisTicks(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId, isPanorama: boolean) {
  return selectTicksOfGraphicalItem(state, 'yAxis', yAxisId, isPanorama)
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

function pickLineSettings(_state: RechartsRootState, _xAxisId: AxisId, _yAxisId: AxisId, _isPanorama: boolean, lineSettings: ResolvedLineSettings) {
  return lineSettings
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
const selectSynchronisedLineSettings: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  isPanorama: boolean,
  lineSettings: ResolvedLineSettings,
) => ResolvedLineSettings | undefined = createSelector(
  [selectUnfilteredCartesianItems, pickLineSettings],
  (graphicalItems, lineSettingsFromProps) => {
    if (
      graphicalItems.some(
        cgis =>
          cgis.type === 'line'
          && lineSettingsFromProps.dataKey === cgis.dataKey
          && lineSettingsFromProps.data === cgis.data,
      )
    ) {
      /*
       * now, at least one of the lines has the same dataKey as the one in props.
       * Is this a perfect match? Maybe not because we could theoretically have two different Lines with the same dataKey
       * and the same stackId and the same data but still different lines, yes,
       * but the chances of that happening are ... lowish.
       *
       * A proper fix would be to store the lineSettings in a state too, and compare references directly instead of enumerating the properties.
       */
      return lineSettingsFromProps
    }
    return undefined
  },
)

export const selectLinePoints = createSelector(
  [
    selectChartLayout,
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks,
    selectSynchronisedLineSettings,
    selectBandSize,
    selectChartDataWithIndexesIfNotInPanorama,
  ],
  (
    layout,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    lineSettings,
    bandSize,
    { chartData, dataStartIndex, dataEndIndex },
  ) => {
    if (
      lineSettings == null
      || xAxis == null
      || yAxis == null
      || xAxisTicks == null
      || yAxisTicks == null
      || xAxisTicks.length === 0
      || yAxisTicks.length === 0
    ) {
      return undefined
    }

    const { dataKey, data } = lineSettings
    let displayedData: ChartData | undefined

    if (data?.length! > 0) {
      displayedData = data
    }
    else {
      displayedData = chartData?.slice(dataStartIndex, dataEndIndex + 1)
    }

    if (displayedData == null) {
      return undefined
    }

    return computeLinePoints({ layout, xAxis, yAxis, xAxisTicks, yAxisTicks, dataKey, bandSize: bandSize!, displayedData })
  },
)
