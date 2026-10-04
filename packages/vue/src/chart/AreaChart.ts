import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/state/chartOptions'

export const AreaChart = generateCategoricalChart({
  chartName: 'AreaChart',
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
