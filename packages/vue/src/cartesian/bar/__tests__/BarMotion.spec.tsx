import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const clock = vi.hoisted(() => ({ update: (_v: number) => {}, to: 0, runs: 0 }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: unknown, to: number, options: { onUpdate: (v: number) => void }) => {
    if (typeof from === 'number') {
      clock.runs++
      clock.update = options.onUpdate
      clock.to = to
    }
    return { stop() {} }
  },
}))

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
})

it('lets removed categories close between their neighbours without covering any bar', async () => {
  const rows = ref(['A', 'B', 'C', 'D', 'E'].map((name, i) => ({ name, a: 10 + i, b: 20 - i })))
  const { container } = render(() => (
    <BarChart width={400} height={300} data={rows.value}>
      <XAxis dataKey="name" />
      <Bar dataKey="a" />
      <Bar dataKey="b" />
    </BarChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  rows.value = rows.value.filter(row => row.name !== 'B' && row.name !== 'C')
  await nextTick()
  for (const progress of [0.25, 0.5, 0.75]) {
    clock.update(clock.to * progress)
    await nextTick()
    const spans = [...container.querySelectorAll('.v-charts-bar-rectangle path')]
      .map(path => [Number(path.getAttribute('x')), Number(path.getAttribute('x')) + Number(path.getAttribute('width'))])
      .sort(([a], [b]) => a - b)
    for (let i = 1; i < spans.length; i++)
      expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i - 1][1] - 0.01)
  }
})

it('keeps value labels on the moving bars and shows the new values at once', async () => {
  const rows = ref([{ name: 'A', value: 10 }, { name: 'B', value: 20 }])
  const { container } = render(() => (
    <BarChart width={400} height={300} data={rows.value}>
      <XAxis dataKey="name" />
      <Bar dataKey="value" label />
    </BarChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  rows.value = [{ name: 'A', value: 30 }, { name: 'B', value: 5 }]
  await nextTick()
  clock.update(clock.to / 2)
  await nextTick()
  await nextTick()
  const labels = [...container.querySelectorAll('.v-charts-label')].map(label => label.textContent)
  expect(labels).toEqual(['30', '5'])
})

it('lets the bars of a series hidden from the legend collapse instead of vanishing', async () => {
  const hide = ref(false)
  const { container } = render(() => (
    <BarChart width={400} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      <XAxis dataKey="name" />
      <Bar dataKey="value" hide={hide.value} />
    </BarChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  const bars = () => container.querySelectorAll('.v-charts-bar-rectangle path')
  expect(bars()).toHaveLength(2)
  hide.value = true
  await nextTick()
  clock.update(clock.to / 8)
  await nextTick()
  expect(bars()).toHaveLength(2)
})

it('follows a resize at once instead of trailing behind the box', async () => {
  const width = ref(400)
  const { container } = render(() => (
    <BarChart width={width.value} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      <XAxis dataKey="name" />
      <Bar dataKey="value" />
    </BarChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  const runs = clock.runs
  width.value = 200
  await nextTick()
  await nextTick()
  expect(clock.runs).toBe(runs)
  const right = Math.max(...[...container.querySelectorAll('.v-charts-bar-rectangle path')].map(path => Number(path.getAttribute('x')) + Number(path.getAttribute('width'))))
  expect(right).toBeLessThanOrEqual(200)
})
