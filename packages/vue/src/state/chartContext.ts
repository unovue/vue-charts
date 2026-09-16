import { computed, inject, provide, shallowRef, watchSyncEffect } from 'vue'
import type { InjectionKey, ShallowRef } from 'vue'
import type { AppDispatch, RechartsRootState } from './store'

interface ChartStore {
  getState: () => RechartsRootState
  dispatch: AppDispatch
  subscribe: (listener: () => void) => () => void
}

interface ChartContext {
  state: Readonly<ShallowRef<RechartsRootState>>
  dispatch: AppDispatch
}

const chartContextKey: InjectionKey<ChartContext> = Symbol('chart-state')

export function provideChartContext(store: ChartStore) {
  const state = shallowRef(store.getState())
  watchSyncEffect((onCleanup) => {
    onCleanup(store.subscribe(() => {
      state.value = store.getState()
    }))
  })
  provide(chartContextKey, { state, dispatch: store.dispatch })
}

function useChartContext() {
  const context = inject(chartContextKey)
  if (!context) {
    throw new Error('Chart state must be used inside a chart component.')
  }
  return context
}

export function useAppDispatch() {
  return useChartContext().dispatch
}

export function useAppSelector<Selected>(selector: (state: RechartsRootState) => Selected) {
  const { state } = useChartContext()
  return computed(() => selector(state.value))
}
