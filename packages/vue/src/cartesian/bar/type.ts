import type { ChartData } from '@/state/chartData'
import type {
  Coordinate,
  DataKey,
  TooltipType,
  VuePropsToType,
  WithSVGProps,
} from '@/types'
import type { ChartTransition } from '@/animation/motion'
import type { AxisId } from '@/types/axis'
import type { PropType } from 'vue'
import type { LegendType } from '@/types/legend'
import type { MinPointSize } from '@/shape'
import { classProp } from '@/types'

export type Rectangle = {
  x: number | null
  y: number | null
  width: number
  height: number
}

export type BarRectangleItem = {
  value?: number | [number, number]
  background?: Rectangle
  tooltipPosition: Coordinate
  readonly payload?: any
  x: number | null
  y: number | null
  width: number
  height: number
}

export const BarVueProps = {
  class: classProp,
  barSize: { type: [String, Number] as PropType<string | number> },
  data: { type: Array as PropType<ChartData>, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<DataKey<any>>,
    required: true,
  },
  fill: { type: String, default: undefined },
  stroke: { type: String, default: undefined },
  strokeWidth: { type: Number, default: 0 },
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
    type: [Boolean, Object] as PropType<boolean | Record<string, any>>,
    default: false,
  },
  radius: {
    type: [Number, Array] as PropType<number | [number, number, number, number]>,
    default: undefined,
  },
  isAnimationActive: { type: Boolean, default: true },
  activeBar: { type: [Object, Boolean, Function] as PropType<Record<string, any> | boolean>, default: false },
  activeIndex: { type: Number, default: undefined },
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
    type: [Boolean, Object] as PropType<boolean | Record<string, any>>,
    default: false,
  },
}

export type BarProps = VuePropsToType<typeof BarVueProps>
export type BarPropsWithSVG = WithSVGProps<typeof BarVueProps>

export type BarSettings = {
  barSize?: string | number
  data?: ChartData
  dataKey: DataKey<any>
  maxBarSize?: number
  minPointSize: MinPointSize
  stackId?: string | number
}
