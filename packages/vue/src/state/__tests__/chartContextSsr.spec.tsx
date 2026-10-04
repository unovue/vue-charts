import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideChartContext, useAppDispatch, useAppSelector, useChartDataActions, useChartLayoutActions, useChartTooltip } from '../chartContext'
import { createEventEmitter } from '../optionsSlice'
import { createRechartsStore } from '../store'

describe('chart context SSR', () => {
  it('keeps state current during rendering and releases the subscription afterward', async () => {
    const store = createRechartsStore()
    const subscribe = store.subscribe
    const unsubscribe = vi.fn()
    const subscription = vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
      const stop = subscribe(listener)
      return () => {
        unsubscribe()
        stop()
      }
    })
    const Reader = defineComponent({
      setup() {
        const width = useAppSelector(state => state.layout.width)
        const data = useAppSelector(state => state.chartData.chartData)
        useChartLayoutActions().setProps('horizontal', { width: 321, height: 200 }, {})
        useChartDataActions().setData([1, 2])
        useAppDispatch()(createEventEmitter())
        expect(useAppSelector(state => state.options.eventEmitter).value).toBeTypeOf('symbol')
        return () => <span>{`${width.value}:${data.value?.length}`}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext(store)
        return () => <Reader />
      },
    })
    const html = await renderToString(createSSRApp(Fixture))
    expect(html).toBe('<span>321:2</span>')
    expect(subscription).toHaveBeenCalledTimes(1)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('isolates concurrent requests even when child setup yields', async () => {
    const renderRequest = (width: number) => {
      const Reader = defineComponent({
        async setup() {
          const selected = useAppSelector(state => state.layout.width)
          const layout = useChartLayoutActions()
          const tooltip = useChartTooltip()
          const index = useAppSelector(state => state.tooltip.keyboardInteraction.index)
          expect(index.value).toBeNull()
          await Promise.resolve()
          layout.setProps('horizontal', { width, height: 200 }, {})
          tooltip.setKeyboardInteraction({ active: true, activeIndex: String(width), activeDataKey: undefined })
          await Promise.resolve()
          expect(index.value).toBe(String(width))
          return () => <span>{selected.value}</span>
        },
      })
      const Fixture = defineComponent({
        setup() {
          provideChartContext(createRechartsStore())
          return () => <Reader />
        },
      })
      return renderToString(createSSRApp(Fixture))
    }
    expect(await Promise.all([renderRequest(100), renderRequest(300)]))
      .toEqual(['<span>100</span>', '<span>300</span>'])
  })
})
