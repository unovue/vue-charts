import { computed } from 'vue'
import { useTooltipController } from '@/model/tooltip'
import type { CategoricalChartFunc, MouseHandlerDataParam } from '@/types'

export function useChartCallbacks() {
  const tooltip = useTooltipController()
  const source = tooltip.source
  const callbackState = computed((): MouseHandlerDataParam => {
    const target = source.active.value ? tooltip.target.value : undefined
    const activeIndex = target ? target.payloadKey ?? String(target.index) : null
    return {
      activeCoordinate: source.coordinate.value,
      activeDataKey: tooltip.target.value?.entry?.value?.settings.dataKey,
      activeIndex,
      activeLabel: source.label.value,
      activeTooltipIndex: activeIndex,
      isTooltipActive: source.active.value,
    }
  })

  return (handler: CategoricalChartFunc | undefined, event: MouseEvent | TouchEvent) => {
    if (handler) {
      handler({ ...callbackState.value }, event)
    }
  }
}
