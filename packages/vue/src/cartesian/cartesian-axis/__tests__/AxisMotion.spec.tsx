import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const clock = vi.hoisted(() => ({ runs: [] as Array<{ to: number, update: (v: number) => void }> }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: unknown, to: number, options: { onUpdate: (v: number) => void }) => {
    if (typeof from === 'number')
      clock.runs.push({ to, update: options.onUpdate })
    return { stop() {} }
  },
}))
async function advance(fraction: number) {
  clock.runs.forEach(run => run.update(run.to * fraction))
  await nextTick()
}

beforeEach(() => {
  clock.runs = []
  mockGetBoundingClientRect({ width: 400, height: 300 })
})

function setup(isAnimationActive: boolean) {
  const rows = ref([{ name: 'A', value: 100 }])
  const { container } = render(() => (
    <BarChart width={400} height={300} data={rows.value}>
      <YAxis />
      <Bar dataKey="value" isAnimationActive={isAnimationActive} />
    </BarChart>
  ))
  const tickY = (label: string) => {
    const tick = [...container.querySelectorAll('.v-charts-cartesian-axis-tick')].find(t => t.textContent === label)
    return tick ? Number(tick.querySelector('line')!.getAttribute('y1')) : undefined
  }
  return { rows, tickY }
}

it('slides axis ticks with the series when the domain changes', async () => {
  const { rows, tickY } = setup(true)
  await nextTick()
  await advance(1)
  const before = tickY('100')!
  rows.value = [{ name: 'A', value: 200 }]
  await nextTick()
  await advance(0.25)
  const during = tickY('100')!
  await advance(1)
  const after = tickY('100')!
  // 100 moves down as the domain grows to 200, through positions in between.
  expect(after).toBeGreaterThan(before)
  expect(during).toBeGreaterThan(before)
  expect(during).toBeLessThan(after)
})

it('keeps the axis still when the series do not animate', async () => {
  const { rows } = setup(false)
  await nextTick()
  rows.value = [{ name: 'A', value: 200 }]
  await nextTick()
  expect(clock.runs).toHaveLength(0)
})
