import type { ValueAnimationTransition } from 'motion-v'
import type { VueClassValue } from '@/types/common'

export interface Point {
  readonly x: number
  readonly y: number
  readonly payload?: unknown
}

export type MinPointSize = number | ((value: number, index: number) => number)

export type NormalizedStackId = string

/** Geometry of one trapezoid, as computed by Funnel and passed to its `shape` slot. */
export interface TrapezoidItem {
  class?: VueClassValue
  x?: number
  y?: number
  width?: number
  upperWidth?: number
  lowerWidth?: number
  height?: number

  isUpdateAnimationActive?: boolean
  transition?: ValueAnimationTransition<number>
}
