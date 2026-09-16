import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { mouseLeaveChart, setActiveMouseOverItemIndex, setKeyboardInteraction, setMouseClickAxisIndex, setMouseOverAxisIndex } from '@/state/tooltipSlice'
import { selectActivePropsFromChartPointer } from '@/state/selectors/selectActivePropsFromChartPointer'
import { selectTooltipEventType } from '@/state/selectors/selectTooltipEventType'
import { selectTooltipAxisTicks, selectTooltipDisplayedData } from '@/state/selectors/tooltipSelectors'
import { selectCoordinateForDefaultIndex } from '@/state/selectors/selectors'
import { selectChartDirection } from '@/state/selectors/axisSelectors'
import { combineActiveTooltipIndex } from '@/state/selectors/combiners/combineActiveTooltipIndex'
import { selectTooltipCoordinate } from '@/state/selectors/touchSelectors'
import { getChartPointer } from '@/utils/chart'
import { DATA_ITEM_DATAKEY_ATTRIBUTE_NAME, DATA_ITEM_INDEX_ATTRIBUTE_NAME } from '@/utils/const'
import type { ChartPointer } from '@/types'

export function useChartInteractions() {
  const chartState = useAppSelector(state => state)
  const dispatch = useAppDispatch()

  function click(chartPointer: ChartPointer) {
    const state = chartState.value
    const tooltipEventType = selectTooltipEventType(state, state.tooltip.settings.shared)
    if (tooltipEventType === 'axis') {
      const activeProps = selectActivePropsFromChartPointer(state, chartPointer)
      if (activeProps?.activeIndex != null) {
        dispatch(
          setMouseClickAxisIndex({
            activeIndex: activeProps.activeIndex,
            activeDataKey: undefined,
            activeCoordinate: activeProps.activeCoordinate,
          }),
        )
      }
    }
  }

  function move(chartPointer: ChartPointer) {
    const state = chartState.value
    const tooltipEventType = selectTooltipEventType(state, state.tooltip.settings.shared)
    const activeProps = selectActivePropsFromChartPointer(state, chartPointer)
    if (tooltipEventType === 'axis') {
      if (activeProps?.activeIndex != null) {
        dispatch(
          setMouseOverAxisIndex({
            activeIndex: activeProps.activeIndex,
            activeDataKey: undefined,
            activeCoordinate: activeProps.activeCoordinate,
          }),
        )
      }
      else {
        dispatch(mouseLeaveChart())
      }
    }
  }

  function keyDown(key: KeyboardEvent['key']) {
    const state = chartState.value
    const accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    const { keyboardInteraction } = state.tooltip
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter') {
      return
    }

    const currentIndex: number = Number(
      combineActiveTooltipIndex(keyboardInteraction, selectTooltipDisplayedData(state)),
    )
    const tooltipTicks = selectTooltipAxisTicks(state)
    if (key === 'Enter') {
      const coordinate = selectCoordinateForDefaultIndex(state, 'axis', 'hover', String(keyboardInteraction.index))
      dispatch(
        setKeyboardInteraction({
          active: !keyboardInteraction.active,
          activeIndex: keyboardInteraction.index,
          activeDataKey: keyboardInteraction.dataKey,
          activeCoordinate: coordinate,
        }),
      )
      return
    }

    const direction = selectChartDirection(state)
    const directionMultiplier = direction === 'left-to-right' ? 1 : -1
    const movement = key === 'ArrowRight' ? 1 : -1
    const nextIndex = currentIndex + movement * directionMultiplier
    if (nextIndex >= tooltipTicks.length || nextIndex < 0) {
      return
    }
    const coordinate = selectCoordinateForDefaultIndex(state, 'axis', 'hover', String(nextIndex))

    dispatch(
      setKeyboardInteraction({
        active: true,
        activeIndex: nextIndex.toString(),
        activeDataKey: undefined,
        activeCoordinate: coordinate,
      }),
    )
  }

  function focus() {
    const state = chartState.value
    const accessibilityLayerIsActive = state.rootProps.accessibilityLayer !== false
    if (!accessibilityLayerIsActive) {
      return
    }
    const { keyboardInteraction } = state.tooltip
    if (keyboardInteraction.active) {
      return
    }
    if (keyboardInteraction.index == null) {
      const nextIndex = '0'
      const coordinate = selectCoordinateForDefaultIndex(state, 'axis', 'hover', String(nextIndex))
      dispatch(
        setKeyboardInteraction({
          activeDataKey: undefined,
          active: true,
          activeIndex: nextIndex,
          activeCoordinate: coordinate,
        }),
      )
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
        dispatch(
          setMouseOverAxisIndex({
            activeIndex: activeProps.activeIndex,
            activeDataKey: undefined,
            activeCoordinate: activeProps.activeCoordinate,
          }),
        )
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

      dispatch(
        setActiveMouseOverItemIndex({
          activeDataKey: dataKey!,
          activeIndex: itemIndex,
          activeCoordinate: coordinate,
        }),
      )
    }
  }

  return { click, move, keyDown, focus, touchMove }
}
