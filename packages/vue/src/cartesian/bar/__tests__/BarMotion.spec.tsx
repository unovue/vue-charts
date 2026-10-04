import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

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

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
})

it('slides bars of a shifted window in and out with their neighbours', async () => {
  const rows = ref(['A', 'B', 'C'].map((name, i) => ({ name, value: 10 + i })))
  const { container } = render(() => (
    <BarChart width={400} height={300} data={rows.value}>
      <XAxis dataKey="name" />
      <Bar dataKey="value" />
    </BarChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  const x = () => [...container.querySelectorAll('.v-charts-bar-rectangle path')].map(path => Number(path.getAttribute('d')!.match(/^M\s*(-?[\d.]+)/)![1]))
  const [a, b] = x()
  const band = b - a
  rows.value = ['B', 'C', 'D'].map((name, i) => ({ name, value: 11 + i }))
  await nextTick()
  clock.update(clock.to / 2)
  await nextTick()
  // Order on screen: A (leaving), B, C, D (entering). All move left by the same distance.
  const [leaving, staying] = x()
  expect(staying - b).toBeLessThan(-band / 4)
  expect(leaving - a).toBeCloseTo(staying - b, 0)
})
