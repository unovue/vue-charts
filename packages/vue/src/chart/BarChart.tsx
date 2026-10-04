import { generateCategoricalChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/state/chartOptions'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const BarChart = generateCategoricalChart({
  chartName: 'BarChart',
  defaultTooltipEventType: 'axis',
  tooltipPayloadSearcher: arrayTooltipSearcher,
  validateTooltipEventTypes: allowedTooltipTypes,
})
