import { computed } from 'vue'
import { useTooltipController } from '@/model/tooltip'
import { useChartPresentation } from '@/model/presentation'

export function useTooltipAxis() {
  const tooltip = useTooltipController()
  return computed(() => tooltip.axis.value?.settings.value)
}

export function useTooltipAxisBandSize() {
  return useChartPresentation().bandSize
}
