import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, h, nextTick, shallowRef } from 'vue'
import { cascadeTiming, motionTokens } from '../motion'
import type { KeyedTransitionOptions } from '../useKeyedTransition'
import { useKeyedTransition } from '../useKeyedTransition'

// A controllable clock in place of motion-v's frame loop, which does not run in JSDOM.
const clock = vi.hoisted(() => ({
  runs: [] as Array<{ to: number, onUpdate: (v: number) => void, onComplete: () => void, stopped: boolean }>,
}))
vi.mock('motion-v', async (original) => {
  const actual = await original<typeof import('motion-v')>()
  return {
    ...actual,
    animate: (_from: number, to: number, options: { onUpdate: (v: number) => void, onComplete: () => void }) => {
      const run = { to, onUpdate: options.onUpdate, onComplete: options.onComplete, stopped: false }
      clock.runs.push(run)
      return { stop: () => { run.stopped = true } }
    },
  }
})

function at(seconds: number) {
  const run = clock.runs.at(-1)!
  run.onUpdate(Math.min(seconds, run.to))
}
function finish() {
  const run = clock.runs.at(-1)!
  run.onUpdate(run.to)
  run.onComplete()
}

interface BarItem { name: string, height: number }

function setup(initial: BarItem[], options: { active?: boolean } & Partial<KeyedTransitionOptions<BarItem>> = {}) {
  const data = shallowRef<BarItem[]>(initial)
  const scope = effectScope()
  const result = scope.run(() => useKeyedTransition(() => data.value, {
    key: item => item.name,
    interpolate: (from, to, t) => ({ ...to, height: from.height + (to.height - from.height) * t }),
    enterFrom: to => ({ ...to, height: 0 }),
    exitTo: from => ({ ...from, height: 0 }),
    isActive: () => options.active ?? true,
    ...options,
  }))!
  const view = () => result.items.value.map(i => `${String(i.key)}:${i.phase}:${Math.round(i.value.height)}`)
  return { data, view, result, scope }
}

afterEach(() => {
  clock.runs = []
})

