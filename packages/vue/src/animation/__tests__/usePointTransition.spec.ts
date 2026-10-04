import { expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { usePointTransition } from '../usePointTransition'

const clock = vi.hoisted(() => ({ finish: () => {}, update: (_t: number) => {} }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (_from: number, _to: number, options: { onUpdate: (t: number) => void, onComplete: () => void }) => {
    clock.update = options.onUpdate
    clock.finish = options.onComplete
    return { stop() {} }
  },
}))

it('preserves vertical gaps when either endpoint has a null x', async () => {
  const data = shallowRef([{ x: 40, y: 10 }, { x: 80, y: 20 }])
  const scope = effectScope()
  const display = scope.run(() => usePointTransition(() => data.value, {
    key: (_point, index) => index,
    isActive: () => true,
    transition: () => ({ duration: 1, ease: 'linear' }),
    onStart: () => {},
    onEnd: () => {},
  }))!
  clock.finish()
  // Vertical selectors produce null coordinates for missing values despite Point's numeric type.
  // @ts-expect-error Exercise the runtime gap emitted by vertical layouts.
  data.value = [{ x: null, y: 10 }, { x: 80, y: 20 }]
  await nextTick()
  clock.update(0.5)
  expect(display.points.value.map(point => point.x)).toEqual([null, 80])
  clock.finish()
  data.value = [{ x: 60, y: 10 }, { x: 80, y: 20 }]
  await nextTick()
  clock.update(0.5)
  expect(display.points.value.map(point => point.x)).toEqual([60, 80])
  scope.stop()
})
