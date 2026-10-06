import type { TooltipPayload } from '@/types/tooltip'
import type {
  ChartCoordinate,
  LayoutType,
} from '@/types'
import type { Point } from '@/shape'

// Types
export type ContentType =
  | any
  | ((props: TooltipContentProps) => any)

export type TooltipContentProps = {
  label?: string | number
  payload: TooltipPayload
  coordinate?: ChartCoordinate
  active: boolean
  accessibilityLayer: boolean
  // Other tooltip props
  [key: string]: any
}

export type AllowInDimension = { x: boolean, y: boolean }

// Cursor slot prop types — mirror Recharts cursorProps shape
// All variants include: offset fields (left/top/width/height), payload, payloadIndex
type CursorSlotCommon = {
  class: string | string[]
  style: { pointerEvents: 'none' }
  /** Chart area offset — same fields spread by Recharts: left, top, width, height */
  left: number
  top: number
  width: number
  height: number
  payload: TooltipPayload
  /** Active tooltip index — named payloadIndex to match Recharts */
  payloadIndex: string | undefined
  [key: string]: any
}

export type CrossCursorSlotProps = CursorSlotCommon & {
  stroke: string
  fill: string
  x: number
  y: number
}

export type RectangleCursorSlotProps = CursorSlotCommon & {
  stroke: string
  fill: string
  x: number
  y: number
}

export type SectorCursorSlotProps = CursorSlotCommon & {
  stroke: string
  fill: string
  cx: number
  cy: number
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
}

export type CurveCursorSlotProps = CursorSlotCommon & {
  stroke: string
  layout: LayoutType
  points: ReadonlyArray<Point>
}

export type CursorSlotProps = CrossCursorSlotProps | RectangleCursorSlotProps | SectorCursorSlotProps | CurveCursorSlotProps
