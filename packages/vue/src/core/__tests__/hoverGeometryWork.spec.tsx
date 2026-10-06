import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Bar, ComposedChart, Line, Tooltip, XAxis, YAxis } from '@/index'
import { computeBarRectangles } from '@/core/bar'
import { computeLinePoints } from '@/core/line'
import { axisTicks } from '@/core/axis/ticks'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

// Instrument the real math, independently of selector wiring and rendered equality.
vi.mock('@/core/bar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/bar')>()
  return { ...actual, computeBarRectangles: vi.fn(actual.computeBarRectangles) }
})
vi.mock('@/core/line', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/line')>()
  return { ...actual, computeLinePoints: vi.fn(actual.computeLinePoints) }
})
vi.mock('@/core/axis/ticks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/axis/ticks')>()
  return { ...actual, axisTicks: vi.fn(actual.axisTicks) }
})

it('runs zero geometry combiners while five hovers change the tooltip', async () => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const { container } = render(() => (
    <ComposedChart
      width={500}
      height={300}
      data={[
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
        { name: 'C', value: 30 },
        { name: 'D', value: 40 },
        { name: 'E', value: 50 },
      ]}
    >
      <Bar dataKey="value" isAnimationActive={false} />
      <Line dataKey="value" isAnimationActive={false} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </ComposedChart>
  ))
  await nextTick()
  await nextTick()
  for (const combine of [computeBarRectangles, computeLinePoints, axisTicks]) {
    expect(combine).toHaveBeenCalled()
    vi.mocked(combine).mockClear()
  }
  const chart = container.querySelector('.v-charts-wrapper')!
  for (const [index, x] of [108, 194, 280, 366, 452].entries()) {
    await fireEvent.mouseMove(chart, { clientX: x, clientY: 150 })
    await nextTick()
    await nextTick()
    expect(container.parentElement!.querySelector('.v-charts-tooltip-label')?.textContent)
      .toBe(['A', 'B', 'C', 'D', 'E'][index])
  }
  expect(computeBarRectangles).not.toHaveBeenCalled()
  expect(computeLinePoints).not.toHaveBeenCalled()
  expect(axisTicks).not.toHaveBeenCalled()
})
