import type { AnimationPlaybackControls } from 'motion-dom'
import { animate } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import type { ShallowRef } from 'vue'
import { onScopeDispose, shallowRef, watch } from 'vue'
import type { ChartTransition, PhaseTiming } from './motion'
import { motionTokens } from './motion'
import { shouldSkipEntrance } from './renderPhase'

export type TransitionPhase = 'enter' | 'update' | 'exit'

export interface DisplayItem<T> {
  key: PropertyKey
  value: T
  phase: TransitionPhase
}

export interface KeyedTransitionOptions<T> {
  /** Stable identity across data changes (category, name). Never geometry. */
  key: (item: T, index: number) => PropertyKey
  /** The value between two states; `t` is eased progress in [0, 1]. */
  interpolate: (from: T, to: T, t: number) => T
  /**
   * Where an entering item starts, e.g. a bar with zero height on its baseline. `neighbors`
   * are the closest items on either side that are already on screen, so a new point of a line
   * can grow out of its neighbour.
   */
  enterFrom: (to: T, neighbors: Neighbors<T>) => T
  /** Where an exiting item ends, e.g. collapsed onto its baseline or into a remaining neighbour. */
  exitTo: (from: T, neighbors: Neighbors<T>) => T
  isActive: () => boolean
  /**
   * The items form one path (a line or area). Every point then follows the update timing, so
   * each frame is a blend of two ordered point lists and the path never crosses itself.
   * Separate shapes (bars) leave faster than they arrive.
   */
  connected?: boolean
  /** A user `transition` prop. When set, every phase follows it instead of the motion tokens. */
  transition?: () => ChartTransition | undefined
  onStart?: () => void
  onEnd?: () => void
}

export interface Neighbors<T> {
  previous?: T
  next?: T
}

interface PlanItem<T> {
  key: PropertyKey
  from: T
  to: T
  phase: TransitionPhase
}

const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t

/**
 * Keyed enter/update/exit transitions on one clock.
 *
 * - Items match by `key`, so inserting at the front slides the others instead of morphing
 *   every item into its neighbour, and DOM nodes keyed by `key` stay mounted.
 * - A change during a transition starts from what is on screen now.
 * - Exiting items stay in `items` (phase 'exit') until they have left.
 * - Reduced motion, `isActive() === false`, server render and hydration show the target
 *   at once; start/end callbacks still fire.
 */
