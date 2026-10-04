import type { DataKey, LayoutType, TooltipType, VueClassValue, VuePropsToType, WithSVGProps } from '@/types'
import type { AxisId } from '@/types/axis'
import type { AnimationOptions } from 'motion-v'
import type { LegendType } from '@/types/legend'
import type { CurveFactory } from 'd3-shape'
import type { CurveType, Point } from '@/shape/Curve'
import type { PropType } from 'vue'
import { CurveVueProps } from '@/shape/Curve'
import { classProp } from '@/types'

export interface LinePointItem extends Point {
  readonly value?: number
  readonly payload?: any
}

// Complete LineProps interface
export interface LineProps {
  activeDot?: any
  animateNewValues?: boolean
  animationId?: string
  class?: VueClassValue
  connectNulls?: boolean
  data?: any[]
  dataKey: DataKey<any>
  dot?: any
  hide?: boolean
  id?: string
  isAnimationActive?: boolean
  label?: any
  legendType?: LegendType
  layout?: LayoutType
  name?: string | number
  onAnimationEnd?: () => void
  onAnimationStart?: () => void
  stroke?: string
  strokeWidth?: number
  tooltipType?: TooltipType
  transition?: AnimationOptions
  type?: CurveType
  unit?: string | number
  xAxisId?: AxisId
  yAxisId?: AxisId
  needClip?: boolean
}

export const LineVueProps = {
  ...CurveVueProps,
  activeDot: { type: [Boolean, Object, Function], default: true },
  animationId: { type: String },
  isAnimationActive: { type: Boolean, default: true },
  connectNulls: { type: Boolean, default: false },
  data: { type: Array, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<DataKey<any>>,
    required: true,
  },
  dot: { type: [Boolean, Object, Function], default: true },
  hide: { type: Boolean, default: false },
  label: { type: [Boolean, Object] },
  legendType: { type: String as PropType<LegendType>, default: 'line' },
  onAnimationEnd: { type: Function },
  onAnimationStart: { type: Function },
  stroke: { type: String, default: 'var(--v-charts-series, #3182bd)' },
  strokeWidth: { type: Number, default: 1 },
  tooltipType: { type: String as PropType<TooltipType> },
  transition: {
    type: Object as PropType<AnimationOptions>,
    default: () => ({
      duration: 0.8,
      ease: 'easeOut',
    }),
  },
  type: { type: [String, Function] as PropType<CurveType | CurveFactory> },
  unit: { type: [String, Number] },
  xAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  needClip: { type: Boolean, default: false },
  id: { type: String },
  activeIndex: { type: Number },
  activePoint: { type: Object },
  left: { type: Number, default: 0 },
  top: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  name: { type: [String, Number] },
  class: classProp,
}

export type LinePropsInternal = VuePropsToType<typeof LineVueProps>
export type LinePropsWithSVG = WithSVGProps<typeof LineVueProps>
