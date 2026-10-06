import { onUnmounted } from 'vue'
import { useEventListener, useTimeoutFn } from '@vueuse/core'
import type { Ref } from 'vue'
import { getIndex } from '../utils'
import type { BrushState, BrushTravellerId } from '../type'
import type { BrushStartEndIndex } from '@/types/chartData'

export interface UseBrushHandlersProps {
  x: number
  width: number
  travellerWidth: number
  gap: number
  startIndex: number
  endIndex: number
  leaveTimeOut: number
  onChange?: (index: BrushStartEndIndex) => void
  onDragEnd?: (index: BrushStartEndIndex) => void
  data?: unknown[]
}

export function useBrushHandlers(
  brushState: Ref<BrushState>,
  props: UseBrushHandlersProps,
  onChange: (index: BrushStartEndIndex) => void,
  chartData: () => unknown[],
) {
  const leaveTimer = useTimeoutFn(handleDragEnd, () => props.leaveTimeOut, { immediate: false })
  let stopDragListeners: (() => void)[] = []

  function attachDragEndListener() {
    leaveTimer.stop()
    detachDragEndListener()
    stopDragListeners = [
      useEventListener(window, 'mouseup', handleDragEnd, true),
      useEventListener(window, 'touchend', handleDragEnd, true),
      useEventListener(window, 'mousemove', handleMouseDrag, true),
    ]
  }

  function detachDragEndListener() {
    stopDragListeners.forEach(stop => stop())
    stopDragListeners = []
  }

  function handleDrag(e: Touch | MouseEvent) {
    leaveTimer.stop()

    if (brushState.value.isTravellerMoving) {
      handleTravellerMove(e)
    }
    else if (brushState.value.isSlideMoving) {
      handleSlideDrag(e)
    }
  }

  function handleMouseDrag(e: MouseEvent) {
    handleDrag(e)
  }

  function handleSlideDrag(e: Touch | MouseEvent) {
    const { slideMoveStartX, startX, endX, scaleValues } = brushState.value
    if (scaleValues == null || slideMoveStartX == null || startX == null || endX == null) {
      return
    }

    const { x, width, travellerWidth, startIndex, endIndex, gap } = props
    const data = chartData()

    let delta = e.pageX - slideMoveStartX

    if (delta > 0) {
      delta = Math.min(
        delta,
        x + width - travellerWidth - endX,
        x + width - travellerWidth - startX,
      )
    }
    else if (delta < 0) {
      delta = Math.max(delta, x - startX, x - endX)
    }

    const newIndex = getIndex({
      startX: startX + delta,
      endX: endX + delta,
      data,
      gap,
      scaleValues,
    })

    if ((newIndex.startIndex !== startIndex || newIndex.endIndex !== endIndex) && onChange) {
      onChange(newIndex)
    }

    brushState.value.startX = startX + delta
    brushState.value.endX = endX + delta
    brushState.value.slideMoveStartX = e.pageX
  }

  function handleTravellerMove(e: Touch | MouseEvent) {
    const { brushMoveStartX, movingTravellerId, endX, startX, scaleValues } = brushState.value
    if (movingTravellerId == null || scaleValues == null || brushMoveStartX == null || startX == null || endX == null) {
      return
    }

    const prevValue = brushState.value[movingTravellerId]
    if (prevValue == null) {
      return
    }

    const { x, width, travellerWidth, gap } = props
    const data = chartData()

    const params = {
      startX: brushState.value.startX!,
      endX: brushState.value.endX!,
      data,
      gap,
      scaleValues,
    }

    let delta = e.pageX - brushMoveStartX

    if (delta > 0) {
      delta = Math.min(delta, x + width - travellerWidth - prevValue)
    }
    else if (delta < 0) {
      delta = Math.max(delta, x - prevValue)
    }

    params[movingTravellerId] = prevValue + delta

    const newIndex = getIndex(params)
    const { startIndex, endIndex } = newIndex

    const isFullGap = () => {
      const lastIndex = data.length - 1
      if (
        (movingTravellerId === 'startX'
          && (endX > startX ? startIndex % gap === 0 : endIndex % gap === 0))
        || (endX < startX && endIndex === lastIndex)
        || (movingTravellerId === 'endX'
          && (endX > startX ? endIndex % gap === 0 : startIndex % gap === 0))
        || (endX > startX && endIndex === lastIndex)
      ) {
        return true
      }
      return false
    }

    brushState.value[movingTravellerId] = prevValue + delta
    brushState.value.brushMoveStartX = e.pageX

    if (onChange && isFullGap()) {
      onChange(newIndex)
    }
  }

  // --- returned handlers ---

  function handleLeaveWrapper() {
    if (brushState.value.isTravellerMoving || brushState.value.isSlideMoving) {
      leaveTimer.start()
    }
  }

  function handleTouchMove(e: TouchEvent) {
    const touch = e.changedTouches?.[0]
    if (touch != null) {
      handleDrag(touch)
    }
  }

  function handleEnterSlideOrTraveller() {
    brushState.value.isTextActive = true
  }

  function handleLeaveSlideOrTraveller() {
    brushState.value.isTextActive = false
  }

  function handleSlideDragStart(e: MouseEvent | TouchEvent) {
    const event = e instanceof TouchEvent ? e.changedTouches[0] : e
    if (event == null) {
      return
    }

    brushState.value.isTravellerMoving = false
    brushState.value.isSlideMoving = true
    brushState.value.slideMoveStartX = event.pageX

    attachDragEndListener()
  }

  function handleTravellerDragStart(id: BrushTravellerId, e: MouseEvent | TouchEvent) {
    const event = e instanceof TouchEvent ? e.changedTouches[0] : e
    if (event == null) {
      return
    }

    brushState.value.isSlideMoving = false
    brushState.value.isTravellerMoving = true
    brushState.value.movingTravellerId = id
    brushState.value.brushMoveStartX = event.pageX

    attachDragEndListener()
  }

  function handleTravellerMoveKeyboard(direction: 1 | -1, id: BrushTravellerId) {
    const { scaleValues, startX, endX } = brushState.value
    if (scaleValues == null) {
      return
    }

    const data = chartData()
    const { gap, startIndex, endIndex } = props

    // Use the index-based approach from Recharts:
    // determine the current data index from the prop, then move by direction.
    let currentIndex: number = -1
    if (id === 'startX') {
      currentIndex = startIndex
    }
    else if (id === 'endX') {
      currentIndex = endIndex
    }

    if (currentIndex < 0 || currentIndex >= data.length) {
      return
    }

    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= scaleValues.length) {
      return
    }

    const newScaleValue = scaleValues[newIndex]
    if (newScaleValue == null) {
      return
    }

    // Prevent travellers from overlapping
    if ((id === 'startX' && newScaleValue >= endX!) || (id === 'endX' && newScaleValue <= startX!)) {
      return
    }

    brushState.value[id] = newScaleValue

    onChange(
      getIndex({
        startX: brushState.value.startX!,
        endX: brushState.value.endX!,
        data,
        gap,
        scaleValues,
      }),
    )
  }

  function handleDragEnd() {
    leaveTimer.stop()
    brushState.value.isTravellerMoving = false
    brushState.value.isSlideMoving = false

    detachDragEndListener()

    const { startIndex, endIndex } = props
    props.onDragEnd?.({
      startIndex,
      endIndex,
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    leaveTimer.stop()
    detachDragEndListener()
  })

  return {
    handleLeaveWrapper,
    handleTouchMove,
    handleEnterSlideOrTraveller,
    handleLeaveSlideOrTraveller,
    handleSlideDragStart,
    handleTravellerDragStart,
    handleTravellerMoveKeyboard,
    handleDragEnd,
  }
}
