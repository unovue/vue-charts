import { generateCartesianChart } from '@/chart/generateCategoricalChart'
import type { TooltipEventType } from '@/types'

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ['axis']

export const ComposedChart = generateCartesianChart({
  chartName: 'ComposedChart',
  defaultTooltipEventType: 'axis',
  validateTooltipEventTypes: allowedTooltipTypes,
})
