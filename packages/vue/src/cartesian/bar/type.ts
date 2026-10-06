import type { BarRectangleItem } from '@/types/bar'
import type { LabelListSlotProps } from '@/components/label/types'
import type { ExtractPropTypes, PropType, VNode, VNodeChild } from 'vue'
import type { ChartDataKey } from '@/types/base'
import type { ChartData } from '@/types/chartData'
import type {
  TooltipType,
} from '@/types'
import type { ChartTransition } from '@/animation/motion'
import type { AxisId } from '@/types/axis'
import type { LegendType } from '@/types/legend'
import type { MinPointSize } from '@/shape'
import { classProp } from '@/types'

export const BarVueProps = {
  class: classProp,
  barSize: { type: [String, Number] as PropType<string | number> },
  data: { type: Array as PropType<ChartData>, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<ChartDataKey>,
    required: true as const,
  },
  fill: { type: String, default: undefined },
  stroke: { type: String, default: undefined },
  strokeWidth: { type: Number, default: undefined },
  unit: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  name: { type: [String, Number] as PropType<string | number> },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  legendType: { type: String as PropType<LegendType>, default: 'rect' },
  minPointSize: { type: [Number, Function] as PropType<MinPointSize>, default: 0 },
  maxBarSize: { type: Number },
  hide: { type: Boolean, default: false },
  background: {
    type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
    default: false,
  },
  radius: {
    type: [Number, Array] as PropType<number | [number, number, number, number]>,
    default: undefined,
  },
  isAnimationActive: { type: Boolean, default: true },
  activeBar: { type: [Object, Boolean, Function] as PropType<Record<string, unknown> | boolean>, default: false },
  activeIndex: { type: Number as PropType<number | null>, default: undefined },
  id: { type: String, default: undefined },
  stackId: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  xAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  /** Overrides the default motion (see animation/motion.ts). */
  transition: {
    type: Object as PropType<ChartTransition>,
    default: undefined,
  },
  needClip: { type: Boolean, default: false },
  label: {
    type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
    default: false,
  },
}

export type ResolvedBarProps = ExtractPropTypes<typeof BarVueProps>

export interface BarSlots {
  label?: (props: LabelListSlotProps) => VNodeChild
  default?: () => VNode[]
  shape?: (props: BarRectangleItem & { index: number, isActive: boolean }) => VNodeChild
  activeBar?: (props: BarRectangleItem & { index: number, isActive: boolean }) => VNodeChild
}
