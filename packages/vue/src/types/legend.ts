import type { ChartDataKey } from '@/types/base'

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
    value?: unknown
  }
  inactive?: boolean
  dataKey?: ChartDataKey
}
