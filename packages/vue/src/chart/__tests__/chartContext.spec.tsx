import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { isProxy, nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { getBarRects } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

it('keeps sibling chart data and layout isolated during an update', async () => {
  const data = ref([{ name: 'A', value: 10 }])
  const width = ref(300)
  const { container } = render(() => (
    <div>
      <BarChart width={width.value} height={300} data={data.value}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 40]} />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
      <BarChart width={500} height={300} data={[{ name: 'B', value: 40 }]}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 40]} />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>
    </div>
  ))
  await nextTick()
  await nextTick()
  const charts = container.querySelectorAll('.v-charts-wrapper')
  const sibling = charts[1].innerHTML
  expect(getBarRects(charts[0])[0].getAttribute('height')).toBe('65')
  data.value = [{ name: 'C', value: 20 }]
  width.value = 400
  await nextTick()
  await nextTick()
  expect(getBarRects(charts[0])[0].getAttribute('height')).toBe('130')
  expect(charts[0].querySelector('svg')?.getAttribute('width')).toBe('400')
  expect(charts[1].innerHTML).toBe(sibling)
  expect(charts[1].querySelector('svg')?.getAttribute('width')).toBe('500')
})

it('passes the original unproxied row to a public shape slot', async () => {
  const row = { name: 'A', value: 10 }
  const shape = vi.fn(props => <rect x={props.x} y={props.y} width={props.width} height={props.height} />)
  render(() => (
    <BarChart width={500} height={300} data={[row]}>
      <Bar dataKey="value" isAnimationActive={false} v-slots={{ shape }} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(shape).toHaveBeenCalled()
  for (const [props] of shape.mock.calls) {
    expect(props.payload).toBe(row)
    expect(isProxy(props.payload)).toBe(false)
    expect(Object.isFrozen(props.payload)).toBe(false)
  }
})
