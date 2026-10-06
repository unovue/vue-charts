import type { ChartData } from '@/types/chartData'
import type {
  DataKey,
  TooltipType,
  VueClassValue,
  VuePropsToType,
  WithSVGProps,
} from '@/types'
import type { ValueAnimationTransition } from 'motion-dom'
import type { BaseValue } from '@/types/area'
import type { AxisId } from '@/types/axis'
import type { LegendType } from '@/types/legend'
import type { ExtractPropTypes, PropType } from 'vue'
import { CurveVueProps } from '@/shape/Curve'
import { classProp } from '@/types'

export const AreaVueProps = {
  ...CurveVueProps,
  activeDot: { type: Boolean, default: true },
  baseValue: {
    type: [Number, String] as PropType<BaseValue>,
    default: undefined,
  },
  connectNulls: { type: Boolean, default: false },
  data: { type: Array as PropType<ChartData>, default: undefined },
  dataKey: {
    type: [String, Number, Function] as PropType<DataKey<any>>,
    required: true as const,
  },
  dot: { type: Boolean, default: false },
  fill: { type: String, default: 'var(--v-charts-series, #3182bd)' },
  fillOpacity: { type: Number, default: 0.6 },
  strokeWidth: { type: Number },
  stroke: { type: String, default: 'var(--v-charts-series, #3182bd)' },
  hide: { type: Boolean, default: false },
  isAnimationActive: { type: Boolean, default: true },
  /**
   * Label for each data point.
   * - boolean: true for default label rendering
   * - object: config object for label style/behavior
   * - function: custom render function
   * - VNode: custom Vue element
   */
  label: {
    type: [Boolean, Object] as PropType<boolean | Record<string, any>>,
    default: undefined,
  },
  legendType: { type: String as PropType<LegendType>, default: 'line' },
  transition: {
    type: Object as PropType<ValueAnimationTransition<number>>,
    default: undefined,
  },
  needClip: { type: Boolean, default: false },
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
  activeIndex: { type: Number, default: undefined },
  activePoint: { type: Object as PropType<any>, default: undefined },
  id: { type: String, default: undefined },
  left: { type: Number, default: 0 },
  top: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  name: { type: [String, Number] as PropType<string | number> },
  class: classProp,
}

export type AreaProps = VuePropsToType<typeof AreaVueProps>
export type AreaPropsWithSVG = WithSVGProps<
  typeof AreaVueProps
>

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
