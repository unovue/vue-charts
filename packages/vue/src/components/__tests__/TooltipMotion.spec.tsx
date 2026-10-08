import { clock as motion } from '@/test/motionClock'
import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { MockResizeObserver } from '@/test/MockResizeObserver'

beforeEach(() => {
  motion.animations = []
  mockGetBoundingClientRect({ width: 400, height: 300 })
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})
async function setup() {
  const position = ref({ x: 10, y: 20 })
  const active = ref(true)
  const { container } = render(() => (
    <BarChart width={400} height={300} data={[{ name: 'A', value: 20 }]}>
      <XAxis dataKey="name" />
      <YAxis />
      <Bar dataKey="value" isAnimationActive={false} />
      <Tooltip active={active.value} defaultIndex={0} position={position.value} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  const tooltip = container.querySelector<HTMLElement>('[role="tooltip"]')!
  expect(tooltip).not.toBeNull()
  return { position, active, tooltip }
}
it('retargets the same springs without starting position tweens or reading tooltip layout per move', async () => {
  const view = await setup()
  const springs = motion.springs
  const animations = motion.animations.length
  const rect = vi.fn(() => new DOMRect(0, 0, 100, 40))
  Object.defineProperty(view.tooltip, 'getBoundingClientRect', { configurable: true, value: rect })
  const width = vi.spyOn(view.tooltip, 'offsetWidth', 'get')
  for (const x of [40, 80, 120, 60]) {
    view.position.value = { x, y: x / 2 }
    await nextTick()
  }
  expect(motion.springs).toBe(springs)
  expect(motion.animations).toHaveLength(animations)
  expect(rect).not.toHaveBeenCalled()
  expect(width).not.toHaveBeenCalled()
})
it('fades and scales on show, retains content through hide, then hides after 0.15 seconds', async () => {
  const view = await setup()
  expect(motion.animations.at(-1)?.values).toEqual({ opacity: [0, 1], scale: [0.96, 1] })
  expect(motion.animations.at(-1)?.options.duration).toBe(0.15)
  view.active.value = false
  await nextTick()
  expect(view.tooltip.style.visibility).toBe('visible')
  expect(view.tooltip.textContent).toContain('20')
  expect(motion.animations.at(-1)?.options.duration).toBe(0.15)
  motion.animations.at(-1)?.options.onComplete?.()
  await nextTick()
  expect(view.tooltip.style.visibility).toBe('hidden')
})
it('uses instant positioning and opacity-only visibility under reduced motion', async () => {
  motion.reduced = true
  const view = await setup()
  view.position.value = { x: 80, y: 40 }
  await nextTick()
  expect(view.tooltip.style.transform).toBe('translate(80px, 40px)')
  expect(motion.animations.at(-1)?.values).toEqual({ opacity: [0, 1] })
})
it('appears at its position instead of gliding in from the corner', async () => {
  const view = await setup()
  expect(view.tooltip.style.transform).toBe('translate(10px, 20px)')
  view.active.value = false
  await nextTick()
  motion.animations.at(-1)?.options.onComplete?.()
  view.position.value = { x: 90, y: 50 }
  view.active.value = true
  await nextTick()
  expect(view.tooltip.style.transform).toBe('translate(90px, 50px)')
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
