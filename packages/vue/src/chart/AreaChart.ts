import { defineComponent } from 'vue'
import { chartRoot } from '@/chart/generateCategoricalChart'
import { cartesianChartProps } from '@/chart/chartProps'

export const AreaChart = defineComponent({
  ...chartRoot({
    chartName: 'AreaChart',
  }),
  props: cartesianChartProps,
})
