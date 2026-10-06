import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Area, Bar, ComposedChart, Line, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('keeps public shape and dot slots idle during five tooltip hovers', async () => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const data = ['A', 'B', 'C', 'D', 'E'].map((name, i) => ({ name, area: i + 1, bar: i + 11, line: i + 21 }))
  const shape = vi.fn(props => <rect x={props.x} y={props.y} width={props.width} height={props.height} />)
  const dot = vi.fn(props => <circle cx={props.cx} cy={props.cy} r={3} />)
  const { container } = render(() => (
    <ComposedChart width={500} height={300} data={data}>
      <Area dataKey="area" isAnimationActive={false} />
      <Bar dataKey="bar" isAnimationActive={false} v-slots={{ shape }} />
      <Line dataKey="line" isAnimationActive={false} v-slots={{ dot }} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </ComposedChart>
  ))
  await nextTick()
  await nextTick()
  expect(shape.mock.calls.length).toBeGreaterThanOrEqual(5)
  expect(dot.mock.calls.length).toBeGreaterThanOrEqual(5)
  shape.mockClear()
  dot.mockClear()
  const chart = container.querySelector('.v-charts-wrapper')!
  for (const [i, x] of [108, 194, 280, 366, 452].entries()) {
    await fireEvent.mouseMove(chart, { clientX: x, clientY: 150 })
    await nextTick()
    await nextTick()
    const tooltip = container.parentElement!.querySelector('.v-charts-tooltip-content')!
    expect(tooltip.querySelector('.v-charts-tooltip-label')?.textContent).toBe(data[i].name)
    expect([...tooltip.querySelectorAll('.v-charts-tooltip-item-value')].map(node => node.textContent))
      .toEqual([String(data[i].area), String(data[i].bar), String(data[i].line)])
  }
  expect(shape).not.toHaveBeenCalled()
  expect(dot).not.toHaveBeenCalled()
})
