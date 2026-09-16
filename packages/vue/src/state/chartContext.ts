import { computed, inject, provide, shallowRef, watchSyncEffect } from 'vue'
import type { InjectionKey, ShallowRef } from 'vue'
import type { AppDispatch, LegacyChartState, RechartsRootState } from './store'
import { createChartLayout } from './chartLayout'

interface ChartStore {
  getState: () => LegacyChartState
  dispatch: AppDispatch
  subscribe: (listener: () => void) => () => void
}

interface ChartContext {
  state: Readonly<ShallowRef<RechartsRootState>>
  dispatch: AppDispatch
  layout: ReturnType<typeof createChartLayout>
}

const chartContextKey: InjectionKey<ChartContext> = Symbol('chart-state')

export function provideChartContext(store: ChartStore, layout = createChartLayout()) {
  const legacyState = shallowRef(store.getState())
  watchSyncEffect((onCleanup) => {
    onCleanup(store.subscribe(() => {
      legacyState.value = store.getState()
    }))
  })
  const state = computed(() => ({ ...legacyState.value, layout: layout.state.value }))
  provide(chartContextKey, { state, dispatch: store.dispatch, layout })
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

export function useChartLayoutActions() {
  return useChartContext().layout
}

export function useAppSelector<Selected>(selector: (state: RechartsRootState) => Selected) {
  const { state } = useChartContext()
  return computed(() => selector(state.value))
}
