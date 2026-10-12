import { clock } from '@/test/motionClock'
import { expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { usePointTransition } from '../usePointTransition'

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

it('sweeps a path out when its data empties and back in when it returns', async () => {
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
  data.value = []
  await nextTick()
  clock.update(0.5)
  expect(display.reveal.value).toBe(0.5)
  clock.finish()
  data.value = [{ x: 40, y: 30 }, { x: 80, y: 40 }]
  await nextTick()
  clock.update(0.25)
  expect(display.reveal.value).toBe(0.25)
  expect(display.points.value.map(point => point.y)).toEqual([30, 40])
  scope.stop()
})

it('folds a hidden series with a baseline onto it', async () => {
  const hidden = shallowRef(false)
  const scope = effectScope()
  const display = scope.run(() => usePointTransition(() => [{ x: 40, y: 10 }, { x: 80, y: 20 }], {
    key: (_point, index) => index,
    baseline: () => 100,
    hidden: () => hidden.value,
    isActive: () => true,
    transition: () => ({ duration: 1, ease: 'linear' }),
    onStart: () => {},
    onEnd: () => {},
  }))!
  clock.finish()
  hidden.value = true
  await nextTick()
  clock.update(0.5)
  expect(display.points.value.map(point => point.y)).toEqual([55, 60])
  scope.stop()
})

it('keeps the same points while only the entrance sweep moves, so the path is not rebuilt', async () => {
  const scope = effectScope()
  const display = scope.run(() => usePointTransition(() => [{ x: 40, y: 10 }, { x: 80, y: 20 }], {
    key: (_point, index) => index,
    isActive: () => true,
    transition: () => ({ duration: 1, ease: 'linear' }),
    onStart: () => {},
    onEnd: () => {},
  }))!
  clock.update(0.2)
  const first = display.points.value
  clock.update(0.6)
  expect(display.reveal.value).toBe(0.6)
  expect(display.points.value).toBe(first)
  scope.stop()
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
