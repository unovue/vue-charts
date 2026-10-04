import type { ValueAnimationTransition } from 'motion-dom'
import { cubicBezier } from 'motion-v'

/** Options for a chart element's `transition` prop: duration, ease, delay, or a spring. */
export type ChartTransition = ValueAnimationTransition<number>

export interface PhaseTiming {
  /** Seconds. */
  duration: number
  ease: (t: number) => number
}

const easeOutQuint = cubicBezier(0.22, 1, 0.36, 1)

/**
 * Default timing for every animated chart element, so a composed chart (bars, lines, areas)
 * moves as one. Elements leave faster than they arrive, so exits never compete with entries.
 */
export const motionTokens = {
  /** First appearance: fast start, long soft landing. */
  enter: { duration: 0.6, ease: easeOutQuint },
  /** Data changes: same curve, shorter, so interruptions feel responsive. */
  update: { duration: 0.5, ease: easeOutQuint },
  /** Removed elements: the same curve, shorter still, so they clear the way for the rest. */
  exit: { duration: 0.3, ease: easeOutQuint },
} satisfies Record<string, PhaseTiming>

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
