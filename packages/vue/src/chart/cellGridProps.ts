import type { PropType } from 'vue'
import { computed } from 'vue'
import type { ChartTransition } from '@/animation/motion'

/** Props every cell chart passes straight through to the layer. */
export const cellGridSharedProps = {
  activeIndex: { type: Number as PropType<number | null>, default: undefined },
  /** Corner radius of each cell in px; capped at half the cell's shorter side. */
  radius: { type: Number, default: 2 },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
}

/** How a standalone chart writes its numeric values in the tooltip and in accessible names. */
export const valueFormatProps = {
  /** Writes one value; receives the value and its cell, row or day. Defaults to the locale number format. */
  valueFormatter: { type: Function as PropType<(value: number, item: unknown) => string>, default: undefined },
  /** Locale for numbers and dates. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
}

/** The value text of `valueFormatProps`. Call during setup. */
export function useValueText<Item>(props: { valueFormatter?: (value: number, item: Item) => string, locale: string }) {
  const numbers = computed(() => new Intl.NumberFormat(props.locale))
  return (value: number, item: Item) => props.valueFormatter ? props.valueFormatter(value, item) : numbers.value.format(value)
}
