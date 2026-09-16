import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { onMounted, onUnmounted, watch } from 'vue'
import { selectEventEmitter, selectSyncId, selectSyncMethod } from '@/state/selectors/rootPropsSelectors'
import { useChartLayout, useViewBox } from '@/context/chartLayoutContext'
import { selectTooltipAxisTicks } from '@/state/selectors/tooltipSelectors'
import { type TooltipSyncState, setSyncInteraction } from '@/state/tooltipSlice'
import type { PayloadAction } from '@reduxjs/toolkit'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { Coordinate, MouseHandlerDataParam, TickItem } from '@/types'
import { createEventEmitter } from '@/state/optionsSlice'
import type { BrushStartEndIndex } from '@/state/chartDataSlice'
import { setDataStartEndIndexes } from '@/state/chartDataSlice'

function useTooltipSyncEventsListener() {
  const mySyncId = useAppSelector(selectSyncId)
  const myEventEmitter = useAppSelector(selectEventEmitter)
  const dispatch = useAppDispatch()
  const syncMethod = useAppSelector(selectSyncMethod)
  const tooltipTicks = useAppSelector(selectTooltipAxisTicks)
  const layout = useChartLayout()
  const viewBox = useViewBox()

  const className = useAppSelector(state => state.rootProps.class)

  watch([className, myEventEmitter, mySyncId, syncMethod, tooltipTicks, layout, viewBox], (v, o, onCleanup) => {
    if (mySyncId.value == null) {
      // This chart is not synchronised with any other chart so we don't need to listen for any events.
      return
    }

    const listener = (incomingSyncId: number | string, action: PayloadAction<TooltipSyncState>, emitter: symbol) => {
      if (myEventEmitter.value === emitter) {
        // We don't want to dispatch actions that we sent ourselves.
        return
      }
      if (mySyncId.value !== incomingSyncId) {
        // This event is not for this chart
        return
      }
      if (syncMethod.value === 'index') {
        dispatch(action)
        // This is the default behaviour, we don't need to do anything else.
        return
      }

      if (tooltipTicks.value == null) {
        // for the other two sync methods, we need the ticks to be available
        return
      }

      let activeTick: TickItem | undefined
      if (typeof syncMethod.value === 'function') {
        /*
         * This is what the data shape in 2.x CategoricalChartState used to look like.
         * In 3.x we store things differently but let's try to keep the old shape for compatibility.
         */
        const syncMethodParam: MouseHandlerDataParam = {
          activeTooltipIndex: action.payload.index == null ? undefined : Number(action.payload.index),
          isTooltipActive: action.payload.active,
          activeIndex: action.payload.index == null ? undefined : Number(action.payload.index),
          activeLabel: action.payload.label,
          activeDataKey: action.payload.dataKey,
          activeCoordinate: action.payload.coordinate,
        }
        // Call a callback function. If there is an application specific algorithm
        const activeTooltipIndex = syncMethod.value(tooltipTicks.value, syncMethodParam)
        activeTick = tooltipTicks.value[activeTooltipIndex]
      }
      else if (syncMethod.value === 'value') {
        // labels are always strings, tick.value might be a string or a number, depending on axis type
        activeTick = tooltipTicks.value.find(tick => String(tick.value) === action.payload.label)
      }

      if (activeTick == null || action.payload.active === false) {
        dispatch(
          setSyncInteraction({
            active: false,
            coordinate: undefined,
            dataKey: undefined,
            index: null,
            label: undefined,
          }),
        )
        return
      }
      const { x, y } = action.payload.coordinate!
      const validateChartX = Math.min(x!, viewBox.value?.x + viewBox.value?.width!)
      const validateChartY = Math.min(y!, viewBox.value?.y + viewBox.value?.height!)
      const activeCoordinate: Coordinate = {
        x: layout.value === 'horizontal' ? activeTick.coordinate : validateChartX,
        y: layout.value === 'horizontal' ? validateChartY : activeTick.coordinate,
      }

      const syncAction = setSyncInteraction({
        active: action.payload.active,
        coordinate: activeCoordinate,
        dataKey: action.payload.dataKey,
        index: String(activeTick.index),
        label: action.payload.label,
      })
      dispatch(syncAction)
    }
    eventCenter.on(TOOLTIP_SYNC_EVENT, listener)
    onCleanup(() => {
      eventCenter.off(TOOLTIP_SYNC_EVENT, listener)
    })
  })
}

function useBrushSyncEventsListener() {
  const mySyncId = useAppSelector(selectSyncId)
  const myEventEmitter = useAppSelector(selectEventEmitter)
  const dispatch = useAppDispatch()
  watch([mySyncId, myEventEmitter], (v, o, onCleanup) => {
    if (mySyncId.value == null) {
      // This chart is not synchronised with any other chart so we don't need to listen for any events.
      return
    }

    const listener = (incomingSyncId: number | string, action: BrushStartEndIndex, emitter: symbol) => {
      if (myEventEmitter.value === emitter) {
        // We don't want to dispatch actions that we sent ourselves.
        return
      }
      if (mySyncId.value === incomingSyncId) {
        dispatch(setDataStartEndIndexes(action))
      }
    }

    eventCenter.on(BRUSH_SYNC_EVENT, listener)

    onCleanup(() => {
      eventCenter.off(BRUSH_SYNC_EVENT, listener)
    })
  })
}

/**
 * Will receive synchronisation events from other charts.
 *
 * Reads syncMethod from state and decides how to synchronise the tooltip based on that.
 *
 * @returns void
 */
export function useSynchronisedEventsFromOtherCharts() {
  const dispatch = useAppDispatch()

  onMounted(() => {
    dispatch(createEventEmitter())
  })

  useTooltipSyncEventsListener()
  useBrushSyncEventsListener()
}
