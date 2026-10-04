import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { motionTokens } from '../motion'
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

function setup(initial: BarItem[], options: { active?: boolean } = {}) {
  const data = shallowRef<BarItem[]>(initial)
  const scope = effectScope()
  const result = scope.run(() => useKeyedTransition(() => data.value, {
    key: item => item.name,
    interpolate: (from, to, t) => ({ ...to, height: from.height + (to.height - from.height) * t }),
    enterFrom: to => ({ ...to, height: 0 }),
    exitTo: from => ({ ...from, height: 0 }),
    isActive: () => options.active ?? true,
  }))!
  const view = () => result.items.value.map(i => `${String(i.key)}:${i.phase}:${Math.round(i.value.height)}`)
  return { data, view, result, scope }
}

afterEach(() => {
  clock.runs = []
})

describe('useKeyedTransition', () => {
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

  it('gives repeated keys distinct identities', () => {
    const { view } = setup([{ name: 'A', height: 1 }, { name: 'A', height: 2 }])
    finish()
    expect(view()).toEqual(['A:update:1', 'A#1:update:2'])
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
