import type { MaybeStackedGraphicalItem } from '@/types/graphical'

export type { MaybeStackedGraphicalItem } from '@/types/graphical'
import { createSelector } from '../createSelector'
import type { Series } from 'd3-shape'
import type { RechartsRootState } from '../chartState'
import type { BaseAxisWithScale } from '@/types/axisSettings'
import type { StackGroup } from '@/core/axis/stacks'
import { selectAxisWithScale, selectCartesianAxisSize, selectStackGroups, selectTicksOfGraphicalItem, selectUnfilteredCartesianItems } from '@/state/chartContext'
import type { AxisId } from '../chartCartesianAxis'
import type { ChartData } from '../chartData'
import { selectChartDataWithIndexes } from './dataSelectors'
import { selectChartOffset } from './selectChartOffset'
import {
  selectBarCategoryGap,
  selectBarGap,
  selectRootBarSize,
  selectRootMaxBarSize,
} from './rootPropsSelectors'
import type { DataKey, LayoutType, TickItem } from '@/types'
import type { MinPointSize, NormalizedStackId } from '@/shape'
import { isNullish } from '@/utils'
import { getPercentValue } from '@/utils/data'
import type { StackId } from '@/types/tick'
import { getBandSizeOfAxis } from '@/utils/chart'
import type { BarPositionPosition, BarRectangleItem } from '@/types/bar'
import { computeBarRectangles } from '@/cartesian/bar/utils'
import { selectChartLayout } from '@/state/selectors/common'

export type BarSettings = {
  barSize: number | string | undefined
  data: ChartData | undefined
  dataKey: DataKey<any>
  maxBarSize: number | undefined
  minPointSize: MinPointSize
  stackId: NormalizedStackId | undefined
}

const pickXAxisId = (_state: RechartsRootState, xAxisId: AxisId) => xAxisId

const pickYAxisId = (_state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId) => yAxisId

function pickBarSettings(
  _state: RechartsRootState,
  _xAxisId: AxisId,
  _yAxisId: AxisId,
  barSettings: BarSettings,
): BarSettings {
  return barSettings
}

function pickMaxBarSize(
  _state: RechartsRootState,
  _xAxisId: AxisId,
  _yAxisId: AxisId,
  barSettings: BarSettings,
): number | undefined {
  return barSettings.maxBarSize
}

function pickCells(
  _state: RechartsRootState,
  _xAxisId: AxisId,
  _yAxisId: AxisId,
  _barSettings: BarSettings,
  cells: ReadonlyArray<any> | undefined,
): ReadonlyArray<any> | undefined {
  return []
  // return cells
}

function getBarSize(
  globalSize: number | string | undefined,
  totalSize: number | undefined,
  selfSize: number | string | undefined,
): number | undefined {
  const barSize = selfSize ?? globalSize

  return isNullish(barSize) ? undefined : getPercentValue(barSize!, totalSize!, 0)
}

const selectAllVisibleBars = createSelector(
  [selectChartLayout, selectUnfilteredCartesianItems, pickXAxisId, pickYAxisId],
  (layout: LayoutType, allItems, xAxisId, yAxisId) =>
    allItems
      .filter((i) => {
        if (layout === 'horizontal') {
          return i.xAxisId === xAxisId
        }
        return i.yAxisId === yAxisId
      })
      .filter(i => i.hide === false)
      .filter(i => i.type === 'bar'),
)

type BarCategory = {
  stackId: StackId | undefined
  /**
   * List of dataKeys of items stacked at this position.
   * All of these Bars are either sharing the same stackId,
   * or this is an array with one Bar because it has no stackId defined.
   *
   * This structure limits us to having one dataKey only once per stack which I think is reasonable.
   * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
   */
  dataKeys: ReadonlyArray<DataKey<any>>
  /**
   * Width (in horizontal chart) or height (in vertical chart) of this stack of items
   */
  barSize: number
}

export type SizeList = ReadonlyArray<BarCategory>

