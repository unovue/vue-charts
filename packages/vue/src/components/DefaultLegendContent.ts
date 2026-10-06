import type { DataKey } from '@/types'
import type { LegendType } from '@/types/legend'

export type HorizontalAlignmentType = 'left' | 'center' | 'right'
export type VerticalAlignmentType = 'top' | 'middle' | 'bottom'

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
