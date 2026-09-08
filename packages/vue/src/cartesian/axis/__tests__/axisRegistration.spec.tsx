import { provideStore } from '@reduxjs/vue-redux'
import { render } from '@testing-library/vue'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { XAxis } from '../XAxis'
import { YAxis } from '../YAxis'
import { createRechartsStore } from '@/state/store'
import { Line, LineChart } from '@/index'

type AxisFixtureProps = { axisId: string | number, tickCount: number }

const axes = [
  {
    axisType: 'xAxis',
    renderAxis: (props: AxisFixtureProps) => h(XAxis, { xAxisId: props.axisId, tickCount: props.tickCount }),
  },
  {
    axisType: 'yAxis',
    renderAxis: (props: AxisFixtureProps) => h(YAxis, { yAxisId: props.axisId, tickCount: props.tickCount }),
  },
] as const

describe.each(axes)('$axisType registration', ({ renderAxis, axisType }) => {
  function createFixture() {
    const store = createRechartsStore()
    const Fixture = defineComponent({
      props: { axisId: { type: [String, Number], default: 0 }, tickCount: { type: Number, default: 5 } },
      setup(props) {
        provideStore({ store })
        return () => renderAxis(props)
      },
    })
    return { store, Fixture }
  }

  it('keeps explicit settings registered during SSR', async () => {
    const { store, Fixture } = createFixture()
    await renderToString(createSSRApp(Fixture, { axisId: 'custom', tickCount: 3 }))
    expect(store.getState().cartesianAxis[axisType].custom).toMatchObject({ id: 'custom', tickCount: 3 })
  })

  it('updates settings, removes old IDs, and unregisters on unmount', async () => {
    const { store, Fixture } = createFixture()
    const { rerender, unmount } = render(Fixture)
    expect(store.getState().cartesianAxis[axisType][0]).toMatchObject({ tickCount: 5 })

    await rerender({ tickCount: 3 })
    expect(store.getState().cartesianAxis[axisType][0]).toMatchObject({ tickCount: 3 })

    await rerender({ axisId: 'custom' })
    expect(store.getState().cartesianAxis[axisType][0]).toBeUndefined()
    expect(store.getState().cartesianAxis[axisType].custom).toMatchObject({ id: 'custom', tickCount: 3 })

    unmount()
    expect(store.getState().cartesianAxis[axisType]).toEqual({})
  })
})

it('server-renders explicit axes and categorical tick labels', async () => {
  const html = await renderToString(createSSRApp(defineComponent({
    setup: () => () => (
      <LineChart width={500} height={300} data={[{ name: 'January', value: 10 }, { name: 'February', value: 20 }]}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="value" isAnimationActive={false} />
      </LineChart>
    ),
  })))
  expect(html).toContain('v-charts-xAxis')
  expect(html).toContain('v-charts-yAxis')
  expect(html).toContain('January')
  expect(html).toContain('February')
})
