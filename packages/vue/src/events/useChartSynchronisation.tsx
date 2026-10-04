import { useAppSelector } from '@/state/hooks'
import { onMounted, watch } from 'vue'
import { selectEventEmitter, selectSyncId, selectSyncMethod } from '@/state/selectors/rootPropsSelectors'
import { useChartLayout, useViewBox } from '@/context/chartLayoutContext'
import { selectTooltipAxisTicks } from '@/state/selectors/tooltipSelectors'
import type { TooltipSyncMessage } from '@/utils/events'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { Coordinate, MouseHandlerDataParam, TickItem } from '@/types'
import { useChartDataActions, useChartOptions, useChartTooltip } from '@/state/chartContext'
import type { BrushStartEndIndex } from '@/state/chartData'

function useTooltipSyncEventsListener() {
  const mySyncId = useAppSelector(selectSyncId)
  const myEventEmitter = useAppSelector(selectEventEmitter)
  const tooltip = useChartTooltip()
  const syncMethod = useAppSelector(selectSyncMethod)
  const tooltipTicks = useAppSelector(selectTooltipAxisTicks)
  const layout = useChartLayout()
  const viewBox = useViewBox()


  // Subscribe only to what identifies the channel. The listener reads ticks, layout and viewBox
  // when a message arrives; watching them re-queued this job for every series registration and
  // tripped Vue's recursion guard in charts with many series.
  watch([myEventEmitter, mySyncId], (v, o, onCleanup) => {
    if (mySyncId.value == null) {
      // This chart is not synchronised with any other chart so we don't need to listen for any events.
      return
    }

    const listener = (incomingSyncId: number | string, message: TooltipSyncMessage, emitter: symbol) => {
      if (myEventEmitter.value === emitter) {
        // Ignore messages sent by this chart.
        return
      }
      if (mySyncId.value !== incomingSyncId) {
        // This event is not for this chart
        return
      }
      if (syncMethod.value === 'index') {
        const { kind: _kind, ...interaction } = message
        tooltip.setSyncInteraction(interaction)
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
          activeTooltipIndex: message.index == null ? undefined : Number(message.index),
          isTooltipActive: message.active,
          activeIndex: message.index == null ? undefined : Number(message.index),
          activeLabel: message.label,
          activeDataKey: message.dataKey,
          activeCoordinate: message.coordinate,
        }
        // Call a callback function. If there is an application specific algorithm
        const activeTooltipIndex = syncMethod.value(tooltipTicks.value, syncMethodParam)
        activeTick = tooltipTicks.value[activeTooltipIndex]
      }
      else if (syncMethod.value === 'value') {
        // labels are always strings, tick.value might be a string or a number, depending on axis type
        activeTick = tooltipTicks.value.find(tick => String(tick.value) === message.label)
      }

      if (activeTick == null || message.active === false) {
        tooltip.setSyncInteraction({
          active: false,
          coordinate: undefined,
          dataKey: undefined,
          index: null,
          label: undefined,
        })
        return
      }
      const { x, y } = message.coordinate!
      const validateChartX = Math.min(x!, viewBox.value?.x + viewBox.value?.width!)
      const validateChartY = Math.min(y!, viewBox.value?.y + viewBox.value?.height!)
      const activeCoordinate: Coordinate = {
        x: layout.value === 'horizontal' ? activeTick.coordinate : validateChartX,
        y: layout.value === 'horizontal' ? validateChartY : activeTick.coordinate,
      }

      tooltip.setSyncInteraction({
        active: message.active,
        coordinate: activeCoordinate,
        dataKey: message.dataKey,
        index: String(activeTick.index),
        label: message.label,
      })
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
  const data = useChartDataActions()
  watch([mySyncId, myEventEmitter], (v, o, onCleanup) => {
    if (mySyncId.value == null) {
      // This chart is not synchronised with any other chart so we don't need to listen for any events.
      return
    }

    const listener = (incomingSyncId: number | string, range: BrushStartEndIndex, emitter: symbol) => {
      if (myEventEmitter.value === emitter) {
        // Ignore messages sent by this chart.
        return
      }
      if (mySyncId.value === incomingSyncId) {
        data.setRange(range)
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
  const { createEventEmitter } = useChartOptions()

  onMounted(() => {
    createEventEmitter()
  })

  useTooltipSyncEventsListener()
  useBrushSyncEventsListener()
}
