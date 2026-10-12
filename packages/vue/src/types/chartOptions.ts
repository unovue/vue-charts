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
  /** Reverse the item order inside each stack, so the last stacked item sits at the base. */
  reverseStackOrder: boolean
  stackOffset: StackOffsetType
  /**
   * Charts that share the same syncId will have their Tooltip and Brush synchronised.
   */
  syncId: number | string | undefined
  syncMethod: SyncMethod
}
