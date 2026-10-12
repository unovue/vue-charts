import type { SVGAttributes } from 'vue'
import { defineComponent } from 'vue'
import { forwardsSvgAttributes } from '@/utils/attributes'

/**
 * Cell is a marker component used to define per-item colors and styles.
 * It renders nothing — parent components (Bar, Pie, etc.) read Cell
 * children from the default slot and apply their props by index.
 *
 * Usage:
 * ```vue
 * <Bar data-key="value">
 *   <Cell v-for="(entry, index) in data" :key="index" :fill="COLORS[index]" />
 * </Bar>
 * ```
 */
export const Cell = forwardsSvgAttributes(defineComponent({
  name: 'Cell',
  inheritAttrs: false,
  setup() {
    return () => null
  },
}))

export type CellProps = SVGAttributes & {
  fill?: string
  stroke?: string
}
