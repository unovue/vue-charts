import { createSelector } from '@reduxjs/toolkit'
import { sortBy } from 'lodash-es'
import { useAppSelector } from '../hooks'
import type { RechartsRootState } from '../store'
import type {
  ActiveTooltipProps,
  TooltipIndex,
  TooltipInteractionState,
  TooltipPayload,
  TooltipPayloadConfiguration,
} from '../tooltipSlice'
import { selectChartDataWithIndexes } from './dataSelectors'
import { combineTooltipPayload, selectTooltipAxis, selectTooltipAxisDomain, selectTooltipAxisTicks, selectTooltipDisplayedData } from './tooltipSelectors'
import type { AxisRange } from './axisSelectors'
import { selectChartName } from './rootPropsSelectors'
import { selectChartOffset } from './selectChartOffset'
import { selectChartHeight, selectChartWidth } from './containerSelectors'
import { combineActiveLabel } from './combiners/combineActiveLabel'
import { combineTooltipInteractionState } from './combiners/combineTooltipInteractionState'
import { combineActiveTooltipIndex } from './combiners/combineActiveTooltipIndex'
import { combineCoordinateForDefaultIndex } from './combiners/combineCoordinateForDefaultIndex'
import { combineTooltipPayloadConfigurations } from './combiners/combineTooltipPayloadConfigurations'
import { selectTooltipPayloadSearcher } from './selectTooltipPayloadSearcher'
import { selectTooltipState } from './selectTooltipState'
import type { ChartOffsetRequired, ChartPointer, Coordinate, DataKey, LayoutType, TickItem, TooltipEventType, TooltipTrigger } from '@/types'
import { calculateActiveTickIndex, calculateTooltipPos, getActiveCoordinate, inRange } from '@/utils/chart'
import type { PolarViewBoxRequired } from '@/cartesian/type'
import type { AxisType } from '@/types/axis'
import { selectChartLayout } from '@/state/selectors/common'

export function useChartName() {
  return useAppSelector(selectChartName)!
}

function pickTooltipEventType(_state: RechartsRootState, tooltipEventType: TooltipEventType): TooltipEventType {
  return tooltipEventType
}

function pickTrigger(_state: RechartsRootState, _tooltipEventType: TooltipEventType, trigger: TooltipTrigger): TooltipTrigger {
  return trigger
}

function pickDefaultIndex(_state: RechartsRootState, _tooltipEventType: TooltipEventType, _trigger: TooltipTrigger, defaultIndex?: TooltipIndex | undefined): TooltipIndex | undefined {
  return defaultIndex
}

export const selectOrderedTooltipTicks = createSelector(selectTooltipAxisTicks, (ticks: ReadonlyArray<TickItem> | null) => {
  return sortBy(ticks, o => o.coordinate)
})

export const selectTooltipInteractionState: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => TooltipInteractionState = createSelector(
  [selectTooltipState, pickTooltipEventType, pickTrigger, pickDefaultIndex],
  combineTooltipInteractionState,
)

const selectTooltipAxisDataKeyForActiveIndex = createSelector(
  [selectTooltipAxis],
  axis => axis?.dataKey,
)

export const selectActiveIndex: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => TooltipIndex | null = createSelector(
  [selectTooltipInteractionState, selectTooltipDisplayedData, selectTooltipAxisDataKeyForActiveIndex, selectTooltipAxisDomain],
  combineActiveTooltipIndex,
)

export function selectTooltipDataKey(state: RechartsRootState, tooltipEventType: TooltipEventType, trigger: TooltipTrigger): DataKey<any> | undefined {
  const tooltipState = selectTooltipState(state)
  if (tooltipEventType === 'axis') {
    if (trigger === 'hover') {
      return tooltipState.axisInteraction.hover.dataKey
    }
    return tooltipState.axisInteraction.click.dataKey
  }
  if (trigger === 'hover') {
    return tooltipState.itemInteraction.hover.dataKey
  }
  return tooltipState.itemInteraction.click.dataKey
}

export const selectTooltipPayloadConfigurations: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => ReadonlyArray<TooltipPayloadConfiguration> = createSelector(
  [selectTooltipState, pickTooltipEventType, pickTrigger, pickDefaultIndex],
  combineTooltipPayloadConfigurations,
)

export const selectCoordinateForDefaultIndex: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => Coordinate | undefined = createSelector(
  [
    selectChartWidth,
    selectChartHeight,
    selectChartLayout,
    selectChartOffset,
    selectTooltipAxisTicks,
    pickDefaultIndex,
    selectTooltipPayloadConfigurations,
    selectTooltipPayloadSearcher,
  ],
  combineCoordinateForDefaultIndex,
)

export const selectActiveCoordinate: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
  // TODO the state is marked as containing Coordinate but actually in polar charts it contains PolarCoordinate, we should keep the polar state separate
) => Coordinate | undefined = createSelector(
  [selectTooltipInteractionState, selectCoordinateForDefaultIndex],
  (tooltipInteractionState: TooltipInteractionState, defaultIndexCoordinate: Coordinate): Coordinate | undefined => {
    return tooltipInteractionState.coordinate ?? defaultIndexCoordinate
  },
)

export const selectActiveLabel: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => string | number | undefined = createSelector(selectTooltipAxisTicks, selectActiveIndex, combineActiveLabel)

export const selectTooltipPayload: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
  // @ts-expect-error
) => TooltipPayload | undefined = createSelector(
  [
    selectTooltipPayloadConfigurations,
    selectActiveIndex,
    selectChartDataWithIndexes,
    selectTooltipAxis,
    selectActiveLabel,
    selectTooltipPayloadSearcher,
    pickTooltipEventType,
  ],
  combineTooltipPayload,
)

export const selectIsTooltipActive: (
  state: RechartsRootState,
  tooltipEventType: TooltipEventType,
  trigger: TooltipTrigger,
  defaultIndex: TooltipIndex | undefined,
) => { isActive: boolean, activeIndex: string | undefined } = createSelector(
  [selectTooltipInteractionState],
  (tooltipInteractionState: TooltipInteractionState) => {
    return { isActive: tooltipInteractionState.active, activeIndex: tooltipInteractionState.index }
  },
)

export function combineActiveProps(chartEvent: ChartPointer | undefined, layout: LayoutType | undefined, polarViewBox: PolarViewBoxRequired | undefined, tooltipAxisType: AxisType | undefined, tooltipAxisRange: AxisRange | undefined, tooltipTicks: ReadonlyArray<TickItem> | undefined | null, orderedTooltipTicks: ReadonlyArray<TickItem> | undefined, offset: ChartOffsetRequired): ActiveTooltipProps | undefined {
  if (!chartEvent || !layout || !tooltipAxisType || !tooltipAxisRange || !tooltipTicks) {
    return undefined
  }
  const rangeObj = inRange(chartEvent.chartX, chartEvent.chartY, layout, polarViewBox, offset)
  if (!rangeObj) {
    return undefined
  }
  const pos = calculateTooltipPos(rangeObj, layout)
  if (pos == null) {
    return undefined
  }

  const activeIndex = calculateActiveTickIndex(
    pos,
    orderedTooltipTicks!,
    tooltipTicks,
    tooltipAxisType,
    tooltipAxisRange,
  )

  const activeCoordinate = getActiveCoordinate(layout, tooltipTicks, activeIndex, rangeObj)

  return { activeIndex: String(activeIndex), activeCoordinate }
}
