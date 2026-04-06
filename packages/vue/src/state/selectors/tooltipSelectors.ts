import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import type {
  AppliedChartDataWithErrorDomain,
  AxisRange,
  AxisWithTicksSettings,
  StackGroup,
  XorYType,
} from './axisSelectors'
import {
  combineAppliedNumericalValuesIncludingErrorValues,
  combineAppliedValues,
  combineAreasDomain,
  combineAxisDomain,
  combineAxisDomainWithNiceTicks,
  combineCategoricalDomain,
  combineDisplayedData,
  combineDomainOfStackGroups,
  combineDotsDomain,
  combineDuplicateDomain,
  combineGraphicalItemsData,
  combineGraphicalItemsSettings,
  combineLinesDomain,
  combineNiceTicks,
  combineNumericalDomain,
  combineRealScaleType,
  combineScaleFunction,
  combineStackGroups,
  filterGraphicalNotStackedItems,
  filterReferenceElements,
  getDomainDefinition,
  itemAxisPredicate,
  mergeDomains,
  selectAxisRange,
  selectAxisSettings,
  selectHasBar,
  selectReferenceAreas,
  selectReferenceDots,
  selectReferenceLines,
} from './axisSelectors'
import type { AxisId } from '../cartesianAxisSlice'
import type { AppliedChartData, ChartData, ChartDataState } from '../chartDataSlice'
import { selectChartDataWithIndexes } from './dataSelectors'
import type { GraphicalItemSettings } from '../graphicalItemsSlice'
import type { ReferenceAreaSettings, ReferenceDotSettings, ReferenceLineSettings } from '../referenceElementsSlice'
import { selectChartName, selectStackOffsetType } from './rootPropsSelectors'
// import { mathSign } from '../../util/DataUtils'
import { combineAxisRangeWithReverse } from './combiners/combineAxisRangeWithReverse'
import type { TooltipEntrySettings, TooltipIndex, TooltipInteractionState, TooltipPayload, TooltipPayloadConfiguration, TooltipPayloadEntry, TooltipPayloadSearcher, TooltipSettingsState } from '../tooltipSlice'

import {
  combineTooltipEventType,
  selectDefaultTooltipEventType,
  selectValidateTooltipEventTypes,
} from './selectTooltipEventType'

import { combineActiveLabel } from './combiners/combineActiveLabel'

import { selectTooltipSettings } from './selectTooltipSettings'

import { combineTooltipInteractionState } from './combiners/combineTooltipInteractionState'
import { combineActiveTooltipIndex } from './combiners/combineActiveTooltipIndex'
import { combineCoordinateForDefaultIndex } from './combiners/combineCoordinateForDefaultIndex'
import { selectChartHeight, selectChartWidth } from './containerSelectors'
import { selectChartOffset } from './selectChartOffset'
import { combineTooltipPayloadConfigurations } from './combiners/combineTooltipPayloadConfigurations'
import { selectTooltipPayloadSearcher } from './selectTooltipPayloadSearcher'
import { selectTooltipState } from './selectTooltipState'
import type { AxisDomain, NumberDomain } from '@/types/axis'
import type { StackId } from '@/types/tick'
import type { CategoricalDomain, Coordinate, DataKey, LayoutType, TickItem, TooltipEventType } from '@/types'
import type { RechartsScale } from '@/types/scale'
import { isCategoricalAxis } from '@/utils'
import { findEntryInArray, mathSign } from '@/utils/data'
import { selectChartLayout } from '@/state/selectors/common'
import { getTooltipEntry, getValueByDataKey } from '@/utils/chart'
import type { BaseAxisProps } from '@/cartesian/axis/type'

function getSliced<T>(
  arr: unknown | ReadonlyArray<T>,
  startIndex: number,
  endIndex: number,
): ReadonlyArray<T> | unknown {
  if (!Array.isArray(arr)) {
    return arr
  }
  if (arr && startIndex + endIndex !== 0) {
    return arr.slice(startIndex, endIndex + 1)
  }
  return arr
}
function selectFinalData(dataDefinedOnItem: unknown, dataDefinedOnChart: ReadonlyArray<unknown>) {
  /*
   * If a payload has data specified directly from the graphical item, prefer that.
   * Otherwise, fill in data from the chart level, using the same index.
   */
  if (dataDefinedOnItem != null) {
    return dataDefinedOnItem
  }
  return dataDefinedOnChart
}

