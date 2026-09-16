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
function createEventBus<TEvents extends Record<string, (...args: any[]) => void>>() {
  const listeners = new Map<keyof TEvents, Set<Listener>>()

  function getListeners(event: keyof TEvents): Set<Listener> {
    let eventListeners = listeners.get(event)
    if (!eventListeners) {
      eventListeners = new Set()
      listeners.set(event, eventListeners)
    }
    return eventListeners
  }

  return {
    on<K extends keyof TEvents>(event: K, listener: TEvents[K]) {
      getListeners(event).add(listener)
    },
    off<K extends keyof TEvents>(event: K, listener: TEvents[K]) {
      listeners.get(event)?.delete(listener)
    },
    emit<K extends keyof TEvents>(event: K, ...args: Parameters<TEvents[K]>) {
      const eventListeners = listeners.get(event)
      if (!eventListeners) {
        return
      }
      for (const listener of [...eventListeners]) {
        listener(...args as Parameters<TEvents[K]>)
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

export type SyncEventName = keyof EventTypes

export type SyncListener<T extends SyncEventName> = (...args: Parameters<EventTypes[T]>) => void
