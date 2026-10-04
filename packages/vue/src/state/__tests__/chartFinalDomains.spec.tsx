import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, shallowRef } from 'vue'
import { createChartCartesianAxis } from '../chartCartesianAxis'
import { createChartGraphicalItems } from '../chartGraphicalItems'
import type { CartesianGraphicalItemSettings, PolarGraphicalItemSettings } from '../chartGraphicalItems'
import { provideChartContext, useAppSelector, useChartCartesianAxis, useChartGraphicalItems, useChartTooltip } from '../chartContext'
import { SetCartesianGraphicalItem, SetPolarGraphicalItem } from '../SetGraphicalItem'
import { createRechartsStore } from '../store'
import { selectAllVisibleBars } from '../selectors/barSelectors'
import { implicitXAxis, implicitYAxis, implicitZAxis, selectAxisScale, selectCartesianItemsSettings } from '../selectors/axisSelectors'

// Catch lost registrations, reordered items, stale selector caches, shared defaults,
// and reporters subscribing to the state they write.
afterEach(cleanup)

const cartesian: CartesianGraphicalItemSettings = {
  type: 'line',
  data: [{ value: 10 }],
  dataKey: 'value',
  hide: false,
  isPanorama: false,
  xAxisId: 0,
  yAxisId: 0,
  zAxisId: 0,
  errorBars: [],
  stackId: undefined,
  barSize: undefined,
}
const polar: PolarGraphicalItemSettings = {
  type: 'pie',
  data: [{ value: 10 }],
  dataKey: 'value',
  hide: false,
  angleAxisId: 0,
  radiusAxisId: 0,
}

describe('chart-local cartesian axes', () => {
  it.each([
    { key: 'xAxis' },
    { key: 'yAxis' },
    { key: 'zAxis' },
  ] as const)('preserves $key order, snapshots and equal settings', ({ key }) => {
    const axes = createChartCartesianAxis()
    const sibling = createChartCartesianAxis()
    const original = axes.state.value
    if (key === 'xAxis') {
      axes.addXAxis({ ...implicitXAxis, id: 'first' })
      axes.addXAxis({ ...implicitXAxis, id: 'second' })
      axes.addXAxis({ ...implicitXAxis, id: 'first', tickCount: 3 })
    }
    else if (key === 'yAxis') {
      axes.addYAxis({ ...implicitYAxis, id: 'first' })
      axes.addYAxis({ ...implicitYAxis, id: 'second' })
      axes.addYAxis({ ...implicitYAxis, id: 'first', tickCount: 3 })
    }
    else {
      axes.addZAxis({ ...implicitZAxis, id: 'first' })
      axes.addZAxis({ ...implicitZAxis, id: 'second' })
      axes.addZAxis({ ...implicitZAxis, id: 'first', name: 'changed' })
    }
    const registered = axes.state.value
    expect(Object.keys(registered[key])).toEqual(['first', 'second'])
    expect(original[key]).toEqual({})
    expect(sibling.state.value[key]).toEqual({})
    expect(registered).not.toBe(original)
    for (const other of ['xAxis', 'yAxis', 'zAxis'] as const) {
      if (other !== key)
        expect(registered[other]).toBe(original[other])
    }
    // Invoke the matching typed operation with its own stored settings.
    if (key === 'xAxis')
      axes.addXAxis({ ...registered.xAxis.first })
    else if (key === 'yAxis')
      axes.addYAxis({ ...registered.yAxis.first })
    else axes.addZAxis({ ...registered.zAxis.first })
    expect(axes.state.value).toBe(registered)
    if (key === 'xAxis')
      axes.removeXAxis({ ...implicitXAxis, id: 'missing' })
    else if (key === 'yAxis')
      axes.removeYAxis({ ...implicitYAxis, id: 'missing' })
    else axes.removeZAxis({ ...implicitZAxis, id: 'missing' })
    expect(axes.state.value).toBe(registered)
    if (key === 'xAxis')
      axes.removeXAxis(registered.xAxis.first)
    else if (key === 'yAxis')
      axes.removeYAxis(registered.yAxis.first)
    else axes.removeZAxis(registered.zAxis.first)
    expect(Object.keys(axes.state.value[key])).toEqual(['second'])
    expect(Object.keys(registered[key])).toEqual(['first', 'second'])
  })

  it('suppresses unchanged widths and small oscillations while replacing changed ancestors', () => {
    const axes = createChartCartesianAxis()
    axes.addYAxis({ ...implicitYAxis, id: 0, width: 60 })
    const original = axes.state.value
    axes.updateYAxisWidth({ id: 'missing', width: 10 })
    axes.updateYAxisWidth({ id: 0, width: 60 })
    expect(axes.state.value).toBe(original)
    axes.updateYAxisWidth({ id: 0, width: 61 })
    const changed = axes.state.value
    expect(changed).not.toBe(original)
    expect(changed.yAxis).not.toBe(original.yAxis)
    expect(changed.yAxis[0]).not.toBe(original.yAxis[0])
    expect(original.yAxis[0].width).toBe(60)
    expect(changed.xAxis).toBe(original.xAxis)
    expect(changed.yAxis[0].widthHistory).toEqual([61])
    axes.updateYAxisWidth({ id: 0, width: 60 })
    axes.updateYAxisWidth({ id: 0, width: 61 })
    const oscillating = axes.state.value
    axes.updateYAxisWidth({ id: 0, width: 60 })
    expect(axes.state.value).toBe(oscillating)
    axes.updateYAxisWidth({ id: 0, width: 80 })
    expect(axes.state.value.yAxis[0].width).toBe(80)
    expect(axes.state.value.yAxis[0].widthHistory).toEqual([60, 61, 80])
  })
})

