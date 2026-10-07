import { useChart } from '@/model/chart'
import { activeProps as getActiveProps } from '@/core/interaction'
import { useItemInteractions } from './useItemInteractions'
import { getChartPointer } from '@/utils/pointer'
import { DATA_ITEM_DATAKEY_ATTRIBUTE_NAME, DATA_ITEM_INDEX_ATTRIBUTE_NAME } from '@/utils/const'
import type { ChartPointer } from '@/types'

export function useChartInteractions() {
  const chart = useChart()
  const tooltip = chart.tooltip

  function selectionAtPointer(pointer: ChartPointer | undefined, target?: EventTarget | null) {
    const selection = getActiveProps(
      pointer,
      chart.inputs.layout(),
      chart.polarLayout.viewBox.value,
      tooltip.axisType.value,
      tooltip.axis.value?.reversedRange.value,
      tooltip.ticks.value,
      tooltip.orderedTicks.value,
      chart.offset.value,
    )
    if (selection || !pointer || !(target instanceof Element))
      return selection
    // Radial bars can extend past the polar viewport's inner or outer radius.
    // A painted sector still identifies its row at those edges.
    const sector = target.closest('.v-charts-radial-bar .v-charts-sector')
    const index = sector?.getAttribute(DATA_ITEM_INDEX_ATTRIBUTE_NAME)
    if (index == null)
      return undefined
    return {
      activeIndex: Number(index),
      activeCoordinate: { x: pointer.chartX, y: pointer.chartY },
    }
  }

  function coordinateAt(index: number | null) {
    return tooltip.coordinateFor(tooltip.targets.value.find(target => target.index === index))
  }

  function click(chartPointer: ChartPointer, target?: EventTarget | null) {
    const tooltipEventType = tooltip.eventType.value
    if (tooltipEventType === 'axis') {
      const activeProps = selectionAtPointer(chartPointer, target)
      if (activeProps?.activeIndex != null) {
        tooltip.activate('click', {
          type: 'axis',
          index: activeProps.activeIndex,
          coordinate: activeProps.activeCoordinate,
        })
      }
    }
  }

  function move(chartPointer: ChartPointer, target?: EventTarget | null) {
    const tooltipEventType = tooltip.eventType.value
    const activeProps = selectionAtPointer(chartPointer, target)
    if (tooltipEventType === 'axis') {
      if (activeProps?.activeIndex != null) {
        tooltip.activate('hover', {
          type: 'axis',
          index: activeProps.activeIndex,
          coordinate: activeProps.activeCoordinate,
        })
      }
      else {
        tooltip.clear('hover')
      }
    }
  }

  const { keyDown: itemKeyDown } = useItemInteractions()

  function keyDown(event: KeyboardEvent) {
    const { key } = event
    const accessibilityLayerIsActive = chart.options.value.accessibilityLayer !== false
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
      const coordinate = coordinateAt(keyboardInteraction.index)
      tooltip.activate('keyboard', {
        type: 'axis',
        active: !keyboardInteraction.active,
        index: keyboardInteraction.index,
        coordinate,
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
    const coordinate = coordinateAt(nextIndex)

    tooltip.activate('keyboard', {
      type: 'axis',
      active: true,
      index: nextIndex,
      coordinate,
    })
  }

  function focus() {
    const accessibilityLayerIsActive = chart.options.value.accessibilityLayer !== false
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
      const nextIndex = 0
      const coordinate = coordinateAt(nextIndex)
      tooltip.activate('keyboard', {
        type: 'axis',
        active: true,
        index: nextIndex,
        coordinate,
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
        tooltip.activate('hover', {
          type: 'axis',
          index: activeProps.activeIndex,
          coordinate: activeProps.activeCoordinate,
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
      const index = itemIndex === null ? null : Number(itemIndex)
      // A touched element only carries its series dataKey, so the series is found by it here.
      const configuration = tooltip.entries.entries.value.find(entry => entry.settings.dataKey === dataKey)
      tooltip.activate('hover', {
        type: 'item',
        index,
        configuration,
        coordinate: index === null ? undefined : configuration?.positions?.[index],
      })
    }
  }

  return { click, move, keyDown, focus, touchMove }
}
