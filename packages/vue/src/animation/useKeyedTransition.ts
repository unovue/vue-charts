import type { AnimationPlaybackControls } from 'motion-dom'
import { animate } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import type { ShallowRef } from 'vue'
import { nextTick, onScopeDispose, shallowRef, watch } from 'vue'
import type { ChartTransition, PhaseTiming } from './motion'
import { motionTokens } from './motion'
import { isServerRender, shouldSkipEntrance, useChartGesture, useChartSize, useSeriesMotion } from './renderPhase'

export type TransitionPhase = 'enter' | 'update' | 'exit'

export interface DisplayItem<T> {
  key: PropertyKey
  value: T
  phase: TransitionPhase
  /** Eased progress of this item's phase in [0, 1]; absent once settled. */
  progress?: number
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
  /** Axes and grids follow the series; they do not count as an animated series themselves. */
  followsSeries?: boolean
  /** A user `transition` prop. When set, every phase follows it instead of the motion tokens. */
  transition?: () => ChartTransition | undefined
  /** Timing of the first appearance instead of the `enter` token, e.g. a line drawing itself. */
  entrance?: PhaseTiming
  /**
   * Play the entrance after hydration instead of showing the final state at once. The server
   * renders the entrance's start (e.g. a line not drawn yet), so hydration matches it.
   */
  entranceAfterHydration?: boolean
  onStart?: () => void
  onEnd?: () => void
}

export interface Neighbors<T> {
  previous?: T
  next?: T
  /**
   * How the closest staying neighbours move in this change (on-screen value → target), so an
   * entering or leaving item can travel with them, e.g. bars sliding along a shifted window.
   */
  previousMove?: Move<T>
  nextMove?: Move<T>
}

export interface Move<T> {
  from: T
  to: T
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
  const onServer = isServerRender()
  let hasEntered = false
  // A resize moves everything at once and repeats every frame while a box eases its size; the
  // chart then follows its box directly instead of trailing it.
  const chartSize = useChartSize()
  const gesture = useChartGesture()
  let lastSize: string | undefined
  // The first appearance is animating.
  let entering = false
  if (!options.followsSeries)
    useSeriesMotion().register(options.isActive)
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
      return { key: count === 0 ? base : `${String(base)}\u0000${count}`, value }
    })
  }

  function snap(next: readonly T[]) {
    stop()
    entering = false
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

    // Closest neighbours, found in two linear passes so large data stays O(n): for each index,
    // the nearest index before and after it that satisfies `qualifies`.
    const nearest = (length: number, qualifies: (index: number) => boolean) => {
      const before = Array.from<number>({ length })
      const after = Array.from<number>({ length })
      for (let i = 0, last = -1; i < length; i++) {
        before[i] = last
        if (qualifies(i))
          last = i
      }
      for (let i = length - 1, last = -1; i >= 0; i--) {
        after[i] = last
        if (qualifies(i))
          last = i
      }
      return { before, after }
    }

    // For entering items: the closest neighbours in the new order that are already on screen.
    const onScreenAround = onScreen.size ? nearest(nextItems.length, i => onScreen.has(nextItems[i].key)) : undefined
    const moveInNext = (i: number): Move<T> | undefined => i < 0 ? undefined : { from: onScreen.get(nextItems[i].key)!, to: nextItems[i].value }
    const neighborsInNext = (index: number): Neighbors<T> => {
      if (!onScreenAround)
        return {}
      const previousMove = moveInNext(onScreenAround.before[index])
      const nextMove = moveInNext(onScreenAround.after[index])
      return { previous: previousMove?.from, next: nextMove?.from, previousMove, nextMove }
    }
    const staying: PlanItem<T>[] = nextItems.map(({ key, value: to }, index) => {
      const from = onScreen.get(key)
      return from === undefined
        ? { key, from: options.enterFrom(to, neighborsInNext(index)), to, phase: 'enter' }
        : { key, from, to, phase: 'update' }
    })

    // For leaving items: the closest neighbours in the old order that stay, at their new places.
    const targetOf = new Map(staying.map(item => [item.key, item.to]))
    const stayingAround = nearest(drawn.length, i => nextKeys.has(drawn[i].key))
    const moveInDrawn = (i: number): Move<T> | undefined => i < 0 ? undefined : { from: drawn[i].value, to: targetOf.get(drawn[i].key)! }
    const neighborsInDrawn = (index: number): Neighbors<T> => {
      const previousMove = moveInDrawn(stayingAround.before[index])
      const nextMove = moveInDrawn(stayingAround.after[index])
      return { previous: previousMove?.to, next: nextMove?.to, previousMove, nextMove }
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
      const anchor = stayingAround.after[index]
      if (anchor >= 0) {
        const group = exitsBefore.get(drawn[anchor].key) ?? []
        group.push(exit)
        exitsBefore.set(drawn[anchor].key, group)
      }
      else {
        trailingExits.push(exit)
      }
    })

    return [...staying.flatMap(item => [...(exitsBefore.get(item.key) ?? []), item]), ...trailingExits]
  }

  watch(() => ({ next: target(), active: options.isActive(), reduced: reducedMotion.value, size: chartSize(), dragging: gesture.value }), (state) => {
    // A getter that throws (e.g. a user dataKey function) leaves no state; keep what is drawn.
    if (!state)
      return
    const { next, active, reduced, size, dragging } = state
    const nextItems = next ?? []
    let skip = skipEntrance && !hasEntered
    if (skip && options.entranceAfterHydration && active && nextItems.length) {
      const start = plan(nextItems).map(({ key, from }) => ({ key, value: from, phase: 'enter' as const, progress: 0 }))
      if (onServer) {
        // The server sends the entrance's start; the client plays it after hydration.
        items.value = start
        skipEntrance = false
        return
      }
      if (reduced === 'reduce') {
        // Hydrate the server's start state, then show the final state at once.
        items.value = start
        skipEntrance = false
        nextTick(() => snap(nextItems))
        hasEntered = true
        return
      }
      if (size === undefined) {
        // Hydrated but not measured yet: keep the server's start and draw once the real size
        // is known, so the entrance does not slide from the initial size.
        items.value = start
        return
      }
      // Start the entrance from the measured layout, not from the server's initial one.
      items.value = []
      skip = false
    }
    // A new size snaps. The first measurement replaces the initial size: an entrance still in
    // flight re-targets to it, but anything else (a hydrated server render, or a small update
    // after mount) snaps, instead of sliding from the initial size to the measured one.
    const resized = size !== undefined && size !== lastSize && (lastSize !== undefined || (hasEntered && !entering))
    lastSize = size ?? lastSize
    skipEntrance = false
    if (skip || !active || reduced === 'reduce' || resized || dragging) {
      hasEntered = true
      snap(nextItems)
      return
    }

    const steps = plan(nextItems)
    // The very first appearance uses the enter timing for every item.
    const first = !hasEntered
    const timing = (phase: TransitionPhase): PhaseTiming => first ? options.entrance ?? motionTokens.enter : motionTokens[options.connected ? 'update' : phase]
    hasEntered = true
    stop()
    // A change that interrupts the entrance (axes registering after mount) continues it.
    entering ||= first
    isAnimating.value = true
    options.onStart?.()

    const render = (progressOf: (phase: TransitionPhase) => number) => {
      items.value = steps.map(({ key, from, to, phase }) => {
        const t = progressOf(phase)
        return { key, phase, progress: t, value: t >= 1 ? to : options.interpolate(from, to, t) }
      })
    }
    const finish = () => {
      controls = undefined
      entering = false
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
