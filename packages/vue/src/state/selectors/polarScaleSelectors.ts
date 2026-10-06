import { combineAxisTicks } from '@/core/axis/ticks'
import { createSelector } from '../createSelector'
import type { RechartsRootState } from '../chartState'
import type { AxisId } from '../chartCartesianAxis'
import {
  combineCategoricalDomain,
  combineGraphicalItemTicks,
  combineScaleFunction,
  selectAxisSettings,
  selectDuplicateDomain,
  selectRealScaleType,
} from './axisSelectors'
import {
  selectAngleAxis,
  selectAngleAxisRangeWithReversed,
  selectRadiusAxis,
  selectRadiusAxisRangeWithReversed,
} from './polarAxisSelectors'
import {
  selectPolarAppliedValues,
  selectPolarAxisDomainIncludingNiceTicks,
  selectPolarNiceTicks,
} from './polarSelectors'
import { pickAxisType } from './pickAxisType'
import type { RechartsScale } from '@/types/scale'
import type { CartesianTickItem } from '@/types/tick'
import { selectChartLayout } from '@/state/selectors/common'

export function selectPolarAxis(state: RechartsRootState, axisType: 'angleAxis' | 'radiusAxis', axisId: AxisId) {
  switch (axisType) {
    case 'angleAxis': {
      return selectAngleAxis(state, axisId)
    }
    case 'radiusAxis': {
      return selectRadiusAxis(state, axisId)
    }
    default: {
      throw new Error(`Unexpected axis type: ${axisType}`)
    }
  }
}

function selectPolarAxisRangeWithReversed(state: RechartsRootState, axisType: 'angleAxis' | 'radiusAxis', axisId: AxisId) {
  switch (axisType) {
    case 'angleAxis': {
      return selectAngleAxisRangeWithReversed(state, axisId)
    }
    case 'radiusAxis': {
      return selectRadiusAxisRangeWithReversed(state, axisId)
    }
    default: {
      throw new Error(`Unexpected axis type: ${axisType}`)
    }
  }
}

export const selectPolarAxisScale: (
  state: RechartsRootState,
  axisType: 'angleAxis' | 'radiusAxis',
  polarAxisId: AxisId,
) => RechartsScale | undefined = createSelector(
  [selectPolarAxis, selectRealScaleType, selectPolarAxisDomainIncludingNiceTicks, selectPolarAxisRangeWithReversed],
  combineScaleFunction,
)

export const selectPolarCategoricalDomain: (
  state: RechartsRootState,
  axisType: 'angleAxis' | 'radiusAxis',
  polarAxisId: AxisId,
) => ReadonlyArray<unknown> | undefined = createSelector(
  [selectChartLayout, selectPolarAppliedValues, selectAxisSettings, pickAxisType],
  combineCategoricalDomain,
)

export const selectPolarAxisTicks: (
  state: RechartsRootState,
  axisType: 'angleAxis' | 'radiusAxis',
  polarAxisId: AxisId,
) => ReadonlyArray<CartesianTickItem> | undefined = createSelector(
  [
    selectChartLayout,
    selectPolarAxis,
    selectRealScaleType,
    selectPolarAxisScale,
    selectPolarNiceTicks,
    selectPolarAxisRangeWithReversed,
    selectDuplicateDomain,
    selectPolarCategoricalDomain,
    pickAxisType,
  ],
  combineAxisTicks,
)

export const selectPolarGraphicalItemAxisTicks: (
  state: RechartsRootState,
  axisType: 'angleAxis' | 'radiusAxis',
  polarAxisId: AxisId,
) => ReadonlyArray<CartesianTickItem> | null = createSelector(
  [
    selectChartLayout,
    selectPolarAxis,
    selectPolarAxisScale,
    selectPolarAxisRangeWithReversed,
    selectDuplicateDomain,
    selectPolarCategoricalDomain,
    pickAxisType,
  ],
  combineGraphicalItemTicks,
)
