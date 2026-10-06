import { describe, expect, it } from 'vitest'
import { createChartBrush } from '../chartBrush'

// Keep Brush settings isolated between charts until its model migrates.
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
})