function selectBarStackGroups(
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
): Record<StackId, StackGroup> | undefined {
  const layout = selectChartLayout(state)
  if (layout === 'horizontal') {
    return selectStackGroups(state, 'yAxis', yAxisId)
  }
  return selectStackGroups(state, 'xAxis', xAxisId)
}

export function selectBarCartesianAxisSize(
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
) {
  const layout = selectChartLayout(state)
  if (layout === 'horizontal') {
    return selectCartesianAxisSize(state, 'xAxis', xAxisId)
  }
  return selectCartesianAxisSize(state, 'yAxis', yAxisId)
}

export function combineBarSizeList(
  allBars: ReadonlyArray<MaybeStackedGraphicalItem>,
  globalSize: string | number | undefined,
  totalSize?: number,
) {
  const initialValue: Record<StackId, Array<MaybeStackedGraphicalItem>> = Object.create(null)

  const stackedBars = allBars.filter(b => b.stackId != null)
  const unstackedBars = allBars.filter(b => b.stackId == null)

  const groupByStack: Record<StackId, Array<MaybeStackedGraphicalItem>> = stackedBars.reduce((acc, bar) => {
    if (!acc[bar.stackId!]) {
      acc[bar.stackId!] = []
    }
    acc[bar.stackId!].push(bar)
    return acc
  }, initialValue)

  const stackedSizeList: SizeList = Object.entries(groupByStack).map(([stackId, bars]): BarCategory => {
    const dataKeys = bars.map(b => b.dataKey!)
    const barSize: number = getBarSize(globalSize, totalSize, bars[0].barSize)!
    return { stackId, dataKeys, barSize }
  })

  const unstackedSizeList: SizeList = unstackedBars.map((b): BarCategory => {
    const dataKeys = [b.dataKey!]
    const barSize: number = getBarSize(globalSize, totalSize, b.barSize)!
    return { stackId: undefined, dataKeys, barSize }
  })

  return [...stackedSizeList, ...unstackedSizeList]
}
export const selectBarSizeList = createSelector(
  [selectAllVisibleBars, selectRootBarSize, selectBarCartesianAxisSize],
  combineBarSizeList,
)

export function selectBarBandSize(
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  barSettings: BarSettings,
) {
  const layout = selectChartLayout(state)
  const globalMaxBarSize: number | undefined = selectRootMaxBarSize(state)
  const { maxBarSize: childMaxBarSize } = barSettings
  const maxBarSize: number = isNullish(childMaxBarSize) ? globalMaxBarSize! : childMaxBarSize!
  let axis: BaseAxisWithScale, ticks: ReadonlyArray<TickItem>
  if (layout === 'horizontal') {
    axis = selectAxisWithScale(state, 'xAxis', xAxisId)!
    ticks = selectTicksOfGraphicalItem(state, 'xAxis', xAxisId)!
  }
  else {
    axis = selectAxisWithScale(state, 'yAxis', yAxisId)!
    ticks = selectTicksOfGraphicalItem(state, 'yAxis', yAxisId)!
  }
  return getBandSizeOfAxis(axis, ticks, true) ?? maxBarSize ?? 0
}

export function selectAxisBandSize(state: RechartsRootState, xAxisId: AxisId, yAxisId: AxisId) {
  return state.layout.layoutType === 'horizontal'
    ? state.axis('xAxis', xAxisId).bandSize.value
    : state.axis('yAxis', yAxisId).bandSize.value
}

