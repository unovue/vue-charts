import { defineComponent } from 'vue'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { useChartInteractions } from '@/events/useChartInteractions'
import { useSynchronisedEventsFromOtherCharts } from '@/events/useChartSynchronisation'
import { useReportScale } from '@/hooks/useReportScale'
import { ChartWrapper, chartWrapperProps } from './ChartWrapper'

export const ChartsWrapper = defineComponent({
  name: 'ChartsWrapper',
  props: chartWrapperProps,
  inheritAttrs: false,
  emits: { ...chartEmits, resize: (_width: number, _height: number) => true },
  setup(props, { attrs, slots, emit }) {
    const interactions = useChartInteractions()
    useSynchronisedEventsFromOtherCharts()
    const scale = useReportScale()
    return () => (
      <ChartWrapper
        {...attrs}
        {...props}
        {...chartListeners(emit)}
        interactions={interactions}
        onWrapper={(node) => { scale.value = node }}
        onResize={(width, height) => emit('resize', width, height)}
      >
        {slots}
      </ChartWrapper>
    )
  },
})
