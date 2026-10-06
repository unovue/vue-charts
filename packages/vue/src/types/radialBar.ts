import type { SectorProps } from '@/shape/Sector'

export interface RadialBarDataItem {
  cx: number
  cy: number
  innerRadius: number | null | undefined
  outerRadius: number | undefined
  startAngle: number | null
  endAngle: number
  value?: any
  payload?: any
  background?: SectorProps
  [key: string]: any
}
