import { expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { Bar, BarChart, XAxis } from '@/index'
import { MockResizeObserver } from '@/test/MockResizeObserver'

const clock = vi.hoisted(() => ({ update: (_v: number) => {}, to: 0 }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: unknown, to: number, options: { onUpdate: (v: number) => void }) => {
    if (typeof from === 'number') {
      clock.update = options.onUpdate
      clock.to = to
    }
    return { stop() {} }
  },
}))

// A responsive chart mounted on the client (e.g. inside <ClientOnly>) played its entrance at the
// initial 640x360 size and slid into place when the real size arrived. It now waits for it.
it('starts a client-side entrance at the measured size', async () => {
  MockResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  const container = document.createElement('div')
  document.body.append(container)
  const data = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]
  const app = createApp({ render: () => (
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <Bar dataKey="value" />
    </BarChart>
  ) })
  app.mount(container)
  await nextTick()
  clock.update(clock.to / 4)
  await nextTick()
  MockResizeObserver.instances.at(-1)!.trigger(345, 250)
  await nextTick()
  await nextTick()
  // Just after the size arrives: nothing may start from outside the measured box.
  clock.update(clock.to * 0.02)
  await nextTick()
  const bars = [...container.querySelectorAll('.v-charts-bar-rectangle path')]
  expect(bars.length).toBe(2)
  for (const bar of bars)
    expect(Number(bar.getAttribute('y')) + Number(bar.getAttribute('height'))).toBeLessThanOrEqual(250)
  app.unmount()
  container.remove()
})

// Charts further down the page played their entrance at load, unseen; it now waits until the
// chart scrolls into view.
it('starts the entrance when the chart scrolls into view', async () => {
  let reveal: (ratio: number) => void = () => {}
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      reveal = ratio => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio, intersectionRect: { height: 300 * ratio } as DOMRectReadOnly, rootBounds: { height: 800 } as DOMRectReadOnly }])
    }

    observe() {}
    disconnect() {}
  })
  const container = document.createElement('div')
  document.body.append(container)
  const app = createApp({ render: () => (
    <BarChart width={400} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      <Bar dataKey="value" />
    </BarChart>
  ) })
  app.mount(container)
  clock.to = 0
  await nextTick()
  const bars = () => container.querySelectorAll('.v-charts-bar-rectangle path').length
  // Not on screen yet: no entrance has started and nothing is drawn.
  expect(clock.to).toBe(0)
  expect(bars()).toBe(0)
  reveal(0.1)
  await nextTick()
  expect(clock.to).toBe(0)
  reveal(0.3)
  await nextTick()
  await nextTick()
  expect(clock.to).toBeGreaterThan(0)
  clock.update(clock.to)
  await nextTick()
  expect(bars()).toBe(2)
  app.unmount()
  container.remove()
  vi.unstubAllGlobals()
})