export function useKeyedTransition<T>(
  target: () => readonly T[] | undefined,
  options: KeyedTransitionOptions<T>,
): { items: ShallowRef<DisplayItem<T>[]>, isAnimating: ShallowRef<boolean> } {
  const items = shallowRef<DisplayItem<T>[]>([])
  const isAnimating = shallowRef(false)
  const reducedMotion = usePreferredReducedMotion()
  let skipEntrance = shouldSkipEntrance()
  let hasEntered = false
  let controls: AnimationPlaybackControls | undefined

  function stop() {
    controls?.stop()
    controls = undefined
  }

  function settle(plan: PlanItem<T>[]) {
    items.value = plan
      .filter(p => p.phase !== 'exit')
      .map(({ key, to }) => ({ key, value: to, phase: 'update' as const }))
  }

  function keyed(next: readonly T[]) {
    // Repeated keys (e.g. two rows with the same category) get a stable occurrence suffix.
    const seen = new Map<PropertyKey, number>()
    return next.map((value, i) => {
      const base = options.key(value, i)
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      return { key: count === 0 ? base : `${String(base)}#${count}`, value }
    })
  }

  function snap(next: readonly T[]) {
    stop()
    options.onStart?.()
    items.value = keyed(next).map(({ key, value }) => ({ key, value, phase: 'update' as const }))
    isAnimating.value = false
    options.onEnd?.()
  }

  function plan(next: readonly T[]): PlanItem<T>[] {
    // Everything drawn now, including items still leaving after an interrupted change.
    const drawn = items.value
    const onScreen = new Map(drawn.map(item => [item.key, item.value]))
    const nextItems = keyed(next)
    const nextKeys = new Set(nextItems.map(item => item.key))

    // Closest neighbours in the new order that are already on screen.
    const neighborsInNext = (index: number): Neighbors<T> => {
      let previous: T | undefined
      let following: T | undefined
      for (let i = index - 1; i >= 0 && previous === undefined; i--)
        previous = onScreen.get(nextItems[i].key)
      for (let i = index + 1; i < nextItems.length && following === undefined; i++)
        following = onScreen.get(nextItems[i].key)
      return { previous, next: following }
    }
    const staying: PlanItem<T>[] = nextItems.map(({ key, value: to }, index) => {
      const from = onScreen.get(key)
      return from === undefined
        ? { key, from: options.enterFrom(to, neighborsInNext(index)), to, phase: 'enter' }
        : { key, from, to, phase: 'update' }
    })

    // Closest neighbours in the old order that stay, at their new positions.
    const targetOf = new Map(staying.map(item => [item.key, item.to]))
    const neighborsInDrawn = (index: number): Neighbors<T> => {
      let previous: T | undefined
      let following: T | undefined
      for (let i = index - 1; i >= 0 && previous === undefined; i--)
        previous = targetOf.get(drawn[i].key)
      for (let i = index + 1; i < drawn.length && following === undefined; i++)
        following = targetOf.get(drawn[i].key)
      return { previous, next: following }
    }

    // Exiting items keep their place relative to the items that stay, so a path drawn through
    // the items never jumps back across the chart. Each one is placed before the next item of
    // the old order that stays.
    const exitsBefore = new Map<PropertyKey, PlanItem<T>[]>()
    const trailingExits: PlanItem<T>[] = []
    drawn.forEach((item, index) => {
      if (nextKeys.has(item.key))
        return
      const exit: PlanItem<T> = { key: item.key, from: item.value, to: options.exitTo(item.value, neighborsInDrawn(index)), phase: 'exit' }
      const anchor = drawn.slice(index + 1).find(later => nextKeys.has(later.key))
      if (anchor) {
        const group = exitsBefore.get(anchor.key) ?? []
        group.push(exit)
        exitsBefore.set(anchor.key, group)
      }
      else {
        trailingExits.push(exit)
      }
    })

    return [...staying.flatMap(item => [...(exitsBefore.get(item.key) ?? []), item]), ...trailingExits]
  }

  watch(target, (next) => {
    const nextItems = next ?? []
    const skip = skipEntrance && !hasEntered
    skipEntrance = false
    if (skip || !options.isActive() || reducedMotion.value === 'reduce') {
      hasEntered = true
      snap(nextItems)
      return
    }

    const steps = plan(nextItems)
    // The very first appearance uses the enter timing for every item.
    const timing = (phase: TransitionPhase): PhaseTiming => motionTokens[!hasEntered ? 'enter' : options.connected ? 'update' : phase]
    hasEntered = true
    stop()
    isAnimating.value = true
    options.onStart?.()

    const render = (progressOf: (phase: TransitionPhase) => number) => {
      items.value = steps.map(({ key, from, to, phase }) => {
        const t = progressOf(phase)
        return { key, phase, value: t >= 1 ? to : options.interpolate(from, to, t) }
      })
    }
    const finish = () => {
      controls = undefined
      settle(steps)
      isAnimating.value = false
      options.onEnd?.()
    }

    const userTransition = options.transition?.()
    if (userTransition) {
      // One shared progress (may be a spring) for every phase.
      render(() => 0)
      controls = animate(0, 1, { ...userTransition, onUpdate: t => render(() => t), onComplete: finish })
      return
    }

    // One linear clock in seconds; each phase applies its own duration and curve.
    const total = Math.max(...steps.map(s => timing(s.phase).duration), 0)
    render(() => 0)
    controls = animate(0, total, {
      duration: total,
      ease: 'linear',
      onUpdate: (elapsed) => {
        render((phase) => {
          const { duration, ease } = timing(phase)
          return ease(clamp01(elapsed / duration))
        })
      },
      onComplete: finish,
    })
  }, { immediate: true })

  onScopeDispose(stop)
  return { items, isAnimating }
}