describe('useKeyedTransition', () => {
  // An equal refresh must not replay motion or emit a phantom lifecycle.
  it('does not animate an equal copy, including during entrance', async () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const active = shallowRef(true)
    const { data, result } = setup([{ name: 'A', height: 100 }], { onStart, onEnd, isActive: () => active.value })
    at(0.3)
    onStart.mockClear()
    data.value = [{ name: 'A', height: 100 }]
    await nextTick()
    expect(clock.runs).toHaveLength(1)
    expect(onStart).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
    finish()
    onEnd.mockClear()
    data.value = [{ name: 'A', height: 100 }]
    await nextTick()
    expect(clock.runs).toHaveLength(1)
    expect(onStart).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
    active.value = false
    data.value = [{ name: 'A', height: 200 }]
    await nextTick()
    active.value = true
    data.value = [{ name: 'A', height: 100 }]
    await nextTick()
    expect(result.isAnimating.value).toBe(true)
    finish()
    expect(result.items.value[0].value.height).toBe(100)
  })

  it('keeps an unstarted cascade item waiting after a change', async () => {
    const { data, result } = setup([{ name: 'A', height: 100 }, { name: 'B', height: 100 }], {
      reveal: () => ({ order: to => to.name === 'A' ? 0 : 1 }),
    })
    at(0.3)
    data.value = [{ name: 'A', height: 200 }, { name: 'B', height: 200 }]
    await nextTick()
    at(0.1)
    expect(result.items.value[1].progress).toBe(0)
    expect(result.items.value[1].value.height).toBe(0)
  })

  it('lets a user spring interpolate beyond its target', () => {
    const { result } = setup([{ name: 'A', height: 100 }], { transition: () => ({ type: 'spring' }) })
    clock.runs.at(-1)!.onUpdate(1.1)
    expect(result.items.value[0].value.height).toBeCloseTo(110)
    expect(result.items.value[0].progress).toBe(1)
    expect(result.isAnimating.value).toBe(true)
    finish()
    expect(result.items.value[0].value.height).toBe(100)
  })

  it('does not emit animation callbacks when snapping', async () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { data } = setup([{ name: 'A', height: 100 }], { active: false, onStart, onEnd })
    data.value = [{ name: 'A', height: 200 }]
    await nextTick()
    expect(onStart).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
    const { render } = await import('@testing-library/vue')
    const { Heatmap } = await import('@/index')
    const width = shallowRef(300)
    render(() => h(Heatmap, {
      'width': width.value,
      'height': 100,
      'data': [{ x: 'A', y: 'B', value: 100 }],
      'onAnimation-start': onStart,
      'onAnimation-end': onEnd,
    }))
    await nextTick()
    finish()
    await nextTick()
    onStart.mockClear()
    onEnd.mockClear()
    width.value = 400
    await nextTick()
    expect(onStart).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('continues entrance when the wall clock jumps ahead', async () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const { data } = setup([{ name: 'A', height: 100 }])
    at(0.3)
    now.mockReturnValue(10_000)
    data.value = [{ name: 'A', height: 200 }]
    await nextTick()
    expect(clock.runs.at(-1)!.to).toBeCloseTo(0.7)
    now.mockRestore()
  })

  // A cascade that played every item at once, or restarted it on the next change, would look
  // like the plain grow it replaces.
  it('plays a cascade entrance one item after another, then updates together', async () => {
    const { data, view } = setup([{ name: 'A', height: 100 }, { name: 'B', height: 100 }], {
      reveal: () => ({ from: to => ({ ...to, height: 50 }), order: to => to.name === 'A' ? 0 : 1 }),
    })
    expect(view()).toEqual(['A:enter:50', 'B:enter:50'])
    // B waits for its turn at spread × duration while A is under way.
    at(cascadeTiming.spread * cascadeTiming.duration)
    expect(view()[0]).not.toBe('A:enter:50')
    expect(view()[1]).toBe('B:enter:50')
    at(cascadeTiming.duration)
    expect(view()).toEqual(['A:enter:100', 'B:enter:100'])
    finish()
    data.value = [{ name: 'A', height: 20 }, { name: 'B', height: 20 }]
    await nextTick()
    at(motionTokens.update.duration)
    expect(view()).toEqual(['A:update:20', 'B:update:20'])
  })

  // A data change in the entrance's last moments inherited the few milliseconds left and
  // snapped (a bar list re-ranking 0.9 s after mount finished in 50 ms).
  it('gives a change near the end of the entrance its full update time', async () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const { data, view } = setup([{ name: 'A', height: 100 }])
    at(motionTokens.enter.duration * 0.95)
    now.mockReturnValue(motionTokens.enter.duration * 950)
    data.value = [{ name: 'A', height: 0 }]
    await nextTick()
    at(motionTokens.update.duration / 2)
    expect(view()[0]).not.toBe('A:update:0')
    now.mockRestore()
  })

  it('enters from the start state and lands on the target', () => {
    const { view } = setup([{ name: 'A', height: 100 }])
    expect(view()).toEqual(['A:enter:0'])
    at(motionTokens.enter.duration)
    expect(view()).toEqual(['A:enter:100'])
    finish()
    expect(view()).toEqual(['A:update:100'])
  })

  it('matches items by key when a row is inserted at the front', async () => {
    const { data, view } = setup([{ name: 'B', height: 50 }, { name: 'C', height: 80 }])
    finish()
    data.value = [{ name: 'A', height: 10 }, { name: 'B', height: 50 }, { name: 'C', height: 80 }]
    await nextTick()
    // B and C keep their own values; only A enters.
    expect(view()).toEqual(['A:enter:0', 'B:update:50', 'C:update:80'])
  })

  it('keeps exiting items until they have left', async () => {
    const { data, view } = setup([{ name: 'A', height: 40 }, { name: 'B', height: 60 }])
    finish()
    data.value = [{ name: 'A', height: 40 }]
    await nextTick()
    expect(view()).toEqual(['A:update:40', 'B:exit:60'])
    at(motionTokens.exit.duration)
    expect(view()).toEqual(['A:update:40', 'B:exit:0'])
    finish()
    expect(view()).toEqual(['A:update:40'])
  })

  it('starts an interrupting change from what is on screen', async () => {
    const { data, view } = setup([{ name: 'A', height: 0 }])
    finish()
    data.value = [{ name: 'A', height: 100 }]
    await nextTick()
    at(motionTokens.update.duration / 2)
    const midway = Number(view()[0].split(':')[2])
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(100)

    data.value = [{ name: 'A', height: 20 }]
    await nextTick()
    expect(clock.runs.at(-2)!.stopped).toBe(true)
    expect(view()).toEqual([`A:update:${midway}`])
  })

  it('stops and snaps an in-flight transition when animation is disabled', async () => {
    const active = shallowRef(true)
    const result = effectScope().run(() => useKeyedTransition(() => [{ name: 'A', height: 100 }], {
      key: item => item.name,
      interpolate: (from, to, t) => ({ ...to, height: from.height + (to.height - from.height) * t }),
      enterFrom: to => ({ ...to, height: 0 }),
      exitTo: from => ({ ...from, height: 0 }),
      isActive: () => active.value,
    }))!
    at(0.1)
    active.value = false
    await nextTick()
    expect(clock.runs.at(-1)!.stopped).toBe(true)
    expect(result.items.value[0].value.height).toBe(100)
    expect(result.isAnimating.value).toBe(false)
  })

  it('gives repeated keys distinct identities', () => {
    const { view } = setup([{ name: 'A', height: 1 }, { name: 'A', height: 2 }])
    finish()
    expect(view()).toEqual(['A:update:1', 'A\u00001:update:2'])
  })

  it('keeps duplicate categories separate from literal suffix categories on update', async () => {
    const { data, result, scope } = setup([{ name: 'A', height: 10 }, { name: 'A', height: 20 }, { name: 'A#1', height: 30 }])
    finish()
    expect(new Set(result.items.value.map(item => item.key)).size).toBe(3)
    data.value = [{ name: 'A', height: 40 }, { name: 'A', height: 50 }, { name: 'A#1', height: 60 }]
    await nextTick()
    expect(result.items.value.map(item => item.value.height)).toEqual([10, 20, 30])
    finish()
    expect(result.items.value.map(item => item.value.height)).toEqual([40, 50, 60])
    scope.stop()
  })

  it('shows the target at once when animation is off', () => {
    const { view } = setup([{ name: 'A', height: 100 }], { active: false })
    expect(view()).toEqual(['A:update:100'])
    expect(clock.runs).toHaveLength(0)
  })
})

