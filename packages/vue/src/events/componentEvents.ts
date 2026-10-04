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
