import type { PropType } from 'vue'
import { defineComponent, onUnmounted, watch } from 'vue'
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

    watch(() => props.chartData, (val) => {
      data.setData(Array.from(val))
    }, { immediate: true })

    onUnmounted(() => {
      data.setData(undefined)
    })

    // Render nothing
    return () => null
  },
})
