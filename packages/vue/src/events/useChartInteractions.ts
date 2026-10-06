import { useChart } from '@/model/chart'
import { combineActiveProps } from '@/core/interaction'
import { useItemInteractions } from './useItemInteractions'
import { getChartPointer } from '@/utils/pointer'
import { DATA_ITEM_DATAKEY_ATTRIBUTE_NAME, DATA_ITEM_INDEX_ATTRIBUTE_NAME } from '@/utils/const'
import type { ChartPointer } from '@/types'

export function useChartInteractions() {
  const chart = useChart()
  const tooltip = chart.tooltip

  function selectionAtPointer(pointer: ChartPointer | undefined) {
    return combineActiveProps(
      pointer,
      chart.inputs.layout(),
      chart.polarLayout.viewBox.value,
      tooltip.axisType.value,
      tooltip.axis.value?.reversedRange.value,
      tooltip.ticks.value,
      tooltip.orderedTicks.value,
      chart.offset.value,
    )
  }

  function coordinateAt(index: string) {
    return tooltip.coordinateFor(tooltip.targets.value.find(target => target.index === index))
  }

  function click(chartPointer: ChartPointer) {
    const tooltipEventType = tooltip.eventType.value
    if (tooltipEventType === 'axis') {
      const activeProps = selectionAtPointer(chartPointer)
      if (activeProps?.activeIndex != null) {
        tooltip.setMouseClickAxisIndex({
          activeIndex: activeProps.activeIndex,
          activeDataKey: undefined,
          activeCoordinate: activeProps.activeCoordinate,
        })
      }
    }
  }

  function move(chartPointer: ChartPointer) {
    const tooltipEventType = tooltip.eventType.value
    const activeProps = selectionAtPointer(chartPointer)
    if (tooltipEventType === 'axis') {
      if (activeProps?.activeIndex != null) {
        tooltip.setMouseOverAxisIndex({
          activeIndex: activeProps.activeIndex,
          activeDataKey: undefined,
          activeCoordinate: activeProps.activeCoordinate,
        })
      }
      else {
        tooltip.mouseLeaveChart()
      }
    }
  }

  const { keyDown: itemKeyDown } = useItemInteractions()

  function keyDown(event: KeyboardEvent) {
    const { key } = event
    const accessibilityLayerIsActive = chart.rootProps.value.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    if (tooltip.eventType.value === 'item') {
      itemKeyDown(event)
      return
    }
    const keyboardInteraction = {
      index: tooltip.target.value?.index ?? null,
      active: tooltip.source.active.value,
      dataKey: tooltip.target.value?.entry?.value?.settings.dataKey,
    }
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter')
      return
    const currentIndex = tooltip.source.index.value ?? 0
    const tooltipTicks = tooltip.ticks.value
    if (!tooltipTicks?.length)
      return
    if (key === 'Enter') {
      const coordinate = coordinateAt(String(keyboardInteraction.index))
      tooltip.setKeyboardInteraction({
        active: !keyboardInteraction.active,
        activeIndex: keyboardInteraction.index,
        activeDataKey: keyboardInteraction.dataKey,
        activeCoordinate: coordinate,
      })
      return
    }

    const direction = chart.direction.value
    const directionMultiplier = direction === 'left-to-right' ? 1 : -1
    const movement = key === 'ArrowRight' ? 1 : -1
    const nextIndex = currentIndex + movement * directionMultiplier
    if (nextIndex >= tooltipTicks.length || nextIndex < 0) {
      return
    }
    const coordinate = coordinateAt(String(nextIndex))

    tooltip.setKeyboardInteraction({
      active: true,
      activeIndex: nextIndex.toString(),
      activeDataKey: undefined,
      activeCoordinate: coordinate,
    })
  }

  function focus() {
    const accessibilityLayerIsActive = chart.rootProps.value.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    if (tooltip.eventType.value === 'item')
      return
    const keyboardInteraction = { index: tooltip.target.value?.index ?? null, active: tooltip.source.active.value }
    if (keyboardInteraction.active) {
      return
    }
    if (keyboardInteraction.index == null) {
      const nextIndex = '0'
      const coordinate = coordinateAt(String(nextIndex))
      tooltip.setKeyboardInteraction({
        activeDataKey: undefined,
        active: true,
        activeIndex: nextIndex,
        activeCoordinate: coordinate,
      })
    }
  }

  function touchMove(touchEvent: TouchEvent) {
    const touch = touchEvent.touches[0]
    if (!touch)
      return
    const tooltipEventType = tooltip.eventType.value
    if (tooltipEventType === 'axis') {
      const activeProps = selectionAtPointer(
        getChartPointer({
          clientX: touch.clientX,
          clientY: touch.clientY,
          currentTarget: touchEvent.currentTarget,
        })!,
      )
      if (activeProps?.activeIndex != null) {
        tooltip.setMouseOverAxisIndex({
          activeIndex: activeProps.activeIndex,
          activeDataKey: undefined,
          activeCoordinate: activeProps.activeCoordinate,
        })
      }
    }
    else if (tooltipEventType === 'item') {
      const target = document.elementFromPoint(touch.clientX, touch.clientY)
      if (!target || !target.getAttribute) {
        return
      }
      const itemIndex = target.getAttribute(DATA_ITEM_INDEX_ATTRIBUTE_NAME)
      const dataKey = target.getAttribute(DATA_ITEM_DATAKEY_ATTRIBUTE_NAME)
      const coordinate = tooltip.coordinateAt(itemIndex, dataKey!)

      tooltip.setActiveMouseOverItemIndex({
        activeDataKey: dataKey!,
        activeIndex: itemIndex,
        activeCoordinate: coordinate,
      })
    }
  }

  return { click, move, keyDown, focus, touchMove }
}