function getBarPositions(
  barGap: string | number,
  barCategoryGap: string | number,
  bandSize: number,
  sizeList: SizeList,
  maxBarSize: number,
): ReadonlyArray<BarWithPosition> | null {
  const len = sizeList.length
  if (len < 1)
    return null

  let realBarGap = getPercentValue(barGap, bandSize, 0, true)

  let result: ReadonlyArray<BarWithPosition>
  const initialValue: ReadonlyArray<BarWithPosition> = []

  // whether is barSize set by user
  // Okay but why does it check only for the first element? What if the first element is set but others are not?
  if (sizeList[0].barSize === +sizeList[0].barSize) {
    let useFull = false
    let fullBarSize = bandSize / len
    let sum = sizeList.reduce((res, entry) => res + entry.barSize || 0, 0)
    sum += (len - 1) * realBarGap

    if (sum >= bandSize) {
      sum -= (len - 1) * realBarGap
      realBarGap = 0
    }
    if (sum >= bandSize && fullBarSize > 0) {
      useFull = true
      fullBarSize *= 0.9
      sum = len * fullBarSize
    }

    const offset = ((bandSize - sum) / 2) >> 0
    let prev: BarPositionPosition = { offset: offset - realBarGap, size: 0 }

    result = sizeList.reduce(
      (res: ReadonlyArray<BarWithPosition>, entry: BarCategory): ReadonlyArray<BarWithPosition> => {
        const newPosition: BarWithPosition = {
          stackId: entry.stackId,
          dataKeys: entry.dataKeys,
          position: {
            offset: prev.offset + prev.size! + realBarGap,
            size: useFull ? fullBarSize : entry.barSize,
          },
        }
        const newRes: Array<BarWithPosition> = [...res, newPosition]

        prev = newRes[newRes.length - 1].position

        return newRes
      },
      initialValue,
    )
  }
  else {
    const offset = getPercentValue(barCategoryGap, bandSize, 0, true)

    if (bandSize - 2 * offset - (len - 1) * realBarGap <= 0) {
      realBarGap = 0
    }

    let originalSize = (bandSize - 2 * offset - (len - 1) * realBarGap) / len
    if (originalSize > 1) {
      originalSize >>= 0
    }
    const size = maxBarSize === +maxBarSize ? Math.min(originalSize, maxBarSize) : originalSize
    result = sizeList.reduce(
      (res: ReadonlyArray<BarWithPosition>, entry: BarCategory, i): ReadonlyArray<BarWithPosition> => [
        ...res,
        {
          stackId: entry.stackId,
          dataKeys: entry.dataKeys,
          position: {
            offset: offset + (originalSize + realBarGap) * i + (originalSize - size) / 2,
            size,
          },
        },
      ],
      initialValue,
    )
  }

  return result
}

export type BarWithPosition = {
  stackId: StackId | undefined
  /**
   * List of dataKeys of items stacked at this position.
   * All of these Bars are either sharing the same stackId,
   * or this is an array with one Bar because it has no stackId defined.
   *
   * This structure limits us to having one dataKey only once per stack which I think is reasonable.
   * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
   */
  dataKeys: ReadonlyArray<DataKey<any>>
  /**
   * Position of this stack in absolute pixels measured from the start of the chart
   */
  position: BarPositionPosition
}

export function combineAllBarPositions(
  sizeList: SizeList | undefined,
  globalMaxBarSize: number,
  barGap: string | number,
  barCategoryGap: string | number,
  barBandSize: number | undefined,
  bandSize: number | undefined,
  childMaxBarSize: number | undefined,
) {
  const maxBarSize: number = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize!

  let allBarPositions = getBarPositions(
    barGap,
    barCategoryGap,
    barBandSize !== bandSize ? barBandSize! : bandSize!,
    sizeList!,
    maxBarSize,
  )

  if (barBandSize !== bandSize && allBarPositions != null) {
    allBarPositions = allBarPositions.map(pos => ({
      ...pos,
      position: { ...pos.position, offset: pos.position.offset - barBandSize! / 2 },
    }))
  }

  return allBarPositions!
}

export const selectAllBarPositions = createSelector(
  [
    selectBarSizeList,
    selectRootMaxBarSize,
    selectBarGap,
    selectBarCategoryGap,
    selectBarBandSize,
    selectAxisBandSize,
    pickMaxBarSize,
  ],
  combineAllBarPositions,
)

function selectXAxisWithScale(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId) {
  return selectAxisWithScale(state, 'xAxis', xAxisId)
}

function selectYAxisWithScale(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId) {
  return selectAxisWithScale(state, 'yAxis', yAxisId)
}

