import { describe, expect, it, vi } from 'vitest'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { TooltipSyncState } from '@/state/tooltipSlice'
import type { BrushStartEndIndex } from '@/state/chartDataSlice'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'

const tooltipAction = { payload: { active: true } } as PayloadAction<TooltipSyncState>
const brushIndexes: BrushStartEndIndex = { startIndex: 0, endIndex: 2 }

describe('eventCenter', () => {
  it('dispatches each event only to its own listeners', () => {
    const tooltipListener = vi.fn()
    const brushListener = vi.fn()

    eventCenter.on(TOOLTIP_SYNC_EVENT, tooltipListener)
    eventCenter.on(BRUSH_SYNC_EVENT, brushListener)

    const emitter = Symbol('emitter')
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipAction, emitter)
    eventCenter.emit(BRUSH_SYNC_EVENT, 'sync-id', brushIndexes, emitter)

    expect(tooltipListener).toHaveBeenCalledWith('sync-id', tooltipAction, emitter)
    expect(brushListener).toHaveBeenCalledWith('sync-id', brushIndexes, emitter)
  })

  it('removes only the exact listener reference on cleanup', () => {
    const firstListener = vi.fn()
    const secondListener = vi.fn()

    eventCenter.on(TOOLTIP_SYNC_EVENT, firstListener)
    eventCenter.on(TOOLTIP_SYNC_EVENT, secondListener)
    eventCenter.off(TOOLTIP_SYNC_EVENT, firstListener)
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipAction, Symbol('emitter'))

    expect(firstListener).not.toHaveBeenCalled()
    expect(secondListener).toHaveBeenCalledTimes(1)

    eventCenter.off(TOOLTIP_SYNC_EVENT, secondListener)
    eventCenter.emit(TOOLTIP_SYNC_EVENT, 'sync-id', tooltipAction, Symbol('emitter'))
    expect(secondListener).toHaveBeenCalledTimes(1)
  })
})
