import { describe, expect, it } from 'vitest'
import { createChartTooltip } from '../chartTooltip'
import type { TooltipPayloadConfiguration } from '../chartTooltip'

describe('chart tooltip', () => {
  it('creates independent defaults for every chart and interaction channel', () => {
    const first = createChartTooltip()
    const second = createChartTooltip()
    expect(first.state.value).not.toBe(second.state.value)
    expect(first.state.value.itemInteraction.hover).not.toBe(first.state.value.axisInteraction.hover)
    first.setActiveMouseOverItemIndex({ activeIndex: '1', activeDataKey: 'value' })
    expect(second.state.value.itemInteraction.hover).toEqual({ active: false, index: null, dataKey: undefined, coordinate: undefined })
    expect(first.state.value.axisInteraction.hover.active).toBe(false)
  })

  it.each([
    ['setActiveMouseOverItemIndex', 'itemInteraction', 'hover'],
    ['setActiveClickItemIndex', 'itemInteraction', 'click'],
    ['setMouseOverAxisIndex', 'axisInteraction', 'hover'],
    ['setMouseClickAxisIndex', 'axisInteraction', 'click'],
  ] as const)('%s replaces changed ancestors atomically and preserves other state', (operation, channel, trigger) => {
    const tooltip = createChartTooltip()
    const coordinate = { x: 20, y: 30 }
    tooltip.setSyncInteraction({ active: true, index: '0', dataKey: 'other', coordinate, label: 'A' })
    tooltip.setKeyboardInteraction({ active: true, activeIndex: '0', activeDataKey: 'other', activeCoordinate: coordinate })
    const previous = tooltip.state.value
    const payload = { activeIndex: '1', activeDataKey: 'value', activeCoordinate: coordinate }
    tooltip[operation](payload)
    const next = tooltip.state.value
    expect(next).not.toBe(previous)
    expect(next[channel]).not.toBe(previous[channel])
    expect(next[channel][trigger]).toEqual({ active: true, index: '1', dataKey: 'value', coordinate })
    expect(previous[channel][trigger].active).toBe(false)
    expect(next[channel][trigger === 'hover' ? 'click' : 'hover']).toBe(previous[channel][trigger === 'hover' ? 'click' : 'hover'])
    expect(next[channel === 'itemInteraction' ? 'axisInteraction' : 'itemInteraction']).toBe(previous[channel === 'itemInteraction' ? 'axisInteraction' : 'itemInteraction'])
    expect(next.syncInteraction).toEqual({ active: false, index: '0', dataKey: 'other', coordinate, label: 'A' })
    expect(next.keyboardInteraction).toEqual({ active: false, index: '0', dataKey: 'other', coordinate })
    expect(next.settings).toBe(previous.settings)
    expect(next.tooltipItemPayloads).toBe(previous.tooltipItemPayloads)
    tooltip[operation](payload)
    expect(tooltip.state.value).toBe(next)
  })

  it('retains hover positions and click state on leave and suppresses repeated leaves', () => {
    const tooltip = createChartTooltip()
    const payload = { activeIndex: '2', activeDataKey: 'value', activeCoordinate: { x: 20, y: 30 } }
    tooltip.setActiveClickItemIndex(payload)
    tooltip.setActiveMouseOverItemIndex(payload)
    tooltip.setMouseOverAxisIndex(payload)
    const previous = tooltip.state.value
    tooltip.mouseLeaveItem()
    expect(tooltip.state.value.itemInteraction.hover).toEqual({ active: false, index: '2', dataKey: 'value', coordinate: payload.activeCoordinate })
    expect(tooltip.state.value.axisInteraction).toBe(previous.axisInteraction)
    tooltip.mouseLeaveChart()
    expect(tooltip.state.value.axisInteraction.hover).toEqual({ active: false, index: '2', dataKey: 'value', coordinate: payload.activeCoordinate })
    expect(tooltip.state.value.itemInteraction.click).toBe(previous.itemInteraction.click)
    const next = tooltip.state.value
    tooltip.mouseLeaveChart()
    tooltip.mouseLeaveItem()
    expect(tooltip.state.value).toBe(next)
  })

  it('preserves registration order, caller identity, duplicates, and absent-removal no-ops', () => {
    const tooltip = createChartTooltip()
    const entry: TooltipPayloadConfiguration = {
      settings: { nameKey: undefined },
      dataDefinedOnItem: [{ value: 10 }],
      positions: undefined,
    }
    const other = { ...entry }
    const initial = tooltip.state.value
    tooltip.removeTooltipEntrySettings(entry)
    expect(tooltip.state.value).toBe(initial)
    tooltip.addTooltipEntrySettings(entry)
    const first = tooltip.state.value
    tooltip.addTooltipEntrySettings(other)
    tooltip.addTooltipEntrySettings(entry)
    expect(tooltip.state.value.tooltipItemPayloads).toEqual([entry, other, entry])
    expect(first.tooltipItemPayloads).toEqual([entry])
    expect(tooltip.state.value.tooltipItemPayloads[0]).toBe(entry)
    expect(Object.isFrozen(entry.dataDefinedOnItem)).toBe(false)
    tooltip.removeTooltipEntrySettings(entry)
    expect(tooltip.state.value.tooltipItemPayloads).toEqual([other, entry])
  })

  it('suppresses equivalent settings, keyboard, and sync reports without mutating prior snapshots', () => {
    const tooltip = createChartTooltip()
    const initial = tooltip.state.value
    tooltip.setTooltipSettingsState({ ...initial.settings })
    tooltip.setSyncInteraction({ ...initial.syncInteraction })
    tooltip.setKeyboardInteraction({ active: false, activeIndex: null, activeDataKey: undefined })
    expect(tooltip.state.value).toBe(initial)
    tooltip.setTooltipSettingsState({ ...initial.settings, active: true })
    tooltip.setKeyboardInteraction({ active: true, activeIndex: '1', activeDataKey: 'value' })
    tooltip.setSyncInteraction({ ...initial.syncInteraction, active: true, index: '2', label: 'B' })
    expect(initial.settings.active).toBe(false)
    expect(initial.keyboardInteraction.active).toBe(false)
    expect(initial.syncInteraction.active).toBe(false)
    expect(tooltip.state.value.settings.active).toBe(true)
    expect(tooltip.state.value.keyboardInteraction.index).toBe('1')
    expect(tooltip.state.value.syncInteraction.label).toBe('B')
  })
})
