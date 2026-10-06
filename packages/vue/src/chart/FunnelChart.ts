import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'

export const FunnelChart = generateCategoricalChart({
  chartName: 'FunnelChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
