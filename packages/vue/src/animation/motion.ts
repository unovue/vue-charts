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
  /** Removed elements. */
  exit: { duration: 0.25, ease: cubicBezier(0.4, 0, 1, 1) },
} satisfies Record<string, PhaseTiming>
