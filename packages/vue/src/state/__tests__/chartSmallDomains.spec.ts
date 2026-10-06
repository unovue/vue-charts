import { describe, expect, it } from 'vitest'
import { createChartBrush } from '../chartBrush'
import { createChartLegend } from '../chartLegend'
import type { LegendSettings } from '../chartLegend'
import { createChartPolarAxis } from '../chartPolarAxis'
import type { AngleAxisSettings } from '../chartPolarAxis'
import { createChartReferenceElements } from '../chartReferenceElements'

// These checks catch stale selector inputs, shared defaults, reordered registrations,
// and accidental replacement of the chart's synchronization identity during cutover.
describe('chart-local small domains', () => {
  it('replaces brush geometry immutably, retains equal padding, and resets locally', () => {
    const brush = createChartBrush()
    const sibling = createChartBrush()
    const defaults = brush.state.value
    expect(defaults.padding).not.toBe(sibling.state.value.padding)
    brush.setBrushSettings({ ...defaults, height: 20 })
    const resized = brush.state.value
    expect(resized).not.toBe(defaults)
    expect(resized.padding).toBe(defaults.padding)
    expect(defaults.height).toBe(0)
    brush.setBrushSettings({ ...resized, padding: { ...resized.padding } })
    expect(brush.state.value).toBe(resized)
    brush.setBrushSettings({ ...resized, padding: { ...resized.padding, left: 3 } })
    expect(brush.state.value.padding).not.toBe(resized.padding)
    expect(resized.padding.left).toBe(0)
    brush.setBrushSettings(null)
    expect(brush.state.value).toEqual(defaults)
    const reset = brush.state.value
    brush.setBrushSettings(null)
    expect(brush.state.value).toBe(reset)
    expect(sibling.state.value.height).toBe(0)
  })

  it('keeps legend registration order and independent size and settings identities', () => {
    const legend = createChartLegend()
    const sibling = createChartLegend()
    const defaults = legend.state.value
    const first = [{ value: 'first', color: 'red' }]
    const second = [{ value: 'second', color: 'blue' }]
    legend.addLegendPayload(first)
    legend.addLegendPayload(second)
    legend.addLegendPayload(first)
    expect(legend.state.value.payload).toEqual([first, second, first])
    expect(legend.state.value.payload[0]).toBe(first)
    expect(defaults.payload).toEqual([])
    legend.removeLegendPayload(first)
    expect(legend.state.value.payload).toEqual([second, first])
    const registered = legend.state.value
    legend.removeLegendPayload([])
    expect(legend.state.value).toBe(registered)
    legend.setLegendSize({ width: 120, height: 30 })
    expect(legend.state.value.size).toEqual({ width: 120, height: 30 })
    expect(legend.state.value.size).not.toBe(registered.size)
    expect(legend.state.value.payload).toBe(registered.payload)
    expect(legend.state.value.settings).toBe(registered.settings)
    const resized = legend.state.value
    legend.setLegendSize({ width: 120, height: 30 })
    expect(legend.state.value).toBe(resized)
    const settings: LegendSettings = { layout: 'vertical', align: 'left', verticalAlign: 'top', position: 'outside-right', offset: 4 }
    legend.setLegendSettings(settings)
    expect(legend.state.value.settings).toEqual(settings)
    expect(legend.state.value.size).toBe(resized.size)
    const configured = legend.state.value
    legend.setLegendSettings({ ...settings })
    expect(legend.state.value).toBe(configured)
    expect(sibling.state.value).toEqual(defaults)
  })

  it.each([
    ['radiusAxis', 'addRadiusAxis', 'removeRadiusAxis', 'angleAxis'],
    ['angleAxis', 'addAngleAxis', 'removeAngleAxis', 'radiusAxis'],
  ] as const)('preserves %s order and replaces only the changed map', (key, add, remove, other) => {
    const axes = createChartPolarAxis()
    const sibling = createChartPolarAxis()
    const defaults = axes.state.value
    const first: AngleAxisSettings = { id: 'first', type: 'number', dataKey: undefined, scale: 'auto', allowDuplicatedCategory: true, allowDataOverflow: false, reversed: false, includeHidden: false, domain: undefined, unit: undefined, name: undefined, allowDecimals: false, tickCount: 5, ticks: undefined, tick: true }
    const second = { ...first, id: 'second' }
    axes[add](first)
    axes[add](second)
    const registered = axes.state.value
    expect(Object.keys(registered[key])).toEqual(['first', 'second'])
    expect(registered[key].first).toBe(first)
    expect(registered[other]).toBe(defaults[other])
    expect(defaults[key]).toEqual({})
    axes[add]({ ...second })
    expect(axes.state.value).toBe(registered)
    axes[add]({ ...first, tickCount: 10 })
    expect(Object.keys(axes.state.value[key])).toEqual(['first', 'second'])
    expect(registered[key].first.tickCount).toBe(5)
    axes[remove](first)
    expect(Object.keys(axes.state.value[key])).toEqual(['second'])
    const removed = axes.state.value
    axes[remove](first)
    expect(axes.state.value).toBe(removed)
    expect(sibling.state.value[key]).toEqual({})
  })

  it.each([
    ['dots', 'addDot', 'removeDot'],
    ['areas', 'addArea', 'removeArea'],
    ['lines', 'addLine', 'removeLine'],
  ] as const)('preserves %s identity and removes only the first matching registration', (key, add, remove) => {
    const references = createChartReferenceElements()
    const sibling = createChartReferenceElements()
    const defaults = references.state.value
    const first = { xAxisId: 0, yAxisId: 0, ifOverflow: 'discard' as const, x: 1, y: 2, r: 3, x1: 1, x2: 2, y1: 3, y2: 4 }
    const second = { ...first, x: 5 }
    references[add](first)
    references[add](second)
    references[add](first)
    expect(references.state.value[key]).toEqual([first, second, first])
    expect(references.state.value[key][0]).toBe(first)
    expect(defaults[key]).toEqual([])
    references[remove](first)
    expect(references.state.value[key]).toEqual([second, first])
    const removed = references.state.value
    references[remove]({ ...first })
    expect(references.state.value).toBe(removed)
    for (const other of ['dots', 'areas', 'lines'] as const) {
      if (other !== key)
        expect(removed[other]).toBe(defaults[other])
    }
    expect(sibling.state.value[key]).toEqual([])
  })
})
