import type { PropType, StyleValue } from 'vue'
import type { ChartDataKey } from '@/types/base'
import type { ChartData } from '@/types/chartData'
import type { LayoutType, Margin, StackOffsetType, SyncMethod } from '@/types'
import type { ChartTransition } from '@/animation/motion'
import { classProp } from '@/types'
import { chartDefaults } from '@/model/defaults'
import { chartSizeProps } from '@/hooks/useResponsiveSize'

export const commonChartProps = {
  accessibilityLayer: {
    type: Boolean,
    default: chartDefaults.accessibilityLayer,
  },
  class: classProp,
  compact: {
    type: Boolean,
  },
  data: {
    type: Array as PropType<ChartData>,
    default: () => [],
  },
  dataKey: {
    type: [String, Number, Function] as PropType<ChartDataKey>,
  },
  desc: {
    type: String,
  },
  id: {
    type: String,
  },
  layout: {
    type: String as PropType<LayoutType>,
    default: chartDefaults.layout,
  },
  margin: {
    type: Object as PropType<Margin>,
    default: () => ({ ...chartDefaults.margin }),
  },
  ...chartSizeProps,
  reverseStackOrder: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
  },
  stackOffset: {
    type: String as PropType<StackOffsetType>,
    default: chartDefaults.stackOffset,
  },
  style: {
    type: [String, Object, Array] as PropType<StyleValue>,
  },
  syncId: {
    type: [Number, String],
  },
  syncMethod: {
    type: [String, Function] as PropType<SyncMethod>,
    default: chartDefaults.syncMethod,
  },
  tabIndex: {
    type: Number,
  },
  title: {
    type: String,
  },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
}

const barChartProps = {
  barCategoryGap: {
    type: [Number, String],
    default: chartDefaults.barCategoryGap,
  },
  barGap: {
    type: [Number, String],
    default: chartDefaults.barGap,
  },
  barSize: {
    type: [Number, String],
  },
  maxBarSize: {
    type: Number,
  },
}

export const polarChartProps = {
  cx: {
    type: [Number, String],
  },
  cy: {
    type: [Number, String],
  },
  endAngle: {
    type: Number,
  },
  innerRadius: {
    type: [Number, String],
  },
  outerRadius: {
    type: [Number, String],
  },
  startAngle: {
    type: Number,
  },
}

export const cartesianChartProps = { ...commonChartProps, ...barChartProps }
export const radialChartProps = { ...commonChartProps, ...barChartProps, ...polarChartProps }
export const funnelChartProps = commonChartProps
