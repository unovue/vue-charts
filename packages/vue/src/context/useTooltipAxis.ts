import { useAppSelector } from '@/state/hooks'
import { selectTooltipAxis, selectTooltipAxisScale, selectTooltipAxisTicks } from '@/state/chartContext'
import { getBandSizeOfAxis } from '@/utils/chart'
import { computed } from 'vue'

export const useTooltipAxis = () => useAppSelector(selectTooltipAxis)

export function useTooltipAxisBandSize() {
  const tooltipAxis = useTooltipAxis()
  const tooltipTicks = useAppSelector(selectTooltipAxisTicks)
  const tooltipAxisScale = useAppSelector(selectTooltipAxisScale)
  return computed(() => getBandSizeOfAxis({ ...tooltipAxis.value, scale: tooltipAxisScale.value! }, tooltipTicks.value ?? undefined))
}
