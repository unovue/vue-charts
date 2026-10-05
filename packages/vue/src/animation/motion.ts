import type { ValueAnimationTransition } from 'motion-dom'
import { cubicBezier } from 'motion-v'
import type { Reveal } from './useKeyedTransition'

/** Options for a chart element's `transition` prop: duration, ease, delay, or a spring. */
export type ChartTransition = ValueAnimationTransition<number>

export interface PhaseTiming {
  /** Seconds. */
  duration: number
  ease: (t: number) => number
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1)
const easeOutCubic = cubicBezier(0.33, 1, 0.68, 1)

/**
 * Default timings shared by chart elements. Lines and areas keep drawing at their steady
 * pace after bars land. Elements leave faster than they arrive, so exits clear the way.
 */
export const motionTokens = {
  /**
   * First appearance: long enough to watch the chart build up, and decelerating gently, so most
   * of it is not over in the first frames (a quint curve finished two thirds in 120 ms).
   */
  enter: { duration: 1, ease: easeOutCubic },
  /** Data changes: same curve, shorter, so interruptions feel responsive. */
  update: { duration: 0.5, ease: easeOutQuint },
  /** Removed elements: the same curve, shorter still, so they clear the way for the rest. */
  exit: { duration: 0.3, ease: easeOutQuint },
  /** Pointer feedback and tooltip appearance share the CSS ease-out curve. */
  feedback: { duration: 0.15, ease: 'easeOut', cssEase: 'ease-out' },
  color: { duration: 0.3, ease: 'easeOut', cssEase: 'ease-out' },
  follow: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
} as const

/**
 * A cascade entrance: items start one after another over the first `spread` of `duration` and
 * each takes the rest on the entrance curve, so the wave reads as one gesture, not many.
 */
export const cascadeTiming = { duration: 1.2, spread: 0.4, ease: easeOutCubic }

const drawEase = cubicBezier(0.4, 0, 0.2, 1)

/**
 * A line drawing itself on first appearance. Its tip travels the whole curve, so the duration
 * follows the length it travels: 1.2 s up to 500 px, 0.2 s more per further 1000 px, at most
 * 2 s. A dense line then never races faster than the eye can follow, and a short one does not
 * crawl. The curve starts gently and settles for longer than it accelerates.
 */
export function drawTiming(length: number): PhaseTiming {
  const extra = Math.max(0, length - 500) / 1000 * 0.2
  return { duration: Math.min(2, 1.2 + extra), ease: drawEase }
}

interface CascadeBox {
  x: number
  y: number
  width: number
  height: number
}

/** The diagonal reveal shared by treemaps and cell charts; timelines slide instead. */
export function cascadeReveal<T extends CascadeBox>(
  cells: readonly CascadeBox[],
  style: 'cascade' | 'slide' = 'cascade',
): Reveal<T> | undefined {
  if (!cells.length)
    return undefined
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const cell of cells) {
    left = Math.min(left, cell.x)
    top = Math.min(top, cell.y)
    right = Math.max(right, cell.x + cell.width)
    bottom = Math.max(bottom, cell.y + cell.height)
  }
  const span = right - left + bottom - top || 1
  return {
    from: cell => style === 'slide'
      ? { ...cell, x: cell.x - 8, opacity: 0 }
      : {
          ...cell,
          x: cell.x + cell.width * 0.04,
          y: cell.y + cell.height * 0.04,
          width: cell.width * 0.92,
          height: cell.height * 0.92,
          opacity: 0,
        },
    order: cell => Math.min(1, Math.max(0, (cell.x - left + cell.y - top) / span)),
  }
}
