import type { TooltipSource } from '@/model/tooltip'
import { useTooltipController } from '@/model/tooltip'
import { useChartPresentation } from '@/model/presentation'
import { computed, onMounted, watch, watchEffect } from 'vue'
import type { TooltipSyncMessage } from '@/utils/events'
import { BRUSH_SYNC_EVENT, TOOLTIP_SYNC_EVENT, eventCenter } from '@/utils/events'
import type { Chart } from '@/model/chart'
import { parseTooltipIndex } from '@/core/tooltip'
import type { Coordinate, MouseHandlerDataParam, TickItem } from '@/types'
import type { BrushStartEndIndex } from '@/types/chartData'

export function useTooltipChartSynchronisation(source: TooltipSource, enabled: () => boolean) {
  const tooltip = useTooltipController()
  const presentation = useChartPresentation()
  const activeDataKey = computed(() => tooltip.target.value?.entry?.value?.settings.dataKey)
  const eventEmitterSymbol = presentation.emitter
  const syncId = presentation.syncId
  const tooltipState = computed(() => tooltip.syncInteraction.value)
  const isReceivingSynchronisation = computed(() => tooltipState.value?.active)

  watchEffect(() => {
    if (!enabled())
      return
    if (isReceivingSynchronisation.value)
    /*
       * This chart currently has active tooltip, synchronised from another chart.
       * Let's not send any outgoing synchronisation events while that's happening
       * to avoid infinite loops.
       */
      return
    if (syncId.value == null)
      return
    if (eventEmitterSymbol.value == null)
      return

    const message: TooltipSyncMessage = {
      kind: 'tooltip',
      active: source.active.value,
      coordinate: source.coordinate.value,
      dataKey: activeDataKey.value,
      index: source.index.value === null ? null : String(source.index.value),
      label: source.label.value,
    }
    eventCenter.emit(TOOLTIP_SYNC_EVENT, syncId.value, message, eventEmitterSymbol.value)
  })
}

function useTooltipSyncEventsListener(chart: Chart) {
  const mySyncId = computed(() => chart.options.value.syncId)
  const myEventEmitter = computed(() => chart.tooltipOptions.value.eventEmitter)
  const tooltip = chart.tooltip
  const syncMethod = computed(() => chart.options.value.syncMethod)
  const tooltipTicks = computed(() => chart.tooltip.ticks.value)
  const layout = computed(chart.inputs.layout)
  const viewBox = chart.viewBox

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
          activeTooltipIndex: parseTooltipIndex(message.index) ?? undefined,
          isTooltipActive: message.active,
          activeIndex: parseTooltipIndex(message.index) ?? undefined,
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
  }, { immediate: true })
}

function useBrushSyncEventsListener(chart: Chart) {
  const mySyncId = computed(() => chart.options.value.syncId)
  const myEventEmitter = computed(() => chart.tooltipOptions.value.eventEmitter)
  const data = chart.dataRange
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
  }, { immediate: true })
}

/** Receive requests through the chart's configured synchronisation method. */
export function useSynchronisedEventsFromOtherCharts(chart: Chart) {
  onMounted(() => {
    useTooltipSyncEventsListener(chart)
    useBrushSyncEventsListener(chart)
  })
}

export function useBrushChartSynchronisation(chart: Chart) {
  const syncId = computed(() => chart.options.value.syncId)
  const eventEmitterSymbol = computed(() => chart.tooltipOptions.value.eventEmitter)
  const brushStartIndex = computed(() => chart.dataRange.state.value.dataStartIndex)
  const brushEndIndex = computed(() => chart.dataRange.state.value.dataEndIndex)

  watchEffect(() => {
    if (syncId.value == null || brushStartIndex.value == null || brushEndIndex.value == null || eventEmitterSymbol.value == null) {
      return
    }
    const range: BrushStartEndIndex = { startIndex: brushStartIndex.value, endIndex: brushEndIndex.value }
    eventCenter.emit(BRUSH_SYNC_EVENT, syncId.value, range, eventEmitterSymbol.value)
  })
}
