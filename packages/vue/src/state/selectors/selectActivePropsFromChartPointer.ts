import { createSelector } from '../createSelector'
import type { RechartsRootState } from '../chartState'
import { selectOrderedTooltipTicks, selectPolarViewBox, selectTooltipAxisRangeWithReverse, selectTooltipAxisTicks, selectTooltipAxisType } from '@/state/chartContext'
import { selectChartOffset } from './selectChartOffset'
import { combineActiveProps } from '@/core/interaction'
import type { ChartPointer } from '@/types'
import { selectChartLayout } from '@/state/selectors/common'

const pickChartPointer = (_state: RechartsRootState, chartPointer: ChartPointer) => chartPointer

export const selectActivePropsFromChartPointer = createSelector(
  [
    pickChartPointer,
    selectChartLayout,
    selectPolarViewBox,
    selectTooltipAxisType,
    selectTooltipAxisRangeWithReverse,
    selectTooltipAxisTicks,
    selectOrderedTooltipTicks,
    selectChartOffset,
  ],
  combineActiveProps,
)
