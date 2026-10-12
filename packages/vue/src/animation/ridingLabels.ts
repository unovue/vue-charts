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

/** Share of the reveal over which a label fades in after the line reaches its point. */
const SWEEP_FADE = 0.3

/**
 * The labels of points the reveal has passed. `reached(point, index)` is the share of the
 * reveal at which it reaches the point. Each label fades in behind the edge and is fully shown
 * when the reveal ends; all of them are unchanged once it has finished.
 */
export function sweptLabels<P extends { opacity?: number }>(
  points: readonly P[],
  reveal: number,
  reached: (point: P, index: number) => number | undefined,
): readonly P[] {
  if (reveal >= 1)
    return points
  const shown: P[] = []
  points.forEach((point, index) => {
    const at = reached(point, index)
    if (at == null)
      return
    // The fade ends by the end of the reveal.
    const window = Math.max(Math.min(SWEEP_FADE, 1 - at), 1e-6)
    const opacity = Math.min(1, (reveal - at) / window)
    if (opacity > 0)
      shown.push(opacity < 1 ? { ...point, opacity: Math.min(opacity, point.opacity ?? 1) } : point)
  })
  return shown
}

/** Where a straight sweep across `start`..`start + size` reaches a coordinate, as a share. */
export function sweepShare(position: number | null | undefined, start: number, size: number): number | undefined {
  return position == null ? undefined : Math.min(1, Math.max(0, (position - start) / size))
}

/**
 * Where a line drawn along its length reaches each point, as a share of its length; straight
 * segments between the points approximate the curve. Gaps (null coordinates) are skipped.
 */
export function lengthShares(points: readonly { x?: number | null, y?: number | null }[]): (number | undefined)[] {
  const { shares, total } = measure(points)
  return shares.map(share => share == null ? undefined : total > 0 ? share / total : 0)
}

/** The length of the straight segments through the points, skipping gaps. */
export function polylineLength(points: readonly { x?: number | null, y?: number | null }[]): number {
  return measure(points).total
}

function measure(points: readonly { x?: number | null, y?: number | null }[]) {
  const shares: (number | undefined)[] = []
  let total = 0
  let previous: { x: number, y: number } | undefined
  for (const point of points) {
    if (point.x == null || point.y == null) {
      shares.push(undefined)
      continue
    }
    if (previous)
      total += Math.hypot(point.x - previous.x, point.y - previous.y)
    shares.push(total)
    previous = { x: point.x, y: point.y }
  }
  return { shares, total }
}
