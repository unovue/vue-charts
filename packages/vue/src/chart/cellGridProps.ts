import type { PropType } from 'vue'
import type { ChartTransition } from '@/animation/motion'

/** Props every cell chart passes straight through to the layer. */
export const cellGridSharedProps = {
  activeIndex: { type: Number as PropType<number | null>, default: undefined },
  /** Corner radius of each cell in px; capped at half the cell's shorter side. */
  radius: { type: Number, default: 2 },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
}
