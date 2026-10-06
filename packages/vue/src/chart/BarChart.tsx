import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis', 'item']

export const BarChart = generateCartesianChart({
  chartName: 'BarChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: allowedTooltipTypes,
})
