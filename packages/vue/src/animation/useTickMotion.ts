import type { RechartsScale } from '@/types/scale'
import { onMounted } from 'vue'
import { useKeyedTransition } from './useKeyedTransition'
import { useSeriesMotion } from './renderPhase'

interface TickLike {
  value?: unknown
  coordinate: number
  tickCoord?: number
}

export type MovingTick<T> = T & { opacity: number }

/**
 * Axis ticks and grid lines follow their values when the scale changes, on the same clock as the
 * series: a tick that stays slides to its new place, a new tick fades in from where the old scale
 * would have put its value, and a leaving tick fades out towards its place on the new scale. So
 * labels never disagree with the bars and lines they describe while those move.
 *
 * The first render, server render, hydration and reduced motion show the ticks at once.
 */
export function useTickMotion<T extends TickLike>(
  ticks: () => readonly T[],
  scale: () => RechartsScale | undefined,
  range: () => readonly [number, number],
) {
  const seriesMotion = useSeriesMotion()
  let ready = false
  onMounted(() => {
    ready = true
  })
  // The scale of the ticks on screen, to place new values where they were.
  let shownScale: RechartsScale | undefined

  const clampToRange = (coordinate: number) => {
    const [a, b] = range()
    return Math.min(Math.max(a, b), Math.max(Math.min(a, b), coordinate))
  }
  const placeOn = (tick: MovingTick<T>, on: RechartsScale | undefined, reference: RechartsScale | undefined): MovingTick<T> => {
    // Band scales add the same in-band offset on both sides.
    const at = on?.(tick.value as never)
    const ref = reference?.(tick.value as never)
    if (typeof at !== 'number' || !Number.isFinite(at) || typeof ref !== 'number' || !Number.isFinite(ref))
      return { ...tick, opacity: 0 }
    const shift = at - ref
    return {
      ...tick,
      coordinate: clampToRange(tick.coordinate + shift),
      ...(typeof tick.tickCoord === 'number' ? { tickCoord: clampToRange(tick.tickCoord + shift) } : {}),
      opacity: 0,
    }
  }
  const mix = (a: number, b: number, t: number) => a + (b - a) * t

  return useKeyedTransition<MovingTick<T>>(() => ticks().map(tick => ({ ...tick, opacity: 1 })), {
    key: (tick, index) => tick.value == null ? index : String(tick.value),
    interpolate: (from, to, t) => ({
      ...to,
      coordinate: mix(from.coordinate, to.coordinate, t),
      ...(typeof from.tickCoord === 'number' && typeof to.tickCoord === 'number' ? { tickCoord: mix(from.tickCoord, to.tickCoord, t) } : {}),
      opacity: mix(from.opacity, to.opacity, t),
    }),
    enterFrom: to => placeOn(to, shownScale, scale()),
    exitTo: from => placeOn(from, scale(), shownScale),
    connected: true,
    followsSeries: true,
    isActive: () => ready && seriesMotion.anyActive(),
    onStart: () => {
      shownScale = scale()
    },
  })
}
