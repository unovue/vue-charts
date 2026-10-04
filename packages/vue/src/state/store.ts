import type { ReferenceElementState } from './chartReferenceElements'
import type { PolarAxisState } from './chartPolarAxis'
import type { PolarChartOptions } from './chartPolarOptions'
import type { UpdatableChartOptions } from './chartRootProps'
import type { ChartOptions } from './chartOptions'
import type { LegendState } from './chartLegend'
import type { BrushSettings } from './chartBrush'
import type { Action, Dispatch, Store } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import type { TooltipState } from './chartTooltip'
import type { ChartDataState } from './chartData'
import type { ChartLayoutState } from './chartLayout'
import { reduxDevtoolsJsonStringifyReplacer } from './reduxDevtoolsJsonStringifyReplacer'
import type { CartesianAxisState } from './chartCartesianAxis'
import type { GraphicalItemsState } from './chartGraphicalItems'

// Retained until the store bridge is removed in the next slice. No domains remain.
const rootReducer = (state: Record<string, never> = {}) => state

export function createRechartsStore(preloadedState?: Partial<LegacyChartState>, chartName: string = 'Chart'): Store<LegacyChartState> {
  return configureStore<LegacyChartState>({
    reducer: rootReducer,
    // redux-toolkit v1 types are unhappy with the preloadedState type. Remove the `as any` when bumping to v2
    preloadedState: preloadedState as any,
    // @ts-ignore
    middleware: getDefaultMiddleware =>
      // @ts-ignore
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
    devTools: {
      serialize: {
        replacer: reduxDevtoolsJsonStringifyReplacer,
      },
      name: `v-charts-${chartName}`,
    },
  })
}

export type LegacyChartState = ReturnType<typeof rootReducer>
export type RechartsRootState = {
  cartesianAxis: CartesianAxisState
  graphicalItems: GraphicalItemsState
  layout: ChartLayoutState
  chartData: ChartDataState
  tooltip: TooltipState
  brush: BrushSettings
  legend: LegendState
  options: ChartOptions
  rootProps: UpdatableChartOptions
  polarOptions: PolarChartOptions | null
  polarAxis: PolarAxisState
  referenceElements: ReferenceElementState
}
export type AppDispatch = Dispatch<Action>
