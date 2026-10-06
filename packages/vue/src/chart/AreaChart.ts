import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'

export const AreaChart = generateCategoricalChart({
  chartName: 'AreaChart',
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
