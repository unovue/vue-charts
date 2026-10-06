import { computed } from 'vue'
import { useTooltipController } from '@/model/tooltip'
import type { CategoricalChartFunc, MouseHandlerDataParam } from '@/types'

export function useChartCallbacks() {
  const tooltip = useTooltipController()
  const source = tooltip.source
  const callbackState = computed((): MouseHandlerDataParam => ({
    activeCoordinate: source.coordinate.value,
    activeDataKey: tooltip.target.value?.entry?.value?.settings.dataKey,
    activeIndex: source.active.value ? tooltip.target.value?.index ?? null : null,
    activeLabel: source.label.value,
    activeTooltipIndex: source.active.value ? tooltip.target.value?.index ?? null : null,
    isTooltipActive: source.active.value,
  }))

  return (handler: CategoricalChartFunc | undefined, event: MouseEvent | TouchEvent) => {
    if (handler) {
      handler({ ...callbackState.value }, event)
    }
  }
}
