import type { PropType } from 'vue'
import { defineComponent, onUnmounted, watch } from 'vue'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useChartDataActions } from '@/state/chartContext'
import type { ChartData } from '@/state/chartData'

/**
 * ChartDataContextProvider for Vue
 * Sets chartData in store on mount/update, clears on unmount. Renders nothing.
 */
export const ChartDataContextProvider = defineComponent({
  name: 'ChartDataContextProvider',
  props: {
    chartData: {
      type: Array as PropType<ChartData>,
      required: true,
    },
  },
  setup(props) {
    const data = useChartDataActions()

    const trackedData = useTrackedData(() => props.chartData)
    watch(trackedData, (val) => {
      data.setData(val)
    }, { immediate: true })

    onUnmounted(() => {
      data.setData(undefined)
    })

    // Render nothing
    return () => null
  },
})
