import { computed, shallowRef, watch } from 'vue'
import type { Point } from '@/shape/Curve'
import type { ChartTransition, PhaseTiming } from './motion'
import { useAnimationCallbacks } from './useAnimationCallbacks'
import { useKeyedTransition } from './useKeyedTransition'

interface PointState<T> {
  point: T
  index: number
  baseline?: number | Point
  reveal: number
}

// While only the reveal sweep moves, the points keep their identity; returning the previous
// array then keeps the path from being regenerated on every frame.
function stable<V>(read: () => V[]) {
  let last: V[] = []
  return computed(() => {
    const next = read()
    if (next.length === last.length && next.every((value, i) => value === last[i]))
      return last
    return (last = next)
  })
}

/** Top and baseline share identity and a clock, including the initial clip sweep. */
export function usePointTransition<T extends Point>(
  target: () => readonly T[] | undefined,
  options: {
    key: (point: T, index: number) => PropertyKey
    baseline?: () => number | readonly Point[] | undefined
    /**
     * The series is hidden (legend). A series with a baseline (an area) folds onto it, so a
     * stack closes smoothly over it; one without (a line) sweeps out.
     */
    hidden?: () => boolean
    /** The value axis a hidden series folds along: 'x' in vertical layouts. */
    valueAxis?: () => 'x' | 'y'
    isActive: () => boolean
    transition: () => ChartTransition | undefined
    /** Timing of the first appearance, e.g. a line drawing itself. */
    entrance?: PhaseTiming
    /** Play the first appearance after hydration; the server renders it undrawn. */
    entranceAfterHydration?: boolean
    onStart: () => void
    onEnd: () => void
  },
) {
  let appeared = false
  const callbacks = useAnimationCallbacks(options.onStart, options.onEnd)
  const mixPoint = <P extends Point>(from: P, to: P, t: number): P => {
    if (from.x === to.x && from.y === to.y)
      return to
    return {
      ...to,
      x: from.x == null || to.x == null ? to.x : from.x + (to.x - from.x) * t,
      // Null values are gaps, never coordinates to interpolate through zero.
      y: from.y == null || to.y == null ? to.y : from.y + (to.y - from.y) * t,
    }
  }
  // What a hidden series animates to: its points as they were, flattened onto their baseline.
  const folded = shallowRef<PointState<T>[]>([])
  const { items, isAnimating } = useKeyedTransition<PointState<T>>(() => {
    if (options.hidden?.())
      return folded.value
    const baseline = options.baseline?.()
    return target()?.map((point, index) => ({
      point,
      index,
      reveal: 1,
      baseline: typeof baseline === 'number' ? baseline : baseline?.[index],
    }))
  }, {
    key: ({ point, index }) => options.key(point, index),
    interpolate: (from, to, t) => from.point === to.point && from.baseline === to.baseline
      ? (from.reveal === to.reveal ? to : { ...to, reveal: from.reveal + (to.reveal - from.reveal) * t })
      : ({
          ...to,
          point: mixPoint(from.point, to.point, t),
          baseline: typeof from.baseline === 'number' && typeof to.baseline === 'number'
            ? from.baseline + (to.baseline - from.baseline) * t
            : typeof from.baseline === 'object' && typeof to.baseline === 'object'
              ? mixPoint(from.baseline, to.baseline, t)
              : to.baseline,
          reveal: from.reveal + (to.reveal - from.reveal) * t,
        }),
    // Points grow out of and fold into their neighbours. With no neighbour on screen (first
    // appearance, or data that was or becomes empty) the whole path sweeps in or out instead.
    enterFrom: (to, { previous, next }) => {
      const neighbor = previous ?? next
      if (!appeared || !neighbor)
        return { ...to, reveal: 0 }
      return { ...to, point: { ...to.point, x: neighbor.point.x, y: neighbor.point.y }, baseline: neighbor.baseline }
    },
    exitTo: (from, { previous, next }) => {
      const neighbor = previous ?? next
      if (!neighbor)
        return { ...from, reveal: 0 }
      return { ...from, point: { ...from.point, x: neighbor.point.x, y: neighbor.point.y }, baseline: neighbor.baseline }
    },
    isActive: options.isActive,
    connected: true,
    transition: options.transition,
    entrance: options.entrance,
    entranceAfterHydration: options.entranceAfterHydration,
    onStart: () => {
      if (target()?.length || appeared)
        callbacks.onStart()
      if (target()?.length)
        appeared = true
    },
    onEnd: () => {
      if (appeared)
        callbacks.onEnd()
    },
  })
  watch(() => options.hidden?.() ?? false, (hidden) => {
    if (!hidden)
      return
    const axis = options.valueAxis?.() ?? 'y'
    folded.value = items.value.filter(item => item.phase !== 'exit' && item.value.baseline != null).map(({ value }) => ({
      ...value,
      point: { ...value.point, [axis]: typeof value.baseline === 'number' ? value.baseline : value.baseline![axis] },
    }))
  }, { flush: 'sync' })
  const baselinePoints = stable(() => items.value.map(item => item.value.baseline).filter((point): point is Point => point != null && typeof point === 'object'))
  return {
    items,
    points: stable(() => items.value.map(item => item.value.point)),
    baseline: computed(() => {
      const first = items.value[0]?.value.baseline
      return typeof first === 'number' ? first : baselinePoints.value
    }),
    reveal: computed(() => items.value.reduce((min, item) => Math.min(min, item.value.reveal), 1)),
    isAnimating,
  }
}
