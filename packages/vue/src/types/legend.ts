import type { DataKey } from '@/types/common'

export type LegendType =
  | 'circle'
  | 'cross'
  | 'diamond'
  | 'line'
  | 'plainline'
  | 'rect'
  | 'square'
  | 'star'
  | 'triangle'
  | 'wye'
  | 'none'

export interface LegendPayload {
  /**
   * This is the text that will be displayed in the legend in the DOM.
   */
  value: string | undefined
  type?: LegendType
  color?: string
  payload?: {
    strokeDasharray?: number | string
    value?: any
  }
  inactive?: boolean
  dataKey?: DataKey<any>
}
