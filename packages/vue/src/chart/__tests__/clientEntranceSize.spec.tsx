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
