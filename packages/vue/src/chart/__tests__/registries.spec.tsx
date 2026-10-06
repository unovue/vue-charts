import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { Bar, BarChart, Legend, Line, LineChart, Radar, RadarChart, ReferenceArea, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 500, height: 300 }))

// A visual prop must not invalidate the axes or replace existing shapes.
it('changes Bar fill without rendering axis ticks or replacing bars', async () => {
  const fill = ref('red')
  const data = [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]
  const Series = defineComponent({
    setup: () => () => <Bar dataKey="value" fill={fill.value} isAnimationActive={false} />,
  })
  const tick = vi.fn(({ x, y, payload }) => <text x={x} y={y}>{payload.value}</text>)
  const { container } = render(() => (
    <BarChart width={500} height={300} data={data}>
      <XAxis dataKey="name" v-slots={{ tick }} />
      <YAxis />
      <Series />
      <Legend />
      <Tooltip defaultIndex={0} isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  await nextTick()
  expect(tick).toHaveBeenCalled()
  const bars = [...container.querySelectorAll('.v-charts-bar-rectangle')]
  expect(bars).toHaveLength(2)
  tick.mockClear()
  fill.value = 'blue'
  await nextTick()
  await nextTick()
  expect(tick).not.toHaveBeenCalled()
  const recolored = [...container.querySelectorAll('.v-charts-bar-rectangle')]
  expect(recolored).toHaveLength(2)
  for (const [index, bar] of bars.entries()) {
    expect(recolored[index]).toBe(bar)
    expect(bar.querySelector('path')?.getAttribute('fill')).toBe('blue')
  }
  expect(container.querySelector('.v-charts-legend-item svg path')?.getAttribute('fill')).toBe('blue')
  expect(container.parentElement!.querySelector<HTMLElement>('.v-charts-tooltip-swatch')?.style.background).toBe('blue')
})

// Moving keyed children must retain series identity and setup order; removal must release it.
it.each(['cartesian', 'polar'] as const)('preserves %s registration order across reorder, removal and chart teardown', async (family) => {
  const order = ref(['a', 'b'])
  const mounted = ref(true)
  const colors: Record<string, string> = { a: 'red', b: 'blue', c: 'green' }
  const data = [{ name: 'A', a: 10, b: 20, c: 30 }, { name: 'B', a: 20, b: 30, c: 40 }]
  const Chart = family === 'cartesian' ? LineChart : RadarChart
  const Series = family === 'cartesian' ? Line : Radar
  const { container, unmount } = render(() => mounted.value && (
    <Chart width={500} height={300} data={data}>
      {family === 'cartesian' && <XAxis dataKey="name" />}
      {family === 'cartesian' && <YAxis />}
      {order.value.map(key => <Series key={key} dataKey={key} name={key} stroke={colors[key]} fill={colors[key]} isAnimationActive={false} />)}
      <Legend />
      <Tooltip defaultIndex={0} isAnimationActive={false} />
    </Chart>
  ))
  await nextTick()
  await nextTick()
  await nextTick()
  const legend = () => [...container.querySelectorAll('.v-charts-legend-item')]
    .map(item => ({ name: item.textContent, color: item.querySelector('svg path')?.getAttribute(family === 'cartesian' ? 'stroke' : 'fill') }))
  const original = [...container.querySelectorAll(`.v-charts-${family === 'cartesian' ? 'line-curve' : 'radar-polygon'}`)]
  expect(original).toHaveLength(2)
  expect(legend()).toEqual([{ name: 'a', color: 'red' }, { name: 'b', color: 'blue' }])
  order.value = ['b', 'a', 'c']
  await nextTick()
  await nextTick()
  await nextTick()
  expect(legend()).toEqual([{ name: 'a', color: 'red' }, { name: 'b', color: 'blue' }, { name: 'c', color: 'green' }])
  for (const shape of original)
    expect(container.contains(shape)).toBe(true)
  order.value = ['b', 'c']
  await nextTick()
  await nextTick()
  expect(legend()).toEqual([{ name: 'b', color: 'blue' }, { name: 'c', color: 'green' }])
  if (family === 'cartesian') {
    await fireEvent.mouseMove(container.querySelector('.v-charts-wrapper')!, { clientX: 100, clientY: 150 })
    await nextTick()
    expect([...container.parentElement!.querySelectorAll('.v-charts-tooltip-item-value')].map(item => item.textContent)).toEqual(['20', '30'])
  }
  mounted.value = false
  await nextTick()
  expect(container.querySelector('.v-charts-surface')).toBeNull()
  order.value = ['c', 'b']
  mounted.value = true
  await nextTick()
  await nextTick()
  await nextTick()
  expect(legend()).toEqual([{ name: 'c', color: 'green' }, { name: 'b', color: 'blue' }])
  unmount()
  expect(container.textContent).toBe('')
})

// Reference props must keep extending the domain after edits and stop on disposal.
it.each(['line', 'dot', 'area'] as const)('updates and disposes a %s reference domain', async (kind) => {
  const value = ref(40)
  const visible = ref(true)
  const data = [{ name: 'A', value: 10 }]
  const { container } = render(() => (
    <BarChart width={500} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis tickCount={3} interval={0} />
      <Bar dataKey="value" isAnimationActive={false} />
      {visible.value && kind === 'line' && <ReferenceLine y={value.value} ifOverflow="extendDomain" />}
      {visible.value && kind === 'dot' && <ReferenceDot x="A" y={value.value} ifOverflow="extendDomain" />}
      {visible.value && kind === 'area' && <ReferenceArea y1={0} y2={value.value} ifOverflow="extendDomain" />}
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  const ticks = () => [...container.querySelectorAll('.v-charts-y-axis .v-charts-cartesian-axis-tick-value')]
    .map(tick => tick.textContent)
  expect(ticks()).toEqual(['0', '20', '40'])
  value.value = 100
  await nextTick()
  await nextTick()
  expect(ticks()).toEqual(['0', '50', '100'])
  visible.value = false
  await nextTick()
  await nextTick()
  expect(ticks()).toEqual(['0', '5', '10'])
})
