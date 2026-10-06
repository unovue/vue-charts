import type { LayoutType, Margin } from '@/types'

export interface ChartLayoutState {
  layoutType: LayoutType
  width: number
  height: number
  margin: Margin
  scale: number
}
