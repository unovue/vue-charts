export type BaseValue = number | 'dataMin' | 'dataMax'

export interface AreaPointItem {
  x: number
  y: number
  value?: number | number[]
  payload?: unknown
}
