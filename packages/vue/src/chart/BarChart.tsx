import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import { arrayTooltipSearcher } from '@/model/options'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const BarChart = generateCartesianChart({
  chartName: 'BarChart',
  defaultTooltipEventType: 'axis',
  tooltipPayloadSearcher: arrayTooltipSearcher,
  validateTooltipEventTypes: allowedTooltipTypes,
})