export function combineTooltipPayload(tooltipPayloadConfigurations: ReadonlyArray<TooltipPayloadConfiguration>, activeIndex: TooltipIndex, chartDataState: ChartDataState, tooltipAxis: BaseAxisProps | undefined, activeLabel: string | undefined, tooltipPayloadSearcher: TooltipPayloadSearcher | undefined, tooltipEventType: TooltipEventType): TooltipPayload | undefined {
  if (activeIndex == null || tooltipPayloadSearcher == null) {
    return undefined
  }
  const { chartData, computedData, dataStartIndex, dataEndIndex } = chartDataState

  const init: Array<TooltipPayloadEntry> = []

  return tooltipPayloadConfigurations.reduce((agg, { dataDefinedOnItem, settings }): Array<TooltipPayloadEntry> => {
    const finalData = selectFinalData(dataDefinedOnItem, chartData!)

    const sliced = getSliced(finalData, dataStartIndex, dataEndIndex)

    const finalDataKey: DataKey<any> | undefined = settings?.dataKey ?? tooltipAxis?.dataKey
    // BaseAxisProps does not support nameKey but it could!
    const finalNameKey: DataKey<any> | undefined = settings?.nameKey // ?? tooltipAxis?.nameKey;
    let tooltipPayload: unknown
    if (
      tooltipAxis?.dataKey
      && !tooltipAxis?.allowDuplicatedCategory
      && Array.isArray(sliced)
      && activeLabel != null
      /*
       * If the tooltipEventType is 'axis', we should search for the dataKey in the sliced data
       * because thanks to allowDuplicatedCategory=false, the order of elements in the array
       * no longer matches the order of elements in the original data
       * and so we need to search by the active dataKey + label rather than by index.
       *
       * On the other hand the tooltipEventType 'item' should always search by index
       * because we get the index from interacting over the individual elements
       * which is always accurate, irrespective of the allowDuplicatedCategory setting.
       */
      && tooltipEventType === 'axis'
    ) {
      tooltipPayload = findEntryInArray(sliced, tooltipAxis.dataKey, activeLabel)
    }
    // Fall back to index-based search if findEntryInArray didn't find a match
    // (e.g. scatter tooltip data where items are TooltipPayloadEntry arrays, not raw data objects)
    if (tooltipPayload == null) {
      tooltipPayload = tooltipPayloadSearcher(sliced, activeIndex, computedData, finalNameKey)
    }

    if (Array.isArray(tooltipPayload)) {
      tooltipPayload.forEach((item) => {
        const newSettings: TooltipEntrySettings = {
          ...settings,
          name: item.name,
          unit: item.unit,
          color: undefined,
          fill: undefined,
        }
        agg.push(
          getTooltipEntry({
            tooltipEntrySettings: newSettings,
            dataKey: item.dataKey,
            payload: item.payload,
            value: getValueByDataKey(item.payload, item.dataKey),
            name: item.name,
          }),
        )
      })
    }
    else {
      // I am not quite sure why these two branches (Array vs Array of Arrays) have to behave differently - I imagine we should unify these. 3.x breaking change?
      agg.push(
        getTooltipEntry({
          tooltipEntrySettings: settings,
          dataKey: finalDataKey!,
          payload: tooltipPayload,
          value: getValueByDataKey(tooltipPayload, finalDataKey),
          name: getValueByDataKey(tooltipPayload, finalNameKey) ?? settings?.name,
        }),
      )
    }
    return agg
  }, init)
}

export function selectTooltipAxisType(state: RechartsRootState): XorYType {
  const layout = selectChartLayout(state)

  if (layout === 'horizontal') {
    return 'xAxis'
  }

  if (layout === 'vertical') {
    return 'yAxis'
  }

  if (layout === 'centric') {
    return 'angleAxis'
  }

  return 'radiusAxis'
}

export const selectTooltipAxisId = (state: RechartsRootState): AxisId => state.tooltip.settings.axisId

export function selectTooltipAxis(state: RechartsRootState): AxisWithTicksSettings {
  const axisType = selectTooltipAxisType(state)
  const axisId = selectTooltipAxisId(state)
  return selectAxisSettings(state, axisType, axisId)
}

export const selectTooltipAxisRealScaleType = createSelector(
  [selectTooltipAxis, selectHasBar, selectChartName],
  combineRealScaleType,
)

