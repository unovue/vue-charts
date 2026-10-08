import { describe, expect, it, vi } from 'vitest'
import type { TooltipSyncMessage } from '@/utils/events'
import type { BrushStartEndIndex } from '@/types/chartData'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'

const tooltipMessage: TooltipSyncMessage = {
  kind: 'tooltip',
  active: true,
  coordinate: undefined,
  dataKey: undefined,
  index: 0,
  label: 'A',
}
const brushIndexes: BrushStartEndIndex = { startIndex: 0, endIndex: 2 }

describe('eventCenter', () => {
  it('dispatches each event only to its own listeners', () => {
    const tooltipListener = vi.fn()
    const brushListener = vi.fn()

    eventCenter.on(TOOLTIP_SYNC_EVENT, tooltipListener)
    eventCenter.on(BRUSH_SYNC_EVENT, brushListener)

    const emitter = Symbol('emitter')
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipMessage, emitter)
    eventCenter.emit(BRUSH_SYNC_EVENT, 'sync-id', brushIndexes, emitter)

    expect(tooltipListener).toHaveBeenCalledWith('sync-id', tooltipMessage, emitter)
    expect(brushListener).toHaveBeenCalledWith('sync-id', brushIndexes, emitter)
    expect(tooltipListener).toHaveBeenCalledTimes(1)
    expect(brushListener).toHaveBeenCalledTimes(1)
    eventCenter.off(TOOLTIP_SYNC_EVENT, tooltipListener)
    eventCenter.off(BRUSH_SYNC_EVENT, brushListener)
  })

  it('removes only the exact listener reference on cleanup', () => {
    const firstListener = vi.fn()
    const secondListener = vi.fn()

    eventCenter.on(TOOLTIP_SYNC_EVENT, firstListener)
    eventCenter.on(TOOLTIP_SYNC_EVENT, secondListener)
    eventCenter.off(TOOLTIP_SYNC_EVENT, firstListener)
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipMessage, Symbol('emitter'))

    expect(firstListener).not.toHaveBeenCalled()
    expect(secondListener).toHaveBeenCalledTimes(1)

    eventCenter.off(TOOLTIP_SYNC_EVENT, secondListener)
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipMessage, Symbol('emitter'))
    expect(secondListener).toHaveBeenCalledTimes(1)
  })

  it('preserves duplicate registrations and removes all matching references', () => {
    const listener = vi.fn()
    eventCenter.on(BRUSH_SYNC_EVENT, listener)
    eventCenter.on(BRUSH_SYNC_EVENT, listener)
    eventCenter.emit(BRUSH_SYNC_EVENT, 0, brushIndexes, Symbol('chart'))
    expect(listener).toHaveBeenCalledTimes(2)
    eventCenter.off(BRUSH_SYNC_EVENT, listener)
    eventCenter.emit(BRUSH_SYNC_EVENT, 0, brushIndexes, Symbol('chart'))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('applies listener changes to the next dispatch', () => {
    const removedListener = vi.fn()
    const addedListener = vi.fn()
    const changeListeners = () => {
      eventCenter.off(BRUSH_SYNC_EVENT, removedListener)
      eventCenter.on(BRUSH_SYNC_EVENT, addedListener)
    }
    eventCenter.on(BRUSH_SYNC_EVENT, changeListeners)
    eventCenter.on(BRUSH_SYNC_EVENT, removedListener)
    eventCenter.emit(BRUSH_SYNC_EVENT, 0, brushIndexes, Symbol('chart'))
    expect(removedListener).toHaveBeenCalledTimes(1)
    expect(addedListener).not.toHaveBeenCalled()
    eventCenter.off(BRUSH_SYNC_EVENT, changeListeners)
    eventCenter.emit(BRUSH_SYNC_EVENT, 0, brushIndexes, Symbol('chart'))
    expect(removedListener).toHaveBeenCalledTimes(1)
    expect(addedListener).toHaveBeenCalledTimes(1)
    eventCenter.off(BRUSH_SYNC_EVENT, addedListener)
  })
})
