import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, isProxy, nextTick, ref } from 'vue'
import type { ComputedRef } from 'vue'
import { provideChartContext, useAppDispatch, useAppSelector, useChartDataActions, useChartLayoutActions } from '../chartContext'
import { createRechartsStore } from '../store'
import { createChartLayout } from '../chartLayout'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('chart context', () => {
  it('updates synchronously and tracks reactive inputs without a dispatch', () => {
    const store = createRechartsStore()
    const layout = createChartLayout()
    const dimension = ref<'width' | 'height'>('width')
    let selected: ComputedRef<number> | undefined
    const Reader = defineComponent({
      setup() {
        selected = useAppSelector(state => state.layout[dimension.value])
        const dispatch = useAppDispatch()
        expect(dispatch).toBe(store.dispatch)
        useChartLayoutActions().setProps('horizontal', { width: 100, height: 200 }, {})
        return () => <span>{selected?.value}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext(store, layout)
        return () => <Reader />
      },
    })
    render(Fixture)
    expect(selected?.value).toBe(100)
    dimension.value = 'height'
    expect(selected?.value).toBe(200)
    layout.setProps('horizontal', { width: 300, height: 400 }, {})
    expect(selected?.value).toBe(400)
  })

  it('uses the nearest provider without leaking state to sibling charts', async () => {
    const outerStore = createRechartsStore()
    const innerStore = createRechartsStore()
    const outerLayout = createChartLayout()
    const innerLayout = createChartLayout()
    outerLayout.setProps('horizontal', { width: 100, height: 200 }, {})
    innerLayout.setProps('horizontal', { width: 300, height: 400 }, {})
    const Reader = defineComponent({
      setup() {
        const width = useAppSelector(state => state.layout.width)
        return () => <span>{width.value}</span>
      },
    })
    const Inner = defineComponent({
      setup() {
        provideChartContext(innerStore, innerLayout)
        return () => <Reader />
      },
    })
    const Outer = defineComponent({
      setup() {
        provideChartContext(outerStore, outerLayout)
        return () => (
          <div>
            <Reader />
            <Inner />
            <Reader />
          </div>
        )
      },
    })
    const { container } = render(Outer)
    expect([...container.querySelectorAll('span')].map(element => element.textContent)).toEqual(['100', '300', '100'])
    innerLayout.setProps('horizontal', { width: 500, height: 600 }, {})
    await nextTick()
    expect([...container.querySelectorAll('span')].map(element => element.textContent)).toEqual(['100', '500', '100'])
  })

  it('shares one subscription and disposes it when the provider unmounts', () => {
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
        const height = useAppSelector(state => state.layout.height)
        return () => <span>{`${width.value}:${height.value}`}</span>
      },
    })
    const Fixture = defineComponent({
      setup() {
        provideChartContext(store)
        return () => <Reader />
      },
    })
    const { unmount } = render(Fixture)
    expect(subscription).toHaveBeenCalledTimes(1)
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('preserves dataset identity without creating Vue proxies', () => {
    const store = createRechartsStore()
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
        provideChartContext(store)
        return () => <Reader />
      },
    })
    render(Fixture)
  })
})
