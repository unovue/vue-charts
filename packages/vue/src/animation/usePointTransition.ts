import { computed } from 'vue'
import type { Point } from '@/shape/Curve'
import type { ChartTransition } from './motion'
import { useAnimationCallbacks } from './useAnimationCallbacks'
import { useKeyedTransition } from './useKeyedTransition'

interface PointState<T> {
  point: T
  index: number
  baseline?: number | Point
  reveal: number
}

/** Top and baseline share identity and a clock, including the initial clip sweep. */
export function usePointTransition<T extends Point>(
  target: () => readonly T[] | undefined,
  options: {
    key: (point: T, index: number) => PropertyKey
    baseline?: () => number | readonly Point[] | undefined
    isActive: () => boolean
    transition: () => ChartTransition | undefined
    onStart: () => void
    onEnd: () => void
  },
) {
  let appeared = false
  const callbacks = useAnimationCallbacks(options.onStart, options.onEnd)
  const mixPoint = <P extends Point>(from: P, to: P, t: number): P => ({
    ...to,
    x: from.x + (to.x - from.x) * t,
    // Null values are gaps, never coordinates to interpolate through zero.
    y: from.y == null || to.y == null ? to.y : from.y + (to.y - from.y) * t,
  })
  const { items, isAnimating } = useKeyedTransition<PointState<T>>(() => {
    const baseline = options.baseline?.()
    return target()?.map((point, index) => ({
      point,
      index,
      reveal: 1,
      baseline: typeof baseline === 'number' ? baseline : baseline?.[index],
    }))
  }, {
    key: ({ point, index }) => options.key(point, index),
    interpolate: (from, to, t) => ({
      ...to,
      point: mixPoint(from.point, to.point, t),
      baseline: typeof from.baseline === 'number' && typeof to.baseline === 'number'
        ? from.baseline + (to.baseline - from.baseline) * t
        : typeof from.baseline === 'object' && typeof to.baseline === 'object'
          ? mixPoint(from.baseline, to.baseline, t)
          : to.baseline,
      reveal: from.reveal + (to.reveal - from.reveal) * t,
    }),
    enterFrom: (to, { previous, next }) => {
      if (!appeared)
        return { ...to, reveal: 0 }
      const neighbor = previous ?? next ?? to
      return { ...to, point: { ...to.point, x: neighbor.point.x, y: neighbor.point.y }, baseline: neighbor.baseline }
    },
    exitTo: (from, { previous, next }) => {
      const neighbor = previous ?? next ?? from
      return { ...from, point: { ...from.point, x: neighbor.point.x, y: neighbor.point.y }, baseline: neighbor.baseline }
    },
    isActive: options.isActive,
    connected: true,
    transition: options.transition,
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
  return {
    items,
    points: computed(() => items.value.map(item => item.value.point)),
    baseline: computed(() => {
      const first = items.value[0]?.value.baseline
      return typeof first === 'number' ? first : items.value.map(item => item.value.baseline).filter((point): point is Point => point != null && typeof point === 'object')
    }),
    reveal: computed(() => Math.min(1, ...items.value.map(item => item.value.reveal))),
    isAnimating,
  }
}
