import type { LayoutType, Margin } from '@/types'

export interface ChartLayoutState {
  layout: LayoutType
  width: number
  height: number
  margin: Margin
  scale: number
}
