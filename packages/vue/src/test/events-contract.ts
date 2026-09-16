import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '../utils/events'
import type { SyncListener } from '../utils/events'

const emitter = Symbol('chart')
const brushListener: SyncListener<typeof BRUSH_SYNC_EVENT> = (_syncId, indexes) => {
  indexes.startIndex.toFixed()
}

eventCenter.on(BRUSH_SYNC_EVENT, brushListener)
eventCenter.off(BRUSH_SYNC_EVENT, brushListener)
eventCenter.emit(BRUSH_SYNC_EVENT, 'group', { startIndex: 0, endIndex: 1 }, emitter)

// @ts-expect-error Unknown synchronization events must not be accepted.
eventCenter.emit('unknown-event', 'group', {}, emitter)
// @ts-expect-error Brush events require index bounds rather than tooltip state.
eventCenter.emit(BRUSH_SYNC_EVENT, 'group', { active: true }, emitter)
// @ts-expect-error Tooltip events require an action rather than brush bounds.
eventCenter.emit(TOOLTIP_SYNC_EVENT, 'group', { startIndex: 0, endIndex: 1 }, emitter)
// @ts-expect-error Event listeners must accept the corresponding payload.
eventCenter.on(TOOLTIP_SYNC_EVENT, brushListener)
// @ts-expect-error Unregistration must enforce the same listener contract.
eventCenter.off(TOOLTIP_SYNC_EVENT, brushListener)
// @ts-expect-error Each emitted event must carry its source identity.
eventCenter.emit(BRUSH_SYNC_EVENT, 'group', { startIndex: 0, endIndex: 1 })
