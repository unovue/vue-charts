import type { ChartDataKey } from '@/types/base'
import type { ChartData } from '@/types/chartData'
import type {
  TooltipType,
  VueClassValue,
  VuePropsToType,
} from '@/types'
import type { ValueAnimationTransition } from 'motion-v'
import type { BaseValue } from '@/types/area'
import type { AxisId } from '@/types/axis'
import type { LegendType } from '@/types/legend'
import type { ExtractPropTypes, PropType } from 'vue'
import { CurveVueProps } from '@/shape/Curve'
import { classProp } from '@/types'

export const AreaVueProps = {
  type: CurveVueProps.type,
  activeDot: { type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>, default: true },
  baseValue: {
    type: [Number, String] as PropType<BaseValue>,
    default: undefined,
  },
  connectNulls: { type: Boolean, default: false },
  data: { type: Array as PropType<ChartData>, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<ChartDataKey>,
    required: true as const,
  },
  dot: { type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>, default: false },
  fill: { type: String, default: undefined },
  fillOpacity: { type: Number, default: 0.6 },
  strokeWidth: { type: Number },
  stroke: { type: String, default: undefined },
  hide: { type: Boolean, default: false },
  isAnimationActive: { type: Boolean, default: undefined },
  /**
   * Label for each data point.
   * - boolean: true for default label rendering
   * - object: config object for label style/behavior
   * - function: custom render function
   * - VNode: custom Vue element
   */
  label: {
    type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
    default: undefined,
  },
  legendType: { type: String as PropType<LegendType>, default: 'line' },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  stackId: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  unit: {
    type: [String, Number] as PropType<string | number>,
    default: undefined,
  },
  xAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<AxisId>, default: 0 },
  id: { type: String, default: undefined },
  name: { type: [String, Number] as PropType<string | number> },
  class: classProp,
}

/** Resolved Area props inside the library; the public `AreaProps` is derived from the component. */
export type AreaInput = VuePropsToType<typeof AreaVueProps>

export interface AreaDotSlotProps {
  cx: number
  cy: number
  r: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  fillOpacity?: number
  clipDot?: boolean
  class?: VueClassValue
}

export type ResolvedAreaProps = ExtractPropTypes<typeof AreaVueProps>
