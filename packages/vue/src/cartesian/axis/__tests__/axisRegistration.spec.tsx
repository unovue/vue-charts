import { render } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import { createSSRApp, defineComponent, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Line, LineChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 30, height: 16 }))

it.each(['x', 'y'] as const)('sSR renders a custom tick count on the %s axis', async (type) => {
  const html = await renderToString(createSSRApp(defineComponent({
    setup: () => () => (
      <LineChart width={500} height={300} data={[{ value: 0 }, { value: 100 }]}>
        {type === 'x'
          ? <XAxis xAxisId="custom" type="number" dataKey="value" domain={[0, 100]} tickCount={3} interval={0} />
          : <YAxis yAxisId="custom" domain={[0, 100]} tickCount={3} interval={0} />}
        <Line dataKey="value" xAxisId={type === 'x' ? 'custom' : 0} yAxisId={type === 'y' ? 'custom' : 0} isAnimationActive={false} />
      </LineChart>
    ),
  })))
  const output = document.createElement('div')
  output.innerHTML = html
  expect([...output.querySelectorAll(`.v-charts-${type}-axis .v-charts-cartesian-axis-tick-value`)]
    .map(tick => tick.textContent)).toEqual(['0', '50', '100'])
})

it.each(['x', 'y'] as const)('updates ticks after changing the %s axis ID and settings', async (type) => {
  const id = ref<string | number>(0)
  const count = ref(3)
  const { container } = render(() => (
    <LineChart width={500} height={300} data={[{ value: 0 }, { value: 100 }]}>
      {type === 'x'
        ? <XAxis xAxisId={id.value} type="number" dataKey="value" domain={[0, 100]} tickCount={count.value} interval={0} />
        : <YAxis yAxisId={id.value} domain={[0, 100]} tickCount={count.value} interval={0} />}
      <Line dataKey="value" xAxisId={type === 'x' ? id.value : 0} yAxisId={type === 'y' ? id.value : 0} isAnimationActive={false} />
    </LineChart>
  ))
  await nextTick()
  await nextTick()
  const ticks = () => [...container.querySelectorAll(`.v-charts-${type}-axis .v-charts-cartesian-axis-tick-value`)]
    .map(tick => tick.textContent)
  expect(ticks()).toEqual(['0', '50', '100'])
  id.value = 'custom'
  count.value = 5
  await nextTick()
  await nextTick()
  expect(ticks()).toEqual(['0', '25', '50', '75', '100'])
  expect(container.querySelectorAll('.v-charts-line-curve')).toHaveLength(1)
})

// Duplicate IDs resolve to the last registration, including its placement size.
it.each(['x', 'y'] as const)('keeps duplicate %s axes at the last registration position', async (type) => {
  const { container } = render(() => (
    <LineChart width={500} height={300} data={[{ name: 'A', value: 10 }, { name: 'B', value: 20 }]}>
      {type === 'x'
        ? (
            <>
              <XAxis xAxisId="shared" orientation="top" height={20} />
              <XAxis xAxisId="shared" orientation="top" height={40} />
            </>
          )
        : (
            <>
              <YAxis yAxisId="shared" orientation="left" width={20} />
              <YAxis yAxisId="shared" orientation="left" width={40} />
            </>
          )}
      <Line dataKey="value" xAxisId={type === 'x' ? 'shared' : 0} yAxisId={type === 'y' ? 'shared' : 0} isAnimationActive={false} />
    </LineChart>
  ))
  await nextTick()
  await nextTick()
  const attr = type === 'x' ? 'y1' : 'x1'
  expect([...container.querySelectorAll(`.v-charts-${type}-axis .v-charts-cartesian-axis-line`)]
    .map(line => line.getAttribute(attr))).toEqual(['45', '45'])
})
