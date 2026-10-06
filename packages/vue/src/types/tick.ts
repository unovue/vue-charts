import type { CartesianViewBox } from '@/types/viewBox'
import type { AxisType, CartesianAxisSettings, XAxisOrientation, YAxisOrientation } from '@/types/axis'
import type { TickItem } from '@/types/common'
import type { RechartsScale } from '@/types/scale'
import type { SVGAttributes, VNode } from 'vue'

/**
 * Ticks can be any type when the axis is the type of category.
 *
 * Ticks must be numbers when the axis is the type of number.
 */
export type AxisTick = number | string

export type TicksSettings = {
  allowDecimals: boolean
  tickCount?: number
  /**
   * Ticks can be any type when the axis is the type of category
   * Ticks must be numbers when the axis is the type of number
   */
  ticks: ReadonlyArray<AxisTick> | undefined
  tick: SVGAttributes | ((props: any) => VNode) | boolean
}

export type TickFormatter = (value: any, index: number) => string

export type AxisPropsNeededForTicksGenerator = {
  axisType?: AxisType
  categoricalDomain?: ReadonlyArray<unknown>
  duplicateDomain?: ReadonlyArray<unknown>
  isCategorical?: boolean
  niceTicks?: ReadonlyArray<AxisTick>
  /**
   * The range appears to be only used in Angle Axis - needs further investigation
   */
  range?: ReadonlyArray<number>
  realScaleType?: 'scaleBand' | string
  scale: RechartsScale
  tickCount?: number
  ticks?: ReadonlyArray<AxisTick>
  type?: 'number' | 'category'
}

export interface CartesianTickItem extends TickItem {
  tickCoord?: number
  tickSize?: number
  isShow?: boolean
}

export type GetTicksInput = {
  angle: number
  interval: CartesianAxisSettings['interval']
  minTickGap: number
  orientation: XAxisOrientation | YAxisOrientation
  tick: CartesianAxisSettings['tick']
  tickFormatter: CartesianAxisSettings['tickFormatter']
  ticks: ReadonlyArray<CartesianTickItem>
  unit: CartesianAxisSettings['unit']
  viewBox: CartesianViewBox
}

export type StackId = string | number

export interface AxisTickSlotProps {
  x: number
  y: number
  index: number
  value: unknown
  payload: CartesianTickItem
  textAnchor: string
}

export interface AxisSlots {
  tick?: (props: AxisTickSlotProps) => import('vue').VNodeChild
}
