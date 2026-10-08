import { clock } from '@/test/motionClock'
import { expect, it, vi } from 'vitest'
import { createApp, createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, BarList, XAxis } from '@/index'
import { MockResizeObserver } from '@/test/MockResizeObserver'

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
it.each([
  {
    name: 'BarChart',
    chart: () => (
      <BarChart width={400} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
        <Bar dataKey="value" />
      </BarChart>
    ),
    shapes: '.v-charts-bar-rectangle path',
  },
  // BarList is plain HTML without the chart wrapper, so it watches the screen on its own.
  { name: 'BarList', chart: () => <BarList data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]} />, shapes: '.v-charts-bar-list-row' },
])('$name starts its entrance when it scrolls into view', async ({ chart, shapes }) => {
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
  const app = createApp({ render: chart })
  app.mount(container)
  clock.runs = []
  await nextTick()
  const bars = () => container.querySelectorAll(shapes).length
  // Not on screen yet: no entrance has started and nothing is drawn.
  expect(clock.to).toBe(0)
  expect(bars()).toBe(0)
  reveal(0.3)
  await nextTick()
  expect(clock.to).toBe(0)
  reveal(0.5)
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

// A server-rendered BarList (no chart wrapper, so no chart size) kept the server's empty bars
// forever: hydration waited for a size that never comes outside a chart.
it('plays a hydrated BarList entrance', async () => {
  const view = () => <BarList data={[{ name: 'a', value: 2 }, { name: 'b', value: 1 }]} />
  const container = document.createElement('div')
  container.innerHTML = await renderToString(createSSRApp({ render: view }))
  document.body.append(container)
  const width = () => container.querySelector<HTMLElement>('.v-charts-bar-list-bar')!.style.width
  expect(width()).toBe('0%')
  clock.runs = []
  const app = createSSRApp({ render: view })
  app.mount(container)
  await nextTick()
  await nextTick()
  expect(clock.to).toBeGreaterThan(0)
  clock.update(clock.to)
  await nextTick()
  expect(width()).toBe('100%')
  app.unmount()
  container.remove()
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
