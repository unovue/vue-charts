import type { PayloadAction } from '@reduxjs/toolkit'
import type { TooltipSyncState } from '../state/tooltipSlice'
import type { BrushStartEndIndex } from '@/state/chartDataSlice'

export const TOOLTIP_SYNC_EVENT = 'recharts.syncEvent.tooltip'

export const BRUSH_SYNC_EVENT = 'recharts.syncEvent.brush'

type Listener<Args extends unknown[] = any[]> = (...args: Args) => void

/**
 * Minimal typed pub/sub used for cross-chart synchronisation.
 *
 * Listeners are scoped per event name; `off` only removes the exact listener
 * reference. Charts install listeners inside a component scope and remove them
 * on cleanup, so nothing request-specific is retained between SSR renders.
 */
function createEventBus() {
  const listeners = new Map<string, Set<Listener>>()

  function getListeners(event: string): Set<Listener> {
    let eventListeners = listeners.get(event)
    if (!eventListeners) {
      eventListeners = new Set()
      listeners.set(event, eventListeners)
    }
    return eventListeners
  }

  return {
    on(event: string, listener: Listener) {
      getListeners(event).add(listener)
    },
    off(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener)
    },
    emit(event: string, ...args: any[]) {
      const eventListeners = listeners.get(event)
      if (!eventListeners) {
        return
      }
      for (const listener of [...eventListeners]) {
        listener(...args)
      }
    },
  }
}

const eventCenter = createEventBus()

export { eventCenter }

interface EventTypes {
  [TOOLTIP_SYNC_EVENT]: (syncId: number | string, data: PayloadAction<TooltipSyncState>, emitter: symbol) => void
  [BRUSH_SYNC_EVENT]: (syncId: number | string, data: BrushStartEndIndex, emitter: symbol) => void
}

export type SyncEventName = TOOLTIP_SYNC_EVENT | BRUSH_SYNC_EVENT

export type SyncListener<T extends SyncEventName> = EventTypes[T]
