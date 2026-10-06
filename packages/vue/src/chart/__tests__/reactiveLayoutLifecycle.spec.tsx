import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { Bar, BarChart, Legend, Line, Tooltip, XAxis, YAxis } from '@/index'
import { getBarRects } from '@/test/helper'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 400, height: 200 }))

it('moves bar geometry after mutating a margin side in place', async () => {
  const margin = reactive({ top: 0, right: 0, bottom: 0, left: 0 })
  const { container } = render(() => (
    <BarChart width={400} height={200} margin={margin} data={[{ value: 100 }]}>
      <YAxis hide domain={[0, 100]} />
      <Bar dataKey="value" isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('x')).toBe('40')
  expect(getBarRects(container)[0].getAttribute('width')).toBe('320')
  margin.left = 100
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('x')).toBe('130')
  expect(getBarRects(container)[0].getAttribute('width')).toBe('240')
})

it('uses the newly selected registered axis when a series changes its axis ID', async () => {
  const id = ref('small')
  const { container } = render(() => (
    <BarChart width={400} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} data={[{ value: 100 }]}>
      <YAxis yAxisId="small" hide domain={[0, 100]} />
      <YAxis yAxisId="large" hide domain={[0, 200]} />
      <Bar dataKey="value" yAxisId={id.value} isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('height')).toBe('200')
  id.value = 'large'
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('height')).toBe('100')
  id.value = 'small'
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('height')).toBe('200')
})

it('keeps a surviving axis consumer correct through repeated registration and disposal', async () => {
  const first = ref(true)
  const { container } = render(() => (
    <BarChart
      width={400}
      height={200}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      data={[{ name: 'A', first: 100, second: 20 }]}
    >
      <XAxis hide dataKey="name" />
      <YAxis hide />
      {first.value && <Line dataKey="first" name="First" isAnimationActive={false} />}
      <Bar dataKey="second" name="Second" isAnimationActive={false} />
      <Legend height={0} />
      <Tooltip defaultIndex={0} isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(getBarRects(container)[0].getAttribute('height')).toBe('40')
  for (let cycle = 0; cycle < 3; cycle++) {
    first.value = false
    await nextTick()
    await nextTick()
    expect(getBarRects(container)[0].getAttribute('height')).toBe('200')
    expect([...container.querySelectorAll('.v-charts-legend-item-text')].map(item => item.textContent))
      .toEqual(['Second'])
    expect([...container.parentElement!.querySelectorAll('.v-charts-tooltip-item-value')].map(item => item.textContent))
      .toEqual(['20'])
    first.value = true
    await nextTick()
    await nextTick()
    expect(getBarRects(container)[0].getAttribute('height')).toBe('40')
    expect(container.querySelectorAll('.v-charts-legend-item')).toHaveLength(2)
    expect([...container.parentElement!.querySelectorAll('.v-charts-tooltip-item-value')].map(item => item.textContent))
      .toEqual(['20', '100'])
  }
})
