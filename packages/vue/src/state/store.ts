import type { Action, Dispatch, Store } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { optionsReducer } from './optionsSlice'
import { tooltipReducer } from './tooltipSlice'
import { chartDataReducer } from './chartDataSlice'
import type { ChartLayoutState } from './chartLayout'
import { reduxDevtoolsJsonStringifyReplacer } from './reduxDevtoolsJsonStringifyReplacer'
import { cartesianAxisReducer } from './cartesianAxisSlice'
import { graphicalItemsReducer } from './graphicalItemsSlice'
import { referenceElementsReducer } from './referenceElementsSlice'
import { brushReducer } from './brushSlice'
import { legendReducer } from './legendSlice'
import { rootPropsReducer } from './rootPropsSlice'
import { polarAxisReducer } from './polarAxisSlice'
import { polarOptionsReducer } from './polarOptionsSlice'

const rootReducer = combineReducers({
  brush: brushReducer,
  cartesianAxis: cartesianAxisReducer,
  chartData: chartDataReducer,
  graphicalItems: graphicalItemsReducer,
  legend: legendReducer,
  options: optionsReducer,
  polarAxis: polarAxisReducer,
  polarOptions: polarOptionsReducer,
  referenceElements: referenceElementsReducer,
  rootProps: rootPropsReducer,
  tooltip: tooltipReducer,
})

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
export type RechartsRootState = LegacyChartState & { layout: ChartLayoutState }
export type AppDispatch = Dispatch<Action>
