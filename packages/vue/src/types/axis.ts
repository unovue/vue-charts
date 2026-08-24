import type { DataKey, VueClassValue } from './common'
import type { RechartsScale, ScaleType } from './scale'
import type { TickFormatter, TicksSettings } from './tick'

export type AxisId = string | number
export type AxisDomainType = 'number' | 'category'

export type AxisDomainItem = string | number | ((d: number) => string | number) | 'auto' | 'dataMin' | 'dataMax'

/**
 * The domain of axis.
 * This is the definition
 *
 * Numeric domain is always defined by an array of exactly two values, for the min and the max of the axis.
 * Categorical domain is defined as array of all possible values.
 *
 * Can be specified in many ways:
 * - array of numbers
 * - with special strings like 'dataMin' and 'dataMax'
 * - with special string math like 'dataMin - 100'
 * - with keyword 'auto'
 * - or a function
 * - array of functions
 * - or a combination of the above
 */
export type AxisDomain =
  | ReadonlyArray<string>
  | ReadonlyArray<number>
  | Readonly<[AxisDomainItem, AxisDomainItem]>
  | (([dataMin, dataMax]: [number, number], allowDataOverflow: boolean) => [number, number])

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

export type AxisInterval = number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | 'equidistantPreserveStart' | 'equidistantPreserveEnd'

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

export type YAxisPadding = { top?: number, bottom?: number } | 'gap' | 'no-gap'

export type YAxisOrientation = 'left' | 'right'

/**
 * Width of the Y axis in pixels.
 * `auto` will attempt to resize the axis based on its content.
 */
export type YAxisWidth = number | 'auto'

export type YAxisSettings = CartesianAxisSettings & {
  padding: YAxisPadding
  width: YAxisWidth
  orientation: YAxisOrientation
  /**
   * Internal: recent measured widths, used to detect A→B→A oscillation
   * when width is measured dynamically (width === 'auto').
   */
  widthHistory?: number[]
}

export type AxisRange = readonly [number, number]

/**
 * Z axis is special because it's never displayed. It controls the size of Scatter dots,
 * but it never displays ticks anywhere.
 */
export type ZAxisSettings = BaseCartesianAxis & {
  range: AxisRange
}

export type XAxisPadding = { left?: number, right?: number } | 'gap' | 'no-gap'

export type XAxisOrientation = 'top' | 'bottom'

export type XAxisSettings = CartesianAxisSettings & {
  padding: XAxisPadding
  height: number
  orientation: XAxisOrientation
}

export type AxisType = 'xAxis' | 'yAxis' | 'zAxis' | 'angleAxis' | 'radiusAxis'

export interface XAxisProps {
  xAxisId?: string | number
  dataKey?: string | number | ((row: any) => any)
  type?: 'number' | 'category'
  domain?: any[]
  scale?: string | Function
  orientation?: 'top' | 'bottom'
  height?: number
  padding?: { left?: number, right?: number } | 'gap' | 'no-gap'
  mirror?: boolean
  hide?: boolean
  tick?: boolean | Function | any // VNode or custom renderer
  tickCount?: number
  tickFormatter?: (val: any, idx: number) => string
  allowDataOverflow?: boolean
  allowDuplicatedCategory?: boolean
  allowDecimals?: boolean
  includeHidden?: boolean
  name?: string
  unit?: string
  angle?: number
  minTickGap?: number
  label?: string | number | any // VNode or object
  class?: VueClassValue
}

/**
 * NumberDomain is an evaluated {@link AxisDomain}.
 * Unlike {@link AxisDomain}, it has no variety - it's a tuple of two number.
 * This is after all the keywords and functions were evaluated and what is left is [min, max].
 *
 * Know that the min, max values are not guaranteed to be nice numbers - values like -Infinity or NaN are possible.
 *
 * There are also `category` axes that have different things than numbers in their domain.
 */
export type NumberDomain = [min: number, max: number]
