import { useChart } from '@/model/chart'
import { defineComponent } from 'vue'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { useChartInteractions } from '@/events/useChartInteractions'
import { useSynchronisedEventsFromOtherCharts } from '@/events/sync'
import { ChartWrapper, chartWrapperProps } from './ChartWrapper'

export const ChartsWrapper = defineComponent({
  name: 'ChartsWrapper',
  props: chartWrapperProps,
  inheritAttrs: false,
  emits: { ...chartEmits, resize: (_width: number, _height: number) => true },
  setup(props, { attrs, slots, emit }) {
    const interactions = useChartInteractions()
    useSynchronisedEventsFromOtherCharts(useChart())
    return () => (
      <ChartWrapper
        {...attrs}
        {...props}
        {...chartListeners(emit)}
        interactions={interactions}
        onResize={(width, height) => emit('resize', width, height)}
      >
        {slots}
      </ChartWrapper>
    )
  },
})