it.each(['cartesian', 'polar'] as const)('keeps %s registration order and mutable data through replace/remove', (kind) => {
  const items = createChartGraphicalItems()
  const sibling = createChartGraphicalItems()
  const operations = kind === 'cartesian'
    ? { key: 'cartesianItems' as const }
    : { key: 'polarItems' as const }
  // Use separate typed scenarios without casting the different domain contracts.
  function exercise<T extends { data: unknown }>(add: (item: T) => void, replace: (payload: { prev: T, next: T }) => T, remove: (item: T) => void, first: T) {
    const second = { ...first }
    add(first)
    add(second)
    const before = items.state.value
    expect(replace({ prev: first, next: { ...first } })).toBe(first)
    expect(items.state.value).toBe(before)
    remove({ ...first })
    expect(items.state.value).toBe(before)
    const next = { ...first, data: [{ value: 20 }] }
    expect(replace({ prev: first, next })).toBe(next)
    expect(items.state.value[operations.key]).toEqual([next, second])
    expect(before[operations.key]).toEqual([first, second])
    expect(items.state.value[kind === 'cartesian' ? 'polarItems' : 'cartesianItems']).toBe(before[kind === 'cartesian' ? 'polarItems' : 'cartesianItems'])
    remove(next)
    expect(items.state.value[operations.key]).toEqual([second])
    expect(Object.isFrozen(first.data)).toBe(false)
  }
  if (kind === 'cartesian')
    exercise(items.addCartesianGraphicalItem, items.replaceCartesianGraphicalItem, items.removeCartesianGraphicalItem, cartesian)
  else exercise(items.addPolarGraphicalItem, items.replacePolarGraphicalItem, items.removePolarGraphicalItem, polar)
  expect(sibling.state.value).toEqual({ countOfBars: 0, cartesianItems: [], polarItems: [] })
  const registered = items.state.value
  items.addBar()
  expect(items.state.value.countOfBars).toBe(1)
  expect(items.state.value.cartesianItems).toBe(registered.cartesianItems)
  items.removeBar()
  expect(items.state.value.countOfBars).toBe(0)
})

it('tracks only registration inputs and keeps panorama and pointer geometry isolated', async () => {
  const input = shallowRef({ ...cartesian, type: 'bar' as const })
  let items: ReturnType<typeof useChartGraphicalItems>
  let axes: ReturnType<typeof useChartCartesianAxis>
  let tooltip: ReturnType<typeof useChartTooltip>
  let state: ReturnType<typeof useAppSelector<import('../store').RechartsRootState>>
  const Reader = defineComponent({
    setup() {
      items = useChartGraphicalItems()
      axes = useChartCartesianAxis()
      tooltip = useChartTooltip()
      state = useAppSelector(state => state)
      axes.addXAxis({ ...implicitXAxis, id: 0 })
      axes.addYAxis({ ...implicitYAxis, id: 0 })
      SetCartesianGraphicalItem(input)
      SetCartesianGraphicalItem({ ...cartesian, type: 'bar', isPanorama: true })
      SetPolarGraphicalItem(polar)
      return () => null
    },
  })
  const Fixture = defineComponent({
    setup() {
      provideChartContext(createRechartsStore())
      return () => <Reader />
    },
  })
  const { unmount } = render(Fixture)
  const original = items!.state.value
  const scale = selectAxisScale(state!.value, 'yAxis', 0, false)
  expect(selectCartesianItemsSettings(state!.value, 'yAxis', 0, false)).toHaveLength(2)
  expect(selectAllVisibleBars(state!.value, 0, 0, false)).toHaveLength(1)
  expect(selectAllVisibleBars(state!.value, 0, 0, true)).toHaveLength(1)
  tooltip!.setKeyboardInteraction({ active: true, activeIndex: '0', activeDataKey: 'value' })
  items!.addBar()
  axes!.updateYAxisWidth({ id: 0, width: 75 })
  await nextTick()
  expect(items!.state.value.cartesianItems).toBe(original.cartesianItems)
  expect(items!.state.value.polarItems).toBe(original.polarItems)
  input.value = { ...input.value }
  await nextTick()
  expect(items!.state.value.cartesianItems).toBe(original.cartesianItems)
  input.value = { ...input.value, hide: true }
  await nextTick()
  expect(items!.state.value.cartesianItems.map(item => item.isPanorama)).toEqual([false, true])
  expect(items!.state.value.cartesianItems[0].hide).toBe(true)
  expect(original.cartesianItems[0].hide).toBe(false)
  // Width affects scale range. Check pointer identity after the geometry change settles.
  const resizedScale = selectAxisScale(state!.value, 'yAxis', 0, false)
  expect(scale).toBeDefined()
  tooltip!.setKeyboardInteraction({ active: true, activeIndex: '1', activeDataKey: 'value' })
  expect(selectAxisScale(state!.value, 'yAxis', 0, false)).toBe(resizedScale)
  unmount()
  expect(items!.state.value.cartesianItems).toEqual([])
  expect(items!.state.value.polarItems).toEqual([])
})
