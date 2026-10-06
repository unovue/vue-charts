import { generateFunnelChart } from '@/chart/generateCategoricalChart'

export const FunnelChart = generateFunnelChart({
  chartName: 'FunnelChart',
  defaultTooltipEventType: 'item',
  validateTooltipEventTypes: ['item'],
})
