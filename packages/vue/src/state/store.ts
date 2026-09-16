import type { Action, Dispatch, Store } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { optionsReducer } from './optionsSlice'
import { tooltipReducer } from './tooltipSlice'
import { chartDataReducer } from './chartDataSlice'
import { chartLayoutReducer } from './layoutSlice'
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
  layout: chartLayoutReducer,
  legend: legendReducer,
  options: optionsReducer,
  polarAxis: polarAxisReducer,
  polarOptions: polarOptionsReducer,
  referenceElements: referenceElementsReducer,
  rootProps: rootPropsReducer,
  tooltip: tooltipReducer,
})

export function createRechartsStore(preloadedState?: Partial<RechartsRootState>, chartName: string = 'Chart'): Store<RechartsRootState> {
  return configureStore<RechartsRootState>({
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

export type RechartsRootState = ReturnType<typeof rootReducer>
export type AppDispatch = Dispatch<Action>