function selectXAxisTicks(state: RechartsRootState, xAxisId: AxisId, _yAxisId: AxisId) {
  return selectTicksOfGraphicalItem(state, 'xAxis', xAxisId)
}

function selectYAxisTicks(state: RechartsRootState, _xAxisId: AxisId, yAxisId: AxisId) {
  return selectTicksOfGraphicalItem(state, 'yAxis', yAxisId)
}
export const selectBarPosition = createSelector(
  [selectAllBarPositions, pickBarSettings],
  (allBarPositions: ReadonlyArray<BarWithPosition>, barSettings) => {
    if (allBarPositions == null) {
      return undefined
    }
    const position = allBarPositions.find(
      (p: BarWithPosition) => p.stackId === barSettings.stackId && p.dataKeys.includes(barSettings.dataKey),
    )
    if (position == null) {
      return undefined
    }
    return position.position
  },
)

export function combineStackedData(
  stackGroups: Record<StackId, StackGroup> | undefined,
  barSettings: MaybeStackedGraphicalItem | undefined,
): Series<Record<number, number>, DataKey<any>> | undefined {
  if (!stackGroups || barSettings?.dataKey == null) {
    return undefined
  }
  const { stackId } = barSettings
  const stackGroup: StackGroup = stackGroups[stackId!]
  if (!stackGroup) {
    return undefined
  }
  const { stackedData }: StackGroup = stackGroup
  if (!stackedData) {
    return undefined
  }
  // @ts-expect-error bar assumes numeric stacks, d3 returns string, unknown
  const stack: Series<Record<number, number>, DataKey<any>> = stackedData.find(sd => sd.key === barSettings.dataKey)
  return stack
}

const selectSynchronisedBarSettings = createSelector(
  [selectUnfilteredCartesianItems, pickBarSettings],
  (graphicalItems, barSettingsFromProps) => {
    if (
      graphicalItems.some(
        cgis =>
          cgis.type === 'bar'
          && barSettingsFromProps.dataKey === cgis.dataKey
          && barSettingsFromProps.stackId === cgis.stackId
          // barSettingsFromProps.data === cgis.data && // bar doesn't support data and one is undefined and another is null and this condition breaks
          && barSettingsFromProps.stackId === cgis.stackId,
      )
    ) {
      return barSettingsFromProps
    }
    return undefined
  },
)

const selectStackedDataOfItem: (
  state: RechartsRootState,
  xAxisId: AxisId,
  yAxisId: AxisId,
  barSettings: BarSettings,
) => Series<Record<number, number>, DataKey<any>> | undefined = createSelector(
  [selectBarStackGroups, pickBarSettings],
  combineStackedData,
)

export const selectBarRectangles = createSelector(
  [
    selectChartOffset,
    selectXAxisWithScale,
    selectYAxisWithScale,
    selectXAxisTicks,
    selectYAxisTicks,
    selectBarPosition,
    selectChartLayout,
    selectChartDataWithIndexes,
    selectAxisBandSize,
    selectStackedDataOfItem,
    selectSynchronisedBarSettings,
  ],
  (
    offset,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    pos,
    layout,
    { chartData, dataStartIndex, dataEndIndex },
    bandSize,
    stackedData,
    barSettings: BarSettings | undefined,
  ): ReadonlyArray<BarRectangleItem> | undefined => {
    if (
      barSettings == null
      || pos == null
      || (layout !== 'horizontal' && layout !== 'vertical')
      || xAxis == null
      || yAxis == null
      || xAxisTicks == null
      || yAxisTicks == null
    ) {
      return undefined
    }
    const { data } = barSettings

    let displayedData: ChartData | undefined
    if ((data?.length ?? 0) > 0) {
      displayedData = data
    }
    else {
      displayedData = chartData?.slice(dataStartIndex, dataEndIndex + 1)
    }

    if (displayedData == null) {
      return undefined
    }

    return computeBarRectangles({
      layout,
      barSettings,
      pos,
      bandSize: bandSize!,
      xAxis,
      yAxis,
      xAxisTicks,
      yAxisTicks,
      stackedData,
      displayedData,
      offset,
    })
  },
)
