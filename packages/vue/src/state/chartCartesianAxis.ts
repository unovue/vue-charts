import type { AxisRange } from './selectors/axisSelectors'
import type { SVGAttributes } from 'vue'
import type { RechartsScale, ScaleType } from '@/types/scale'
import type { AxisDomain, AxisDomainType, AxisInterval, YAxisWidth } from '@/types/axis'
import type { DataKey } from '@/types'
import type { AxisTick, TickFormatter } from '@/types/tick'

export type AxisId = string | number
export type XAxisPadding = { left?: number, right?: number } | 'gap' | 'no-gap'
export type YAxisPadding = { top?: number, bottom?: number } | 'gap' | 'no-gap'

export type XAxisOrientation = 'top' | 'bottom'
export type YAxisOrientation = 'left' | 'right'

/**
 * Properties shared in X, Y, and Z axes
 */
export type BaseCartesianAxis = {
  id?: AxisId
  scale: ScaleType | RechartsScale | undefined
  type: AxisDomainType
  /**
   * The axis functionality is severely restricted without a dataKey
   * - but there is still something left, and the prop is optional
   * so this can also be undefined even in real charts.
   * There are no defaults.
   */
  dataKey: DataKey<any> | undefined
  unit: string | undefined
  name: string | undefined
  allowDuplicatedCategory: boolean
  allowDataOverflow: boolean
  reversed: boolean
  includeHidden: boolean
  domain: AxisDomain | undefined
}

export type TicksSettings = {
  allowDecimals: boolean
  tickCount: number | undefined
  /**
   * Ticks can be any type when the axis is the type of category
   * Ticks must be numbers when the axis is the type of number
   */
  ticks: ReadonlyArray<AxisTick> | undefined
  tick: SVGAttributes | boolean
}

/**
 * These are the external props, visible for users as they set them using our public API.
 * There is all sorts of internal computed things based on these, but they will come through selectors.
 *
 * Properties shared between X and Y axes
 */
export type CartesianAxisSettings = BaseCartesianAxis &
  TicksSettings & {
    interval: AxisInterval
    mirror: boolean
    minTickGap: number
    angle: number
    hide: boolean
    tickFormatter: TickFormatter | undefined
  }

export type XAxisSettings = CartesianAxisSettings & {
  padding: XAxisPadding
  height: number
  orientation: XAxisOrientation
}

export type YAxisSettings = CartesianAxisSettings & {
  padding: YAxisPadding
  width: YAxisWidth
  orientation: YAxisOrientation
}

/**
 * Z axis is special because it's never displayed. It controls the size of Scatter dots,
 * but it never displays ticks anywhere.
 */
export type ZAxisSettings = BaseCartesianAxis & {
  range: AxisRange
}

export type CartesianAxisState = {
  xAxis: Record<AxisId, XAxisSettings>
  yAxis: Record<AxisId, YAxisSettings>
  zAxis: Record<AxisId, ZAxisSettings>
}
