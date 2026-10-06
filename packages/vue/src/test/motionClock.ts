import { beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

interface Options {
  onUpdate?: (value: number) => void
  onComplete?: () => void
  duration?: number
}
interface Run {
  to: number
  update: (value: number) => void
  complete: () => void
  stopped: boolean
  duration?: number
}
function noop() {}

export const clock = {
  reduced: false,
  springs: 0,
  runs: [] as Run[],
  animations: [] as Array<{ target: unknown, values: unknown, options: Options }>,
  get update(): (value: number) => void { return this.runs.at(-1)?.update ?? noop },
  get finish(): () => void { return this.runs.at(-1)?.complete ?? noop },
  get to(): number { return this.runs.at(-1)?.to ?? 0 },
  get duration(): number { return this.runs.at(-1)?.duration ?? 0 },
}

beforeEach(() => {
  clock.runs = []
  clock.animations = []
  clock.reduced = false
  clock.springs = 0
})

export function mockMotion(actual: typeof import('motion-v')) {
  return {
    ...actual,
    useSpring: (...args: Parameters<typeof actual.useSpring>) => {
      clock.springs++
      return actual.useSpring(...args)
    },
    // Only the external clock is replaced; interpolation and chart rendering remain real.
    animate: (target: unknown, values: unknown, options: Options) => {
      clock.animations.push({ target, values, options })
      if (typeof target !== 'number' || typeof values !== 'number')
        return { stop: noop }
      const run = {
        to: values,
        update: options.onUpdate ?? noop,
        complete: () => options.onComplete?.(),
        stopped: false,
        duration: options.duration,
      }
      clock.runs.push(run)
      return { stop: () => { run.stopped = true } }
    },
  }
}

export function mockVueUse(actual: typeof import('@vueuse/core')) {
  return {
    ...actual,
    usePreferredReducedMotion: () => ref(clock.reduced ? 'reduce' : 'no-preference'),
  }
}

export async function frame(seconds?: number) {
  for (const run of clock.runs.filter(run => !run.stopped)) {
    run.update(seconds ?? run.to)
    if (seconds == null) {
      run.stopped = true
      run.complete()
    }
  }
  await nextTick()
}
