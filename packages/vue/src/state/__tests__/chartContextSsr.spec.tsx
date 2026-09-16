import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideChartContext, useAppDispatch, useAppSelector } from '../chartContext'
import { setChartSize } from '../layoutSlice'
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
        useAppDispatch()(setChartSize({ width: 321, height: 200 }))
        return () => <span>{width.value}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext(store)
        return () => <Reader />
      },
    })
    const html = await renderToString(createSSRApp(Fixture))
    expect(html).toBe('<span>321</span>')
    expect(subscription).toHaveBeenCalledTimes(1)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('isolates concurrent requests even when child setup yields', async () => {
    const renderRequest = (width: number) => {
      const Reader = defineComponent({
        async setup() {
          const selected = useAppSelector(state => state.layout.width)
          const dispatch = useAppDispatch()
          await Promise.resolve()
          dispatch(setChartSize({ width, height: 200 }))
          await Promise.resolve()
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
