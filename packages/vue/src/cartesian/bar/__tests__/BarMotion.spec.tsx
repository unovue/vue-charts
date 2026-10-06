import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const clock = vi.hoisted(() => ({ update: (_v: number) => {}, to: 0, runs: 0, duration: 0 }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: unknown, to: number, options: { onUpdate: (v: number) => void, duration?: number }) => {
    if (typeof from === 'number') {
      clock.runs++
      clock.duration = options.duration ?? 0
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

it.each([
  { chart: false, item: undefined, height: '100' },
  { chart: false, item: true, height: null },
  { chart: true, item: false, height: '100' },
  { chart: true, item: undefined, height: null },
])('resolves chart animation $chart and item override $item on the first frame', async ({ chart, item, height }) => {
  const { container } = render(() => (
    <BarChart width={200} height={100} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} data={[{ value: 12 }]} isAnimationActive={chart}>
      <Bar dataKey="value" isAnimationActive={item} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(container.querySelector('.v-charts-bar-rectangle path')?.getAttribute('height') ?? null).toBe(height)
})

it.each([
  { item: undefined, expected: 0.2 },
  { item: { duration: 0.4 }, expected: 0.4 },
])('resolves chart transition and item override $item', async ({ item, expected }) => {
  render(() => (
    <BarChart width={200} height={100} data={[{ value: 12 }]} transition={{ duration: 0.2 }}>
      <Bar dataKey="value" transition={item} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(clock.duration).toBe(expected)
})