describe('useKeyedTransition neighbours', () => {
  interface Point { name: string, x: number }
  function setupPoints(initial: Point[]) {
    const data = shallowRef<Point[]>(initial)
    const result = effectScope().run(() => useKeyedTransition(() => data.value, {
      key: p => p.name,
      interpolate: (from, to, t) => ({ ...to, x: from.x + (to.x - from.x) * t }),
      // A new point grows out of its on-screen neighbour; a removed one folds into it.
      enterFrom: (to, { previous, next }) => ({ ...to, x: (previous ?? next ?? to).x }),
      exitTo: (from, { previous, next }) => ({ ...from, x: (previous ?? next ?? from).x }),
      isActive: () => true,
    }))!
    const view = () => result.items.value.map(i => `${String(i.key)}:${Math.round(i.value.x)}`)
    return { data, view }
  }

  it('grows an appended point out of its on-screen neighbour', async () => {
    const { data, view } = setupPoints([{ name: 'A', x: 0 }, { name: 'B', x: 100 }])
    finish()
    data.value = [{ name: 'A', x: 0 }, { name: 'B', x: 50 }, { name: 'C', x: 100 }]
    await nextTick()
    expect(view()).toEqual(['A:0', 'B:100', 'C:100'])
  })

  it('folds a removed point into its remaining neighbour at its new position', async () => {
    const { data, view } = setupPoints([{ name: 'A', x: 0 }, { name: 'B', x: 50 }, { name: 'C', x: 100 }])
    finish()
    data.value = [{ name: 'A', x: 0 }, { name: 'B', x: 80 }]
    await nextTick()
    at(motionTokens.update.duration)
    expect(view()).toEqual(['A:0', 'B:80', 'C:80'])
    finish()
    expect(view()).toEqual(['A:0', 'B:80'])
  })
})

describe('useKeyedTransition order', () => {
  function setupOrder(initial: string[]) {
    const data = shallowRef(initial.map(name => ({ name, height: 10 })))
    const result = effectScope().run(() => useKeyedTransition(() => data.value, {
      key: item => item.name,
      interpolate: (_from, to) => to,
      enterFrom: to => to,
      exitTo: from => from,
      isActive: () => true,
    }))!
    const view = () => result.items.value.map(i => `${String(i.key)}:${i.phase}`)
    return { data, view }
  }

  // Lines and areas draw a path through the items in list order.
  it('keeps exiting items in their old place between the items that stay', async () => {
    const { data, view } = setupOrder(['A', 'B', 'C', 'D', 'E'])
    finish()
    data.value = ['A', 'D'].map(name => ({ name, height: 10 }))
    await nextTick()
    expect(view()).toEqual(['A:update', 'B:exit', 'C:exit', 'D:update', 'E:exit'])
  })

  it('lets an item that is still leaving return from where it is', async () => {
    const { data, view } = setupOrder(['A', 'B'])
    finish()
    data.value = [{ name: 'A', height: 10 }]
    await nextTick()
    data.value = [{ name: 'A', height: 10 }, { name: 'B', height: 10 }]
    await nextTick()
    expect(view()).toEqual(['A:update', 'B:update'])
  })
})

describe('useKeyedTransition scale', () => {
  it('uses the enter timing for the first appearance of a connected path', () => {
    effectScope().run(() => useKeyedTransition(() => [{ x: 1 }], {
      key: (_, i) => i,
      interpolate: (_from, to) => to,
      enterFrom: to => to,
      exitTo: from => from,
      isActive: () => true,
      connected: true,
    }))
    expect(clock.runs.at(-1)!.to).toBe(motionTokens.enter.duration)
  })

  it('plans 50,000 entering and leaving items in linear time', async () => {
    const data = shallowRef(Array.from({ length: 50_000 }, (_, i) => ({ name: `a${i}`, height: i })))
    const started = performance.now()
    setupPlain(data)
    finish()
    data.value = Array.from({ length: 50_000 }, (_, i) => ({ name: `b${i}`, height: i }))
    await nextTick()
    // Quadratic neighbour scans took seconds here; linear passes take a few tens of ms.
    expect(performance.now() - started).toBeLessThan(1500)
  })
})

function setupPlain(data: { value: BarItem[] }) {
  return effectScope().run(() => useKeyedTransition(() => data.value, {
    key: item => item.name,
    interpolate: (_from, to) => to,
    enterFrom: to => to,
    exitTo: from => from,
    isActive: () => true,
  }))!
}
