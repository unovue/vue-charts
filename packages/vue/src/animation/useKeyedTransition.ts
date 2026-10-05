import type { AnimationPlaybackControls } from 'motion-dom'
import { animate } from 'motion-v'
import { isEqual } from 'es-toolkit'
import { useReducedMotion } from '@/animation/useReducedMotion'
import type { ShallowRef } from 'vue'
import { getCurrentInstance, nextTick, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import type { ChartTransition, PhaseTiming } from './motion'
import { cascadeTiming, motionTokens } from './motion'
import { isServerRender, shouldSkipEntrance, useChartGesture, useChartInView, useChartSize, useSeriesMotion } from './renderPhase'

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
  /** The value between two states; `t` is eased progress; user springs may overshoot. */
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
  entrance?: () => PhaseTiming
  /**
   * A resize during the entrance: the item at its new place (`target`) that keeps the
   * entrance's own progress from `current` (e.g. how far a line is drawn). Without it a resize
   * ends the entrance at once.
   */
  keepEntrance?: (current: T, target: T) => T
  /**
   * Play the entrance after hydration instead of showing the final state at once. The server
   * renders the entrance's start (e.g. a line not drawn yet, bars on their baseline), so
   * hydration matches it. On by default for series; axes and grids follow them.
   */
  entranceAfterHydration?: boolean
  /**
   * The first appearance, when it differs from a later enter: where each item starts (`from`)
   * and, for a cascade, its turn (`order`, 0 first to 1 last). Items with an order start one
   * after another on the cascade timing; later changes are unaffected.
   */
  reveal?: () => Reveal<T> | undefined
  onStart?: () => void
  onEnd?: () => void
}

export interface Reveal<T> {
  from?: (to: T) => T
  order?: (to: T) => number
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
 *   at once without start/end callbacks.
 */
export function useKeyedTransition<T>(
  target: () => readonly T[] | undefined,
  options: KeyedTransitionOptions<T>,
): { items: ShallowRef<DisplayItem<T>[]>, isAnimating: ShallowRef<boolean> } {
  const items = shallowRef<DisplayItem<T>[]>([])
  const isAnimating = shallowRef(false)
  const reducedMotion = useReducedMotion()
  const component = getCurrentInstance()
  let mounted = component == null
  let skipEntrance = shouldSkipEntrance()
  const onServer = isServerRender()
  let hasEntered = false
  // A resize moves everything at once and repeats every frame while a box eases its size; the
  // chart then follows its box directly instead of trailing it.
  const chartSize = useChartSize()
  const gesture = useChartGesture()
  const inView = useChartInView()
  let lastSize: string | null | undefined
  let resizing = false
  // The first appearance is animating, on this clock (ms) and timing.
  let entering = false
  let entranceClock: { elapsed: number, timing: PhaseTiming } | undefined
  let turns = new Map<PropertyKey, number>()
  let lastTarget: readonly T[] | undefined
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
    items.value = keyed(next).map(({ key, value }) => ({ key, value, phase: 'update' as const }))
    isAnimating.value = false
  }

