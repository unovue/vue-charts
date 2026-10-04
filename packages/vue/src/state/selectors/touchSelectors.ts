import { createSelector } from '@reduxjs/toolkit'
import type { RechartsRootState } from '../store'
import type { TooltipIndex, TooltipPayloadConfiguration, TooltipPayloadSearcher } from '../chartTooltip'
import { selectTooltipPayloadSearcher } from './selectTooltipPayloadSearcher'
import { selectTooltipState } from './selectTooltipState'
import type { Coordinate, DataKey } from '@/types'

const selectAllTooltipPayloadConfiguration: (state: RechartsRootState) => ReadonlyArray<TooltipPayloadConfiguration>
  = createSelector([selectTooltipState], tooltipState => tooltipState.tooltipItemPayloads)

export const selectTooltipCoordinate: (
  state: RechartsRootState,
  tooltipIndex: TooltipIndex,
  dataKey: DataKey<any> | undefined,
) => Coordinate | undefined = createSelector(
  [
    selectAllTooltipPayloadConfiguration,
    selectTooltipPayloadSearcher,
    (_state: RechartsRootState, tooltipIndex: TooltipIndex, _dataKey: DataKey<any> | undefined): TooltipIndex =>
      tooltipIndex,
    (
      _state: RechartsRootState,
      _tooltipIndex: TooltipIndex,
      dataKey: DataKey<any> | undefined,
    ): DataKey<any> | undefined => dataKey,
  ],
  (
    allTooltipConfigurations: ReadonlyArray<TooltipPayloadConfiguration>,
    tooltipPayloadSearcher: TooltipPayloadSearcher | undefined,
    tooltipIndex: TooltipIndex,
    dataKey,
  ): Coordinate | undefined => {
    const mostRelevantTooltipConfiguration = allTooltipConfigurations.find((tooltipConfiguration) => {
      return tooltipConfiguration.settings.dataKey === dataKey
    })
    if (mostRelevantTooltipConfiguration == null) {
      return undefined
    }
    const { positions } = mostRelevantTooltipConfiguration
    if (positions == null) {
      return undefined
    }
    const maybePosition: Coordinate | undefined = tooltipPayloadSearcher?.(positions, tooltipIndex)
    return maybePosition
  },
)
