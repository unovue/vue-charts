import type { DataKey, VueClassValue } from '@/types/common'

/**
 * null means no active index
 * string means: whichever index from the chart data it is.
 * Different charts have different requirements on data shapes,
 * and are also responsible for providing a function that will accept this index
 * and return data.
 */
export type TooltipIndex = string | null

export type TooltipEventType = 'axis' | 'item'

export type TooltipTrigger = 'hover' | 'click'

export type TooltipType = 'none'

export type ValueType = number | string | Array<number | string>

export type NameType = number | string

export type Formatter<TValue extends ValueType, TName extends NameType> = (
  value: TValue,
  name: TName,
  item: Payload<TValue, TName>,
  index: number,
  payload: ReadonlyArray<Payload<TValue, TName>>,
) => any

export interface Payload<TValue extends ValueType, TName extends NameType> {
  type?: TooltipType
  color?: string
  // formatter?: Formatter<TValue, TName>
  name?: TName
  value?: TValue
  unit?: string | number
  fill?: string
  dataKey?: DataKey<any>
  nameKey?: DataKey<any>
  payload?: any
  chartType?: string
  stroke?: string
  strokeDasharray?: string | number
  strokeWidth?: number | string
  class?: VueClassValue
  hide?: boolean
  formatter?: Formatter<TValue, TName>

}