  function plan(next: readonly T[], reveal?: Reveal<T>): PlanItem<T>[] {
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
        ? { key, from: reveal?.from?.(to) ?? options.enterFrom(to, neighborsInNext(index)), to, phase: 'enter' }
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

  function transitionState() {
    return {
      next: target(),
      active: options.isActive(),
      reduced: reducedMotion.value,
      size: chartSize(),
      dragging: gesture.value,
      seen: inView.value,
    }
  }

  function update(state: ReturnType<typeof transitionState>) {
    // A getter that throws (e.g. a user dataKey function) leaves no state; keep what is drawn.
    if (!state)
      return
    const { next, active, reduced, size, dragging, seen } = state
    const nextItems = next ?? []
    // Keep the first render deterministic; start clocks only after the preference is known.
    if (!mounted && !onServer && active) {
      items.value = plan(nextItems, options.reveal?.()).map(({ key, from }) => ({
        key,
        value: from,
        phase: 'enter',
        progress: 0,
      }))
      return
    }
    let skip = skipEntrance && !hasEntered
    if (skip && (options.entranceAfterHydration ?? !options.followsSeries) && active && nextItems.length) {
      const start = plan(nextItems, options.reveal?.()).map(({ key, from }) => ({ key, value: from, phase: 'enter' as const, progress: 0 }))
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
      if (size === null || !seen) {
        // Hydrated but not measured or not on screen yet: keep the server's start and draw once
        // the real size is known and the reader can see it.
        items.value = start
        return
      }
      // Start the entrance from the measured layout, not from the server's initial one.
      items.value = []
      skip = false
    }
    // A responsive chart that has not measured itself is invisible: its entrance waits for the
    // real size instead of playing at the initial one and sliding when the size arrives. A chart
    // off screen waits until it scrolls into view.
    if ((size === null || !seen) && !skip && !hasEntered && !onServer && active && reduced !== 'reduce') {
      items.value = []
      return
    }
    // A new size snaps. The first measurement replaces the initial size: an entrance still in
    // flight re-targets to it, but anything else (a hydrated server render, or a small update
    // after mount) snaps, instead of sliding from the initial size to the measured one.
    const resized = size != null && size !== lastSize && (lastSize !== undefined || (hasEntered && !entering))
    lastSize = size ?? lastSize
    skipEntrance = false
    // Layout that follows a resize a step later (axis offsets, bar positions) is part of the
    // resize until the next frame, instead of sliding from the old size.
    if (resized) {
      resizing = true
      if (typeof requestAnimationFrame === 'function')
        requestAnimationFrame(() => { resizing = false })
      else
        resizing = false
    }
    const followsResize = resizing && !resized
    let keepDrawing = false
    if ((resized || followsResize) && entering && options.keepEntrance && active && reduced !== 'reduce' && !dragging) {
      // Take the new layout at once and let the entrance carry on from where it was.
      const current = new Map(items.value.map(item => [item.key, item.value]))
      items.value = keyed(nextItems).map(({ key, value }) => {
        const shown = current.get(key)
        return { key, phase: 'update' as const, value: shown === undefined ? value : options.keepEntrance!(shown, value) }
      })
      keepDrawing = true
    }
    if (skip || !active || reduced === 'reduce' || ((resized || followsResize) && !keepDrawing) || dragging) {
      hasEntered = true
      snap(nextItems)
      return
    }

    // The very first appearance uses the enter timing for every item, or a cascade.
    const first = !hasEntered
    if (!first && isEqual(nextItems, lastTarget))
      return
    lastTarget = nextItems
    const reveal = first ? options.reveal?.() : undefined
    const steps = plan(nextItems, reveal)
    if (!first && steps.every(step => step.phase === 'update' && isEqual(step.from, step.to))) {
      stop()
      entering = false
      isAnimating.value = false
      settle(steps)
      return
    }
    const cascade = first ? reveal?.order && !options.entrance : entering && turns.size > 0
    if (first) {
      turns = new Map(cascade
        ? steps.map(step => [step.key, clamp01(reveal!.order!(step.to)) * cascadeTiming.spread * cascadeTiming.duration])
        : [])
    }
    const elapsedBefore = entering ? entranceClock?.elapsed ?? 0 : 0
    let entrance = first ? options.entrance?.() ?? (cascade ? cascadeTiming : motionTokens.enter) : undefined
    if (first) {
      entranceClock = { elapsed: 0, timing: entrance! }
    }
    else if (entering && entranceClock) {
      // Continue from the animation's own clock, even if the wall clock jumps.
      const rest = continueTiming(entranceClock.timing, elapsedBefore)
      if (rest.duration >= motionTokens.update.duration)
        entrance = rest
    }
    const timing = (phase: TransitionPhase): PhaseTiming => entrance ?? motionTokens[options.connected ? 'update' : phase]
    hasEntered = true
    stop()
    // A change that interrupts the entrance (axes registering after mount) continues it.
    entering ||= first
    isAnimating.value = true
    options.onStart?.()

    const render = (progressOf: (step: PlanItem<T>) => number) => {
      items.value = steps.map((step) => {
        const { key, from, to, phase } = step
        const t = progressOf(step)
        return { key, phase, progress: clamp01(t), value: options.interpolate(from, to, t) }
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

    // One linear clock in seconds; each phase applies its own duration and curve. In a cascade
    // each item waits for its turn and then takes the rest of the entrance.
    const total = Math.max(...steps.map(s => timing(s.phase).duration), 0)
    const cascadeItem = cascadeTiming.duration * (1 - cascadeTiming.spread)
    render(() => 0)
    controls = animate(0, total, {
      duration: total,
      ease: 'linear',
      onUpdate: (elapsed) => {
        if (entering && entranceClock)
          entranceClock.elapsed = elapsedBefore + elapsed
        render((step) => {
          const delay = entrance && cascade ? turns.get(step.key) : undefined
          if (delay !== undefined) {
            const start = cascadeTiming.ease(clamp01((elapsedBefore - delay) / cascadeItem))
            const current = cascadeTiming.ease(clamp01((elapsedBefore + elapsed - delay) / cascadeItem))
            return start >= 1 ? 1 : (current - start) / (1 - start)
          }
          const { duration, ease } = timing(step.phase)
          return ease(clamp01(elapsed / duration))
        })
      },
      onComplete: finish,
    })
  }

  watch(transitionState, update, { immediate: true })
  if (component) {
    onMounted(() => {
      mounted = true
      if (options.isActive() && reducedMotion.value !== 'reduce') {
        items.value = []
        update(transitionState())
      }
    })
  }

  onScopeDispose(stop)
  return { items, isAnimating }
}

/**
 * The rest of a timing already `elapsed` seconds in, as a timing of its own: eased progress
 * from where it is now to 1 that follows the original curve exactly.
 */
function continueTiming({ duration, ease }: PhaseTiming, elapsed: number): PhaseTiming {
  const done = Math.min(1, Math.max(0, elapsed / duration))
  const from = ease(done)
  if (done >= 1 || from >= 1)
    return { duration: 0.001, ease: () => 1 }
  return {
    duration: duration * (1 - done),
    ease: t => (ease(done + t * (1 - done)) - from) / (1 - from),
  }
}
