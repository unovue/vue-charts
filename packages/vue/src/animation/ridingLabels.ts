import type { DisplayItem } from './useKeyedTransition'

/**
 * Labels ride along with their shape on every frame and show the new value at once. A label
 * fades with a shape that enters or leaves; settled and moving shapes keep full opacity.
 */
export function labelOpacity(item: DisplayItem<unknown>): number | undefined {
  if (item.progress == null || item.phase === 'update')
    return undefined
  return item.phase === 'enter' ? item.progress : 1 - item.progress
}

/** Share of the sweep over which a label fades in after the line reaches its point. */
const SWEEP_FADE = 0.3

/**
 * The labels of points the reveal sweep has passed. Each fades in behind the sweep's edge and
 * is fully shown when the sweep ends; all of them are unchanged once it has finished.
 */
export function sweptLabels<P extends { x?: number | null, y?: number | null, opacity?: number }>(
  points: readonly P[],
  reveal: number,
  sweep: { start: number, size: number, vertical: boolean },
): readonly P[] {
  if (reveal >= 1)
    return points
  const shown: P[] = []
  for (const point of points) {
    const position = sweep.vertical ? point.y : point.x
    if (position == null)
      continue
    // The sweep reaches the point at `reached`; the fade ends by the end of the sweep.
    const reached = Math.min(1, Math.max(0, (position - sweep.start) / sweep.size))
    const window = Math.max(Math.min(SWEEP_FADE, 1 - reached), 1e-6)
    const opacity = Math.min(1, (reveal - reached) / window)
    if (opacity > 0)
      shown.push(opacity < 1 ? { ...point, opacity: Math.min(opacity, point.opacity ?? 1) } : point)
  }
  return shown
}
