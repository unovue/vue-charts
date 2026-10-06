import { generateFunnelChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'

export const FunnelChart = generateFunnelChart({
  chartName: 'FunnelChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
  tooltipPayloadSearcher: arrayTooltipSearcher,
})
