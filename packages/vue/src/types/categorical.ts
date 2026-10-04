import type { DataKey, LayoutType, Margin, StackOffsetType, SyncMethod, VueClassValue } from './common'

export interface CategoricalChartProps {
  accessibilityLayer?: boolean
  barCategoryGap?: number | string
  barGap?: number | string
  barSize?: number | string
  children?: any
  class?: VueClassValue
  compact?: boolean
  cx?: number | string
  cy?: number | string
  data?: any[]
  dataKey?: DataKey<any>
  desc?: string
  endAngle?: number
  height?: number
  id?: string
  innerRadius?: number | string
  layout?: LayoutType
  margin?: Margin
  maxBarSize?: number
  outerRadius?: number | string
  reverseStackOrder?: boolean
  role?: string
  stackOffset?: StackOffsetType
  startAngle?: number
  style?: any
  syncId?: number | string
  syncMethod?: SyncMethod
  tabIndex?: number
  throttleDelay?: number
  title?: string
  width?: number
}

export type CategoricalDomain = ReadonlyArray<number | string | Date>
