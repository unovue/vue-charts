import type { AxisId } from './axis'
import type { IfOverflow } from '@/types'

export type ReferenceElementSettings = {
  yAxisId: AxisId
  xAxisId: AxisId
  ifOverflow: IfOverflow
}

export type ReferenceDotSettings = ReferenceElementSettings & {
  x: unknown
  y: unknown
  r: number
}

export type ReferenceAreaSettings = ReferenceElementSettings & {
  x1: unknown
  x2: unknown
  y1: unknown
  y2: unknown
}

export type ReferenceLineSettings = ReferenceElementSettings & {
  x: unknown
  y: unknown
}

export type ReferenceElementState = {
  dots: ReadonlyArray<ReferenceDotSettings>
  areas: ReadonlyArray<ReferenceAreaSettings>
  lines: ReadonlyArray<ReferenceLineSettings>
}
