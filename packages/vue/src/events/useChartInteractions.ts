import { useItemInteractions } from './useItemInteractions'
import { selectChartDirection, selectCoordinateForDefaultIndex, selectTooltipAxisTicks, useChartTooltip } from '@/state/chartContext'
import { useAppSelector } from '@/state/hooks'
import { selectActivePropsFromChartPointer } from '@/state/selectors/selectActivePropsFromChartPointer'
import { selectTooltipEventType } from '@/state/selectors/selectTooltipEventType'
import { selectTooltipCoordinate } from '@/state/selectors/touchSelectors'
import { getChartPointer } from '@/utils/chart'
import { DATA_ITEM_DATAKEY_ATTRIBUTE_NAME, DATA_ITEM_INDEX_ATTRIBUTE_NAME } from '@/utils/const'
import type { ChartPointer } from '@/types'

export function useChartInteractions() {
  const chartState = useAppSelector(state => state)
  const tooltip = useChartTooltip()

  function click(chartPointer: ChartPointer) {
    const state = chartState.value
    const tooltipEventType = selectTooltipEventType(state, state.tooltip.settings.shared)
    if (tooltipEventType === 'axis') {
      const activeProps = selectActivePropsFromChartPointer(state, chartPointer)
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
    const state = chartState.value
    const tooltipEventType = selectTooltipEventType(state, state.tooltip.settings.shared)
    const activeProps = selectActivePropsFromChartPointer(state, chartPointer)
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
    const state = chartState.value
    const accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    if (selectTooltipEventType(state, state.tooltip.settings.shared) === 'item') {
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
    const tooltipTicks = selectTooltipAxisTicks(state)
    if (!tooltipTicks?.length)
      return
    if (key === 'Enter') {
      const coordinate = selectCoordinateForDefaultIndex(state, String(keyboardInteraction.index))
      tooltip.setKeyboardInteraction({
        active: !keyboardInteraction.active,
        activeIndex: keyboardInteraction.index,
        activeDataKey: keyboardInteraction.dataKey,
        activeCoordinate: coordinate,
      })
      return
    }

    const direction = selectChartDirection(state)
    const directionMultiplier = direction === 'left-to-right' ? 1 : -1
    const movement = key === 'ArrowRight' ? 1 : -1
    const nextIndex = currentIndex + movement * directionMultiplier
    if (nextIndex >= tooltipTicks.length || nextIndex < 0) {
      return
    }
    const coordinate = selectCoordinateForDefaultIndex(state, String(nextIndex))

    tooltip.setKeyboardInteraction({
      active: true,
      activeIndex: nextIndex.toString(),
      activeDataKey: undefined,
      activeCoordinate: coordinate,
    })
  }

  function focus() {
    const state = chartState.value
    const accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    if (selectTooltipEventType(state, state.tooltip.settings.shared) === 'item')
      return
    const keyboardInteraction = { index: tooltip.target.value?.index ?? null, active: tooltip.source.active.value }
    if (keyboardInteraction.active) {
      return
    }
    if (keyboardInteraction.index == null) {
      const nextIndex = '0'
      const coordinate = selectCoordinateForDefaultIndex(state, String(nextIndex))
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
    const state = chartState.value
    const tooltipEventType = selectTooltipEventType(state, state.tooltip.settings.shared)
    if (tooltipEventType === 'axis') {
      const activeProps = selectActivePropsFromChartPointer(
        state,
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
      const coordinate = selectTooltipCoordinate(chartState.value, itemIndex, dataKey!)

      tooltip.setActiveMouseOverItemIndex({
        activeDataKey: dataKey!,
        activeIndex: itemIndex,
        activeCoordinate: coordinate,
      })
    }
  }

  return { click, move, keyDown, focus, touchMove }
}
