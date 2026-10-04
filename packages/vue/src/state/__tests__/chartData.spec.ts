import { describe, expect, it } from 'vitest'
import { isProxy, reactive, watch } from 'vue'
import { createChartData } from '../chartData'

describe('chart-local data', () => {
  it('preserves supplied identity without adding proxies or freezing caller data', () => {
    const chart = createChartData()
    const values = [{ value: 1 }, { value: 2 }]
    chart.setData(values)
    expect(chart.state.value.chartData).toBe(values)
    expect(isProxy(chart.state.value.chartData)).toBe(false)
    expect(Object.isFrozen(values)).toBe(false)
    expect(Object.isFrozen(values[0])).toBe(false)
    const reactiveValues = reactive(values)
    chart.setData(reactiveValues)
    expect(chart.state.value.chartData).toBe(reactiveValues)
  })

  it('publishes data and inclusive range atomically and preserves partial updates', () => {
    const chart = createChartData()
    const snapshots: unknown[] = []
    const stop = watch(chart.state, state => snapshots.push(state), { flush: 'sync' })
    const values = [10, 20, 30, 40]
    chart.setData(values)
    expect(snapshots).toEqual([{
      chartData: values,
      computedData: undefined,
      dataStartIndex: 0,
      dataEndIndex: 3,
    }])
    chart.setRange({ startIndex: 1, endIndex: 2 })
    const selected = chart.state.value
    expect(selected.chartData).toBe(values)
    chart.setRange({ endIndex: 3 })
    expect(chart.state.value).toMatchObject({ dataStartIndex: 1, dataEndIndex: 3 })
    expect(selected).toMatchObject({ dataStartIndex: 1, dataEndIndex: 2 })
    stop()
  })

  it('preserves legacy replacement and empty-data range behavior', () => {
    const chart = createChartData()
    chart.setData([10, 20, 30, 40])
    chart.setRange({ startIndex: 1, endIndex: 2 })
    chart.setData([100, 200])
    expect(chart.state.value).toMatchObject({ dataStartIndex: 1, dataEndIndex: 1 })
    chart.setData([])
    expect(chart.state.value).toMatchObject({ dataStartIndex: 1, dataEndIndex: 1 })
    chart.setData(undefined)
    expect(chart.state.value).toMatchObject({ chartData: undefined, dataStartIndex: 0, dataEndIndex: 0 })
  })

  it('suppresses no-op updates and keeps defaults and ranges separate between charts', () => {
    const first = createChartData()
    const second = createChartData()
    const values = [10, 20]
    first.setData(values)
    const before = first.state.value
    first.setData(values)
    first.setRange({ startIndex: 0, endIndex: 1 })
    first.setRange({})
    expect(first.state.value).toBe(before)
    expect(second.state.value).toMatchObject({ chartData: undefined, dataStartIndex: 0, dataEndIndex: 0 })
  })
})