export const selectAllUnfilteredGraphicalItems: (state: RechartsRootState) => ReadonlyArray<GraphicalItemSettings>
  = createSelector(
    [
      (state: RechartsRootState) => state.graphicalItems.cartesianItems,
      (state: RechartsRootState) => state.graphicalItems.polarItems,
    ],
    (cartesianItems, polarItems) => [...cartesianItems, ...polarItems],
  )

const selectTooltipAxisPredicate = createSelector(
  [selectTooltipAxisType, selectTooltipAxisId],
  itemAxisPredicate,
)

export const selectAllGraphicalItemsSettings = createSelector(
  [selectAllUnfilteredGraphicalItems, selectTooltipAxis, selectTooltipAxisPredicate],
  combineGraphicalItemsSettings,
)

export const selectTooltipGraphicalItemsData = createSelector(
  [selectAllGraphicalItemsSettings],
  combineGraphicalItemsData,
)

/**
 * Data for tooltip always use the data with indexes set by a Brush,
 * and never accept the isPanorama flag:
 * because Tooltip never displays inside the panorama anyway
 * so we don't need to worry what would happen there.
 */
export const selectTooltipDisplayedData: (state: RechartsRootState) => ChartData = createSelector(
  [selectTooltipGraphicalItemsData, selectChartDataWithIndexes],
  combineDisplayedData,
)

const selectAllTooltipAppliedValues: (state: RechartsRootState) => AppliedChartData = createSelector(
  [selectTooltipDisplayedData, selectTooltipAxis, selectAllGraphicalItemsSettings],
  combineAppliedValues,
)

const selectTooltipAxisDomainDefinition: (state: RechartsRootState) => AxisDomain | undefined = createSelector(
  [selectTooltipAxis],
  getDomainDefinition,
)

const selectTooltipStackGroups: (state: RechartsRootState) => Record<StackId, StackGroup> = createSelector(
  [selectTooltipDisplayedData, selectAllGraphicalItemsSettings, selectStackOffsetType],
  combineStackGroups,
)

const selectTooltipDomainOfStackGroups: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [selectTooltipStackGroups, selectChartDataWithIndexes, selectTooltipAxisType],
  combineDomainOfStackGroups,
)

const selectTooltipItemsSettingsExceptStacked: (state: RechartsRootState) => ReadonlyArray<GraphicalItemSettings>
  = createSelector([selectAllGraphicalItemsSettings], filterGraphicalNotStackedItems)

const selectTooltipAllAppliedNumericalValuesIncludingErrorValues: (
  state: RechartsRootState,
) => ReadonlyArray<AppliedChartDataWithErrorDomain> = createSelector(
  [selectTooltipDisplayedData, selectTooltipAxis, selectTooltipItemsSettingsExceptStacked, selectTooltipAxisType],
  combineAppliedNumericalValuesIncludingErrorValues,
)

const selectReferenceDotsByTooltipAxis: (state: RechartsRootState) => ReadonlyArray<ReferenceDotSettings> | undefined
  = createSelector([selectReferenceDots, selectTooltipAxisType, selectTooltipAxisId], filterReferenceElements)

const selectTooltipReferenceDotsDomain: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [selectReferenceDotsByTooltipAxis, selectTooltipAxisType],
  combineDotsDomain,
)

const selectReferenceAreasByTooltipAxis: (
  state: RechartsRootState,
) => ReadonlyArray<ReferenceAreaSettings> | undefined = createSelector(
  [selectReferenceAreas, selectTooltipAxisType, selectTooltipAxisId],
  filterReferenceElements,
)

const selectTooltipReferenceAreasDomain: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [selectReferenceAreasByTooltipAxis, selectTooltipAxisType],
  combineAreasDomain,
)

const selectReferenceLinesByTooltipAxis: (
  state: RechartsRootState,
) => ReadonlyArray<ReferenceLineSettings> | undefined = createSelector(
  [selectReferenceLines, selectTooltipAxisType, selectTooltipAxisId],
  filterReferenceElements,
)

const selectTooltipReferenceLinesDomain: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [selectReferenceLinesByTooltipAxis, selectTooltipAxisType],
  combineLinesDomain,
)

const selectTooltipReferenceElementsDomain: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [selectTooltipReferenceDotsDomain, selectTooltipReferenceLinesDomain, selectTooltipReferenceAreasDomain],
  mergeDomains,
)

