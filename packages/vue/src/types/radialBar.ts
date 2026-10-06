import type { SectorProps } from '@/shape/Sector'

export interface RadialBarDataItem {
  cx: number
  cy: number
  innerRadius: number | null | undefined
  outerRadius: number | undefined
  startAngle: number | null
  endAngle: number
  index: number
  fill?: string
  value?: unknown
  payload?: unknown
  background?: SectorProps
  [key: string]: unknown
}
