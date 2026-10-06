import type { LinePointItem } from '@/types/line'
import type { LabelListSlotProps } from '@/components/label/types'
import type { ExtractPropTypes, PropType, VNode, VNodeChild } from 'vue'
import type { ChartDataKey } from '@/types/base'
import type { TooltipType, VueClassValue, WithSVGProps } from '@/types'
import type { AxisId } from '@/types/axis'
import type { ValueAnimationTransition } from 'motion-v'
import type { LegendType } from '@/types/legend'
import type { CurveFactory } from 'd3-shape'
import type { CurveType } from '@/shape/Curve'
import { classProp } from '@/types'

export type { LinePointItem } from '@/types/line'

// Complete LineProps interface
export interface LineProps {
  activeDot?: unknown
  animateNewValues?: boolean
  class?: VueClassValue
  connectNulls?: boolean
  data?: unknown[]
  dataKey: ChartDataKey
  dot?: unknown
  hide?: boolean
  id?: string
  isAnimationActive?: boolean
  label?: unknown
  legendType?: LegendType
  name?: string | number
  stroke?: string
  strokeWidth?: number
  tooltipType?: TooltipType
  transition?: ValueAnimationTransition<number>
  type?: CurveType
  unit?: string | number
  xAxisId?: AxisId
  yAxisId?: AxisId
}

export const LineVueProps = {
  activeDot: { type: [Boolean, Object, Function], default: true },
  isAnimationActive: { type: Boolean, default: undefined },
  connectNulls: { type: Boolean, default: false },
  data: { type: Array, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<ChartDataKey>,
    required: true as const,
  },
  dot: { type: [Boolean, Object, Function], default: true },
  hide: { type: Boolean, default: false },
  label: { type: [Boolean, Object] },
  legendType: { type: String as PropType<LegendType>, default: 'line' },
  stroke: { type: String, default: undefined },
  strokeWidth: { type: Number, default: 1 },
  tooltipType: { type: String as PropType<TooltipType> },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  type: { type: [String, Function] as PropType<CurveType | CurveFactory> },
  unit: { type: [String, Number] },
  xAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  id: { type: String },
  name: { type: [String, Number] },
  class: classProp,
}

export type LinePropsWithSVG = WithSVGProps<typeof LineVueProps>

export type ResolvedLineProps = ExtractPropTypes<typeof LineVueProps>
type ActivePointSlotProps = {
  'index': number
  'dataKey': ChartDataKey
  'cx': number
  'cy': number
  'r': number
  'fill': string
  'stroke-width': number
  'stroke': string
  'payload': LinePointItem['payload']
  'value'?: number
}

export type ActivePointsSlots = {
  activeDot?: (props: ActivePointSlotProps) => VNodeChild
}

export type LineSlots = ActivePointsSlots & {
  default?: () => VNode[]
  shape?: (props: import('@/shape/Curve').CurveProps) => VNodeChild
  dot?: (props: { cx: number, cy: number, index: number, value?: number, payload?: unknown }) => VNodeChild
  label?: (props: LabelListSlotProps) => VNodeChild
}