const selectTooltipNumericalDomain: (state: RechartsRootState) => NumberDomain | undefined = createSelector(
  [
    selectTooltipAxis,
    selectTooltipAxisDomainDefinition,
    selectTooltipDomainOfStackGroups,
    selectTooltipAllAppliedNumericalValuesIncludingErrorValues,
    selectTooltipReferenceElementsDomain,
  ],
  combineNumericalDomain,
)

export const selectTooltipAxisDomain: (state: RechartsRootState) => NumberDomain | CategoricalDomain | undefined
  = createSelector(
    [
      selectTooltipAxis,
      selectChartLayout,
      selectTooltipDisplayedData,
      selectAllTooltipAppliedValues,
      selectStackOffsetType,
      selectTooltipAxisType,
      selectTooltipNumericalDomain,
    ],
    combineAxisDomain,
  )

const selectTooltipNiceTicks: (state: RechartsRootState) => ReadonlyArray<number> | undefined = createSelector(
  [selectTooltipAxisDomain, selectTooltipAxis, selectTooltipAxisRealScaleType],
  combineNiceTicks,
)

export const selectTooltipAxisDomainIncludingNiceTicks: (
  state: RechartsRootState,
) => NumberDomain | CategoricalDomain | undefined = createSelector(
  [selectTooltipAxis, selectTooltipAxisDomain, selectTooltipNiceTicks, selectTooltipAxisType],
  combineAxisDomainWithNiceTicks,
)

function selectTooltipAxisRange(state: RechartsRootState): AxisRange | undefined {
  const axisType = selectTooltipAxisType(state)
  const axisId = selectTooltipAxisId(state)
  const isPanorama = false // Tooltip never displays in panorama so this is safe to assume
  return selectAxisRange(state, axisType, axisId, isPanorama)
}

export const selectTooltipAxisRangeWithReverse = createSelector(
  [selectTooltipAxis, selectTooltipAxisRange],
  combineAxisRangeWithReverse,
)

export const selectTooltipAxisScale: (state: RechartsRootState) => RechartsScale | undefined = createSelector(
  [
    selectTooltipAxis,
    selectTooltipAxisRealScaleType,
    selectTooltipAxisDomainIncludingNiceTicks,
    selectTooltipAxisRangeWithReverse,
  ],
  combineScaleFunction,
)

const selectTooltipDuplicateDomain: (state: RechartsRootState) => ReadonlyArray<unknown> | undefined = createSelector(
  [selectChartLayout, selectAllTooltipAppliedValues, selectTooltipAxis, selectTooltipAxisType],
  combineDuplicateDomain,
)

export const selectTooltipCategoricalDomain: (state: RechartsRootState) => ReadonlyArray<unknown> | undefined
  = createSelector(
    [selectChartLayout, selectAllTooltipAppliedValues, selectTooltipAxis, selectTooltipAxisType],
    combineCategoricalDomain,
  )

function combineTicksOfTooltipAxis(layout: LayoutType, axis: AxisWithTicksSettings, realScaleType: string | undefined, scale: RechartsScale | undefined, range: AxisRange | undefined, duplicateDomain: ReadonlyArray<unknown> | undefined, categoricalDomain: ReadonlyArray<unknown> | undefined, axisType: XorYType): ReadonlyArray<TickItem> | null {
  if (!axis) {
    return null
  }
  const { type } = axis

  const isCategorical = isCategoricalAxis(layout, axisType)

  if (!scale) {
    return null
  }

  const offsetForBand = realScaleType === 'scaleBand' && scale.bandwidth ? scale.bandwidth() / 2 : 2
  let offset = type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0

  offset
    = axisType === 'angleAxis' && range != null && range?.length >= 2
      ? mathSign(range[0] - range[1]) * 2 * offset
      : offset

  // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
  if (isCategorical && categoricalDomain) {
    return categoricalDomain.map(
      (entry: any, index: number): TickItem => ({
        coordinate: scale(entry) + offset,
        value: entry,
        index,
        offset,
      }),
    )
  }

  // When axis has duplicated text, serial numbers are used to generate scale
  return scale.domain().map(
    (entry: any, index: number): TickItem => ({
      coordinate: scale(entry) + offset,
      value: duplicateDomain ? duplicateDomain[entry] : entry,
      index,
      offset,
    }),
  )
}

