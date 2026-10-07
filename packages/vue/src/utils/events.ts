import type { TooltipSyncInteraction } from '@/types/tooltip'
import type { BrushStartEndIndex } from '@/types/chartData'

export const TOOLTIP_SYNC_EVENT = 'recharts.syncEvent.tooltip'

export const BRUSH_SYNC_EVENT = 'recharts.syncEvent.brush'

function createChannel<Arguments extends unknown[]>() {
  type Listener = (...args: Arguments) => void
  let listeners: Listener[] = []
  return {
    on(listener: Listener) {
      listeners.push(listener)
    },
    off(listener: Listener) {
      listeners = listeners.filter(registered => registered !== listener)
    },
    emit(...args: Arguments) {
      for (const listener of [...listeners]) {
        listener(...args)
      }
    },
  }
}

export type TooltipSyncMessage = TooltipSyncInteraction & { kind: 'tooltip' }

interface EventTypes {
  [TOOLTIP_SYNC_EVENT]: (syncId: number | string, data: TooltipSyncMessage, emitter: symbol) => void
  [BRUSH_SYNC_EVENT]: (syncId: number | string, data: BrushStartEndIndex, emitter: symbol) => void
}

export type SyncEventName = keyof EventTypes

export type SyncListener<T extends SyncEventName> = (...args: Parameters<EventTypes[T]>) => void

const channels: { [Event in SyncEventName]: ReturnType<typeof createChannel<Parameters<EventTypes[Event]>>> } = {
  [TOOLTIP_SYNC_EVENT]: createChannel(),
  [BRUSH_SYNC_EVENT]: createChannel(),
}

export const eventCenter = {
  on<Event extends SyncEventName>(event: Event, listener: SyncListener<NoInfer<Event>>) {
    channels[event].on(listener)
  },
  off<Event extends SyncEventName>(event: Event, listener: SyncListener<NoInfer<Event>>) {
    channels[event].off(listener)
  },
  emit<Event extends SyncEventName>(event: Event, ...args: Parameters<EventTypes[NoInfer<Event>]>) {
    channels[event].emit(...args)
  },
}
