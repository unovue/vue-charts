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
  /**
   * A line drawing itself on first appearance: its tip travels the curve, so it starts gently,
   * moves evenly and lands softly, slow enough to follow.
   */
  draw: { duration: 1, ease: cubicBezier(0.65, 0, 0.35, 1) },
  /** Removed elements: the same curve, shorter still, so they clear the way for the rest. */
  exit: { duration: 0.3, ease: easeOutQuint },
} satisfies Record<string, PhaseTiming>
