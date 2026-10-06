import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'

export const AreaChart = generateCartesianChart({
  chartName: 'AreaChart',
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
