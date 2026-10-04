import { describe, expect, it } from 'vitest'
import { watch } from 'vue'
import { createChartLayout } from '../chartLayout'

describe('chart-local Vue layout', () => {
  it('updates dimensions, margins and direction atomically without mutating inputs', () => {
    const layout = createChartLayout()
    const snapshots: unknown[] = []
    const stop = watch(layout.state, state => snapshots.push(state), { flush: 'sync' })
    const margin = { top: 10, right: 20, bottom: 30, left: 40 }
    layout.setProps('vertical', { width: 500, height: 300 }, margin)
    expect(snapshots).toEqual([{
      layoutType: 'vertical',
      width: 500,
      height: 300,
      margin,
      scale: 1,
    }])
    expect(layout.state.value.margin).not.toBe(margin)
    expect(Object.isFrozen(margin)).toBe(false)
    margin.left = 80
    expect(layout.state.value.margin.left).toBe(40)
    stop()
  })

  it('preserves snapshot identity for equivalent reports and margin identity for resizes', () => {
    const layout = createChartLayout()
    const before = layout.state.value
    layout.setProps('horizontal', { width: 0, height: 0 }, { top: 5, right: 5, bottom: 5, left: 5 })
    layout.setScale(1)
    expect(layout.state.value).toBe(before)
    layout.setProps('horizontal', { width: 500, height: 300 }, before.margin)
    expect(layout.state.value).not.toBe(before)
    expect(layout.state.value.margin).toBe(before.margin)
    expect(before.width).toBe(0)
    layout.setScale(2)
    expect(layout.state.value.scale).toBe(2)
  })

  it('owns fresh chart-local defaults without sharing layout snapshots', () => {
    const first = createChartLayout()
    const second = createChartLayout()
    expect(first.state.value).not.toBe(second.state.value)
    expect(first.state.value.margin).not.toBe(second.state.value.margin)
    first.setProps('vertical', { width: 300, height: 500 }, {})
    expect(second.state.value.width).toBe(0)
  })
})
