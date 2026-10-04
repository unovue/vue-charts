import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import type { LegendSettings } from '../chartLegend'
import type { Size } from '@/types'
import type { LegendPayload } from '@/components/DefaultLegendContent'

export const selectLegendSettings = (state: RechartsRootState): LegendSettings => state.legend.settings

export const selectLegendSize = (state: RechartsRootState): Size => state.legend.size

function selectAllLegendPayload2DArray(state: RechartsRootState): ReadonlyArray<ReadonlyArray<LegendPayload>> {
  return state.legend.payload
}

export const selectLegendPayload: (state: RechartsRootState) => ReadonlyArray<LegendPayload> = createSelector(
  [selectAllLegendPayload2DArray],
  payloads => payloads.flat(1),
)