export const selectTooltipAxisTicks = createSelector(
  [
    selectChartLayout,
    selectTooltipAxis,
    selectTooltipAxisRealScaleType,
    selectTooltipAxisScale,
    selectTooltipAxisRange,
    selectTooltipDuplicateDomain,
    selectTooltipCategoricalDomain,
    selectTooltipAxisType,
  ],
  combineTicksOfTooltipAxis,
)!

const selectTooltipEventType: (state: RechartsRootState) => TooltipEventType | undefined = createSelector(
  [selectDefaultTooltipEventType, selectValidateTooltipEventTypes, selectTooltipSettings],
  (defaultTooltipEventType, validateTooltipEventType, settings: TooltipSettingsState) =>
    combineTooltipEventType(settings.shared, defaultTooltipEventType, validateTooltipEventType),
)

const selectTooltipTrigger = (state: RechartsRootState) => state.tooltip.settings.trigger

const selectDefaultIndex: (state: RechartsRootState) => TooltipIndex | undefined = state =>
  state.tooltip.settings.defaultIndex

const selectTooltipInteractionState: (state: RechartsRootState) => TooltipInteractionState | undefined = createSelector(
  [selectTooltipState, selectTooltipEventType, selectTooltipTrigger, selectDefaultIndex],
  combineTooltipInteractionState,
)

const selectTooltipAxisDataKey = createSelector(
  [selectTooltipAxis],
  (axis: AxisWithTicksSettings | undefined) => axis?.dataKey,
)

export const selectActiveTooltipIndex: (state: RechartsRootState) => TooltipIndex | null = createSelector(
  [selectTooltipInteractionState, selectTooltipDisplayedData, selectTooltipAxisDataKey, selectTooltipAxisDomain],
  combineActiveTooltipIndex,
)

export const selectActiveLabel: (state: RechartsRootState) => string | number | undefined = createSelector(
  [selectTooltipAxisTicks, selectActiveTooltipIndex],
  combineActiveLabel,
)

export const selectActiveTooltipDataKey: (state: RechartsRootState) => DataKey<any> | undefined = createSelector(
  [selectTooltipInteractionState],
  (tooltipInteraction: TooltipInteractionState): DataKey<any> | undefined => {
    if (!tooltipInteraction) {
      return undefined
    }

    return tooltipInteraction.dataKey
  },
)

const selectTooltipPayloadConfigurations = createSelector(
  [selectTooltipState, selectTooltipEventType, selectTooltipTrigger, selectDefaultIndex],
  combineTooltipPayloadConfigurations,
)

const selectTooltipCoordinateForDefaultIndex: (state: RechartsRootState) => Coordinate | undefined = createSelector(
  [
    selectChartWidth,
    selectChartHeight,
    selectChartLayout,
    selectChartOffset,
    selectTooltipAxisTicks,
    selectDefaultIndex,
    selectTooltipPayloadConfigurations,
    selectTooltipPayloadSearcher,
  ],
  combineCoordinateForDefaultIndex,
)

export const selectActiveTooltipCoordinate: (state: RechartsRootState) => Coordinate | undefined = createSelector(
  [selectTooltipInteractionState, selectTooltipCoordinateForDefaultIndex],
  (tooltipInteractionState: TooltipInteractionState, defaultIndexCoordinate: Coordinate | undefined): Coordinate | undefined => {
    return tooltipInteractionState.coordinate ?? defaultIndexCoordinate
  },
)
// @ts-ignore
export const selectIsTooltipActive: (state: RechartsRootState) => boolean = createSelector(
  [selectTooltipInteractionState],
  (tooltipInteractionState: TooltipInteractionState) => tooltipInteractionState.active,
)

// @ts-ignore
export const selectActiveTooltipPayload: (state: RechartsRootState) => TooltipPayload | undefined = createSelector(
  [
    selectTooltipPayloadConfigurations,
    selectActiveTooltipIndex,
    selectChartDataWithIndexes,
    selectTooltipAxis,
    selectActiveLabel,
    selectTooltipPayloadSearcher,
    selectTooltipEventType,
  ],
  combineTooltipPayload,
)
export const selectActiveTooltipDataPoints = createSelector([selectActiveTooltipPayload], (payload) => {
  if (payload == null) {
    return undefined
  }
  const dataPoints = payload.map(p => p.payload).filter(p => p != null) as TooltipPayloadEntry[]
  return Array.from(new Set(dataPoints))
})
