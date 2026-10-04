import { computed, shallowRef } from 'vue'
import type { StackOffsetType, SyncMethod, VueClassValue } from '@/types'

/**
 * These are chart options that users can choose - which means they can also
 * choose to change them which should trigger a re-render.
 */
export type UpdatableChartOptions = {
  accessibilityLayer: boolean
  barCategoryGap: number | string
  barGap: number | string
  barSize: string | number | undefined
  /**
   * Useful for debugging which chart is which when synchronising.
   * The className is also passed to the root element of the chart but that's done in the JSX, not through chart state.
   */
  class: VueClassValue | undefined
  maxBarSize: number | undefined
  stackOffset: StackOffsetType
  /**
   * Charts that share the same syncId will have their Tooltip and Brush synchronised.
   */
  syncId: number | string | undefined
  syncMethod: SyncMethod
}

export const initialState: UpdatableChartOptions = {
  accessibilityLayer: true,
  barCategoryGap: '10%',
  barGap: 4,
  barSize: undefined,
  class: undefined,
  maxBarSize: undefined,
  stackOffset: 'none',
  syncId: undefined,
  syncMethod: 'index',
}

export function createChartRootProps() {
  const state = shallowRef<UpdatableChartOptions>({ ...initialState })

  function updateOptions(options: UpdatableChartOptions) {
    const next = { ...options, barGap: options.barGap ?? initialState.barGap }
    const current = state.value
    if (current.accessibilityLayer === next.accessibilityLayer && current.barCategoryGap === next.barCategoryGap
      && current.barGap === next.barGap && current.barSize === next.barSize && current.class === next.class
      && current.maxBarSize === next.maxBarSize && current.stackOffset === next.stackOffset
      && current.syncId === next.syncId && current.syncMethod === next.syncMethod) {
      return
    }
    state.value = next
  }

  return { state: computed(() => state.value), updateOptions }
}
