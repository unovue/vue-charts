import { createSelector } from '@reduxjs/toolkit'
import type { AppliedChartData, ChartData } from '../chartData'
import type { RechartsRootState } from '../store'
import type { AxisId, BaseCartesianAxis } from '../cartesianAxisSlice'
import { selectChartDataAndAlwaysIgnoreIndexes, selectChartDataWithIndexes } from './dataSelectors'
import type {
  AppliedChartDataWithErrorDomain,
} from './axisSelectors'
import {
  combineAppliedValues,
  combineAxisDomain,
  combineAxisDomainWithNiceTicks,
  combineDisplayedData,
  combineDomainOfStackGroups,
  combineGraphicalItemsData,
  combineGraphicalItemsSettings,
  combineNiceTicks,
  combineNumericalDomain,
  combineStackGroups,
  itemAxisPredicate,
  selectBaseAxis,
  selectDomainDefinition,
  selectRealScaleType,
} from './axisSelectors'
import type { PolarGraphicalItemSettings } from '../graphicalItemsSlice'
import { pickAxisType } from './pickAxisType'
import { pickAxisId } from './pickAxisId'
import { selectStackOffsetType } from './rootPropsSelectors'
import { getValueByDataKey } from '@/utils/chart'
import type { NumberDomain } from '@/types/axis'
import type { CategoricalDomain } from '@/types'
import type { StackId } from '@/types/tick'
import { selectChartLayout } from '@/state/selectors/common'

export type PolarAxisType = 'angleAxis' | 'radiusAxis'

export const selectUnfilteredPolarItems = (state: RechartsRootState) => state.graphicalItems.polarItems

const selectAxisPredicate: (
  _state: RechartsRootState,
  axisType: PolarAxisType,
  axisId: AxisId,
) => (item: PolarGraphicalItemSettings) => boolean = createSelector([pickAxisType, pickAxisId], itemAxisPredicate)

export const selectPolarItemsSettings: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  polarAxisId: AxisId,
  // @ts-ignore
) => ReadonlyArray<PolarGraphicalItemSettings> = createSelector(
  [selectUnfilteredPolarItems, selectBaseAxis, selectAxisPredicate],
  combineGraphicalItemsSettings,
)

const selectPolarGraphicalItemsData: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  polarAxisId: AxisId,
) => ChartData = createSelector([selectPolarItemsSettings], combineGraphicalItemsData)

export const selectPolarDisplayedData: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  polarAxisId: AxisId,
) => ChartData | undefined = createSelector(
  [selectPolarGraphicalItemsData, selectChartDataAndAlwaysIgnoreIndexes],
  combineDisplayedData,
)

export const selectPolarAppliedValues: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  axisId: AxisId,
  // @ts-ignore
) => AppliedChartData = createSelector(
  [selectPolarDisplayedData, selectBaseAxis, selectPolarItemsSettings],
  combineAppliedValues,
)

export const selectAllPolarAppliedNumericalValues: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  axisId: AxisId,
  // @ts-ignore
) => ReadonlyArray<AppliedChartDataWithErrorDomain> = createSelector(
  [selectPolarDisplayedData, selectBaseAxis, selectPolarItemsSettings],
  (
    data: ChartData,
    axisSettings: BaseCartesianAxis,
    items: ReadonlyArray<PolarGraphicalItemSettings>,
  ): ReadonlyArray<AppliedChartDataWithErrorDomain> => {
    if (items.length > 0) {
      return data
        .flatMap((entry) => {
          return items.flatMap((item): AppliedChartDataWithErrorDomain | undefined => {
            const valueByDataKey: unknown = getValueByDataKey(entry, axisSettings.dataKey ?? item.dataKey!)
            return {
              value: valueByDataKey,
              errorDomain: [], // polar charts do not have error bars
            }
          })
        })
        .filter(Boolean) as ReadonlyArray<AppliedChartDataWithErrorDomain>
    }
    if (axisSettings?.dataKey != null) {
      return data.map(
        (item): AppliedChartDataWithErrorDomain => ({
          value: getValueByDataKey(item, axisSettings.dataKey!),
          errorDomain: [],
        }),
      )
    }
    return data.map((entry): AppliedChartDataWithErrorDomain => ({ value: entry, errorDomain: [] }))
  },
)

const selectPolarStackGroups: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  axisId: AxisId,
) => Record<StackId, import('./axisSelectors').StackGroup> | undefined = createSelector(
  [selectPolarDisplayedData, selectPolarItemsSettings, selectStackOffsetType],
  combineStackGroups,
)

const selectPolarDomainOfStackGroups = createSelector(
  [selectPolarStackGroups, selectChartDataWithIndexes, pickAxisType],
  combineDomainOfStackGroups,
)

const unsupportedInPolarChart = (): undefined => undefined

const selectPolarNumericalDomain: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  axisId: AxisId,
) => NumberDomain | undefined = createSelector(
  [
    selectBaseAxis,
    selectDomainDefinition,
    selectPolarDomainOfStackGroups,
    selectAllPolarAppliedNumericalValues,
    unsupportedInPolarChart,
  ],
  combineNumericalDomain,
)

export const selectPolarAxisDomain: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  polarAxisId: AxisId,
) => NumberDomain | CategoricalDomain | undefined = createSelector(
  [
    selectBaseAxis,
    selectChartLayout,
    selectPolarDisplayedData,
    selectPolarAppliedValues,
    selectStackOffsetType,
    pickAxisType,
    selectPolarNumericalDomain,
  ],
  combineAxisDomain,
)

// @ts-ignore
export const selectPolarNiceTicks = createSelector(
  [selectPolarAxisDomain, selectBaseAxis, selectRealScaleType],
  combineNiceTicks,
)

export const selectPolarAxisDomainIncludingNiceTicks: (
  state: RechartsRootState,
  axisType: PolarAxisType,
  polarAxisId: AxisId,
) => NumberDomain | CategoricalDomain | undefined = createSelector(
  [selectBaseAxis, selectPolarAxisDomain, selectPolarNiceTicks, pickAxisType],
  combineAxisDomainWithNiceTicks,
)
