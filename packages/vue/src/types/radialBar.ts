import type { SectorInput } from '@/shape/Sector'

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
  background?: SectorInput
  [key: string]: unknown
}
