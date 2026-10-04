import { createSelector } from '../createSelector'
import { SetLegendPayload } from '../SetLegendPayload'
import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, isProxy, nextTick, ref } from 'vue'
import type { ComputedRef } from 'vue'
import { provideChartContext, useAppSelector, useChartDataActions, useChartLayoutActions, useChartLegend, useChartTooltip } from '../chartContext'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('chart context', () => {
  it('updates synchronously and tracks reactive inputs without a dispatch', () => {
    let layout: ReturnType<typeof useChartLayoutActions>
    const dimension = ref<'width' | 'height'>('width')
    let selected: ComputedRef<number> | undefined
    const Reader = defineComponent({
      setup() {
        selected = useAppSelector(state => state.layout[dimension.value])
        layout = useChartLayoutActions()
        useChartLayoutActions().setProps('horizontal', { width: 100, height: 200 }, {})
        return () => <span>{selected?.value}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext()
        return () => <Reader />
      },
    })
    render(Fixture)
    expect(selected?.value).toBe(100)
    dimension.value = 'height'
    expect(selected?.value).toBe(200)
    layout!.setProps('horizontal', { width: 300, height: 400 }, {})
    expect(selected?.value).toBe(400)
  })

  it('uses the nearest provider without leaking state to sibling charts', async () => {
    let innerLayout: ReturnType<typeof useChartLayoutActions>
    const Reader = defineComponent({
      props: { initialWidth: Number },
      setup(props) {
        const layout = useChartLayoutActions()
        if (props.initialWidth !== undefined)
          layout.setProps('horizontal', { width: props.initialWidth, height: 200 }, {})
        if (props.initialWidth === 300)
          innerLayout = layout
        const width = useAppSelector(state => state.layout.width)
        return () => <span>{width.value}</span>
      },
    })
    const Inner = defineComponent({
      setup() {
        provideChartContext()
        return () => <Reader initialWidth={300} />
      },
    })
    const Outer = defineComponent({
      setup() {
        provideChartContext()
        return () => (
          <div>
            <Reader initialWidth={100} />
            <Inner />
            <Reader />
          </div>
        )
      },
    })
    const { container } = render(Outer)
    expect([...container.querySelectorAll('span')].map(element => element.textContent)).toEqual(['100', '300', '100'])
    innerLayout!.setProps('horizontal', { width: 500, height: 600 }, {})
    await nextTick()
    expect([...container.querySelectorAll('span')].map(element => element.textContent)).toEqual(['100', '500', '100'])
  })

  it('tracks only domains read by a selector and keeps its view stable', () => {
    let layout: ReturnType<typeof useChartLayoutActions>
    let tooltip: ReturnType<typeof useChartTooltip>
    let selected: ComputedRef<number>
    let view: ComputedRef<import('../chartState').RechartsRootState>
    const selector = vi.fn((state: import('../chartState').RechartsRootState) => state.layout.width)
    const Reader = defineComponent({
      setup() {
        layout = useChartLayoutActions()
        tooltip = useChartTooltip()
        selected = useAppSelector(selector)
        view = useAppSelector(state => state)
        return () => <span>{selected.value}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext()
        return () => <Reader />
      },
    })
    render(Fixture)
    const initialView = view!.value
    expect(Object.isFrozen(initialView)).toBe(true)
    selector.mockClear()
    tooltip!.setKeyboardInteraction({ active: true, activeIndex: '1', activeDataKey: undefined })
    expect(selected!.value).toBe(0)
    expect(selector).not.toHaveBeenCalled()
    layout!.setProps('horizontal', { width: 123, height: 200 }, {})
    expect(selected!.value).toBe(123)
    expect(selector).toHaveBeenCalledTimes(1)
    expect(view!.value).toBe(initialView)
    expect(initialView.layout.width).toBe(123)
  })

  it('preserves dataset identity without creating Vue proxies', () => {
    const data = [{ value: 10 }]
    const Reader = defineComponent({
      setup() {
        useChartDataActions().setData(data)
        const selected = useAppSelector(state => state.chartData.chartData)
        expect(selected.value).toBe(data)
        expect(isProxy(selected.value)).toBe(false)
        return () => null
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext()
        return () => <Reader />
      },
    })
    render(Fixture)
  })
})

it('does not re-register legend payloads when another legend field changes', async () => {
  let legend: ReturnType<typeof useChartLegend> | undefined
  const first = [{ value: 'first', color: 'red' }]
  const second = [{ value: 'second', color: 'blue' }]
  const Reader = defineComponent({
    setup() {
      legend = useChartLegend()
      SetLegendPayload(first)
      SetLegendPayload(second)
      return () => null
    },
  })
  const Fixture = defineComponent({
    setup() {
      provideChartContext()
      return () => <Reader />
    },
  })
  const { unmount } = render(Fixture)
  const payload = legend?.state.value.payload
  expect(payload).toEqual([first, second])
  legend?.setLegendSize({ width: 100, height: 30 })
  await nextTick()
  expect(legend?.state.value.payload).toBe(payload)
  unmount()
  expect(legend?.state.value.payload).toEqual([])
})

it('refreshes memoized selector inputs on the same view after switching reactive parameters', () => {
  const dimension = ref<'width' | 'height'>('width')
  const selectDimension = createSelector(
    [(state: import('../chartState').RechartsRootState, key: 'width' | 'height') => state.layout[key]],
    value => value * 2,
  )
  let selected: ComputedRef<number>
  let layout: ReturnType<typeof useChartLayoutActions>
  const Reader = defineComponent({
    setup() {
      layout = useChartLayoutActions()
      layout.setProps('horizontal', { width: 100, height: 200 }, {})
      selected = useAppSelector(state => selectDimension(state, dimension.value))
      return () => <span>{selected.value}</span>
    },
  })
  const Fixture = defineComponent({
    setup() {
      provideChartContext()
      return () => <Reader />
    },
  })
  render(Fixture)
  expect(selected!.value).toBe(200)
  dimension.value = 'height'
  expect(selected!.value).toBe(400)
  layout!.setProps('horizontal', { width: 300, height: 400 }, {})
  expect(selected!.value).toBe(800)
  dimension.value = 'width'
  expect(selected!.value).toBe(600)
})
