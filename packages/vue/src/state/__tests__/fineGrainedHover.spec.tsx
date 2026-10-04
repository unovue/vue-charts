import { cleanup, fireEvent, render } from '@testing-library/vue'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Area, Bar, ComposedChart, Line, Tooltip, XAxis, YAxis } from '@/index'
import { selectBarRectangles } from '../selectors/barSelectors'
import { selectLinePoints } from '../selectors/lineSelectors'
import { selectTicksOfAxis } from '../selectors/axisSelectors'
import { selectTooltipPayload } from '../selectors/selectors'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

// Count selector executions, including input evaluation. Result recomputations alone
// miss the old combined view invalidating every geometry computed on each hover.
vi.mock('../selectors/barSelectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../selectors/barSelectors')>()
  return { ...actual, selectBarRectangles: vi.fn(actual.selectBarRectangles) }
})
vi.mock('../selectors/lineSelectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../selectors/lineSelectors')>()
  return { ...actual, selectLinePoints: vi.fn(actual.selectLinePoints) }
})
vi.mock('../selectors/axisSelectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../selectors/axisSelectors')>()
  return { ...actual, selectTicksOfAxis: vi.fn(actual.selectTicksOfAxis) }
})
vi.mock('../selectors/selectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../selectors/selectors')>()
  return { ...actual, selectTooltipPayload: vi.fn(actual.selectTooltipPayload) }
})

afterEach(cleanup)

it('keeps geometry calculations idle while the pointer selects five tooltip payloads', async () => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const data = ['A', 'B', 'C', 'D', 'E'].map((name, i) => ({ name, area: i + 1, bar: i + 11, line: i + 21 }))
  const { container } = render(() => (
    <ComposedChart width={500} height={300} data={data}>
      <Area dataKey="area" isAnimationActive={false} />
      <Bar dataKey="bar" isAnimationActive={false} />
      <Line dataKey="line" isAnimationActive={false} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </ComposedChart>
  ))
  await nextTick()
  await nextTick()
  expect(container.querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(5)
  expect(container.querySelector('.v-charts-line-curve')).not.toBeNull()
  expect(container.querySelector('.v-charts-area-area')).not.toBeNull()
  for (const selector of [selectBarRectangles, selectLinePoints, selectTicksOfAxis, selectTooltipPayload]) {
    if (selector !== selectTooltipPayload)
      expect(vi.mocked(selector).mock.calls.length).toBeGreaterThan(0)
    vi.mocked(selector).mockClear()
  }
  const chart = container.querySelector('.v-charts-wrapper')!
  for (const [i, x] of [108, 194, 280, 366, 452].entries()) {
    await fireEvent(chart, new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: 150 }))
    await nextTick()
    await nextTick()
    const tooltip = container.parentElement!.querySelector('.v-charts-tooltip-content')!
    expect(tooltip.querySelector('.v-charts-tooltip-label')?.textContent).toBe(data[i].name)
    expect([...tooltip.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent)).toEqual([
      String(data[i].area),
      String(data[i].bar),
      String(data[i].line),
    ])
  }
  const counts = {
    bar: vi.mocked(selectBarRectangles).mock.calls.length,
    line: vi.mocked(selectLinePoints).mock.calls.length,
    ticks: vi.mocked(selectTicksOfAxis).mock.calls.length,
    tooltip: vi.mocked(selectTooltipPayload).mock.calls.length,
  }
  console.info('Pointer-only selector executions:', JSON.stringify(counts))
  expect(counts.tooltip).toBeGreaterThanOrEqual(5)
  expect({ bar: counts.bar, line: counts.line, ticks: counts.ticks }).toEqual({ bar: 0, line: 0, ticks: 0 })
})
