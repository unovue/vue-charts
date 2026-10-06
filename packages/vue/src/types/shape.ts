import type { ValueAnimationTransition } from 'motion-v'
import type { VueClassValue } from '@/types/common'

export interface Point {
  readonly x: number
  readonly y: number
}

export type MinPointSize = number | ((value: number, index: number) => number)

export type NormalizedStackId = string

export interface TrapezoidProps {
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
