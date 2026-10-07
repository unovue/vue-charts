import type { EmitFn } from 'vue'
import type { MouseHandlerDataParam } from '@/types/common'

export type ChartPointerState = MouseHandlerDataParam

const chartPointerEvent = (_state: ChartPointerState, _event: MouseEvent | TouchEvent) => true

export const chartEmits = {
  click: chartPointerEvent,
  mouseenter: chartPointerEvent,
  mousemove: chartPointerEvent,
  mouseleave: chartPointerEvent,
  mousedown: chartPointerEvent,
  mouseup: chartPointerEvent,
  contextmenu: chartPointerEvent,
  dblclick: chartPointerEvent,
  touchstart: chartPointerEvent,
  touchmove: chartPointerEvent,
  touchend: chartPointerEvent,
}

// Declared listeners are consumed by Vue, so forward them explicitly once.
export function chartListeners(emit: EmitFn<typeof chartEmits>) {
  return {
    onClick: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('click', state, event),
    onMouseenter: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('mouseenter', state, event),
    onMousemove: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('mousemove', state, event),
    onMouseleave: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('mouseleave', state, event),
    onMousedown: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('mousedown', state, event),
    onMouseup: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('mouseup', state, event),
    onContextmenu: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('contextmenu', state, event),
    onDblclick: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('dblclick', state, event),
    onTouchstart: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('touchstart', state, event),
    onTouchmove: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('touchmove', state, event),
    onTouchend: (state: ChartPointerState, event: MouseEvent | TouchEvent) => emit('touchend', state, event),
  }
}

export const cellGridEmits = {
  'update:activeIndex': (_index: number | null) => true,
  'cell-click': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'cell-mouseenter': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'cell-mouseleave': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

type CellListener<Payload> = (cell: Payload, index: number, event: MouseEvent) => void

/** Typed cell events of a cell chart, in both spellings Vue accepts. */
export interface CellEvents<Payload> {
  'onCell-click'?: CellListener<Payload>
  'onCellClick'?: CellListener<Payload>
  'onCell-mouseenter'?: CellListener<Payload>
  'onCellMouseenter'?: CellListener<Payload>
  'onCell-mouseleave'?: CellListener<Payload>
  'onCellMouseleave'?: CellListener<Payload>
}

/**
 * Forwards the cell events of an inner cell grid once. `map` turns the inner payload into the
 * outer one; cells it maps to `undefined` emit nothing.
 */
export function cellGridListeners<In = unknown>(emit: EmitFn<typeof cellGridEmits>, map: (payload: In) => unknown = payload => payload) {
  const relay = (send: (payload: unknown, index: number, event: MouseEvent) => void) => (payload: In, index: number, event: MouseEvent) => {
    const cell = map(payload)
    if (cell !== undefined)
      send(cell, index, event)
  }
  return {
    'onUpdate:activeIndex': (index: number | null) => emit('update:activeIndex', index),
    'onCell-click': relay((cell, index, event) => emit('cell-click', cell, index, event)),
    'onCell-mouseenter': relay((cell, index, event) => emit('cell-mouseenter', cell, index, event)),
    'onCell-mouseleave': relay((cell, index, event) => emit('cell-mouseleave', cell, index, event)),
    'onAnimation-start': () => emit('animation-start'),
    'onAnimation-end': () => emit('animation-end'),
  }
}
