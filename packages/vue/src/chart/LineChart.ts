import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const LineChart = generateCartesianChart({
  chartName: 'LineChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: allowedTooltipTypes,
})
