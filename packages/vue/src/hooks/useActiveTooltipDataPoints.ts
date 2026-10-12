import { computed } from 'vue'
import { useTooltipSource } from '@/model/tooltip'

/** Currently displayed data points, deduplicated across series. Requires a tooltip source. */
export function useActiveTooltipDataPoints() {
  const source = useTooltipSource()
  return computed(() => Array.from(new Set(source.payload.value.map(entry => entry.payload).filter(entry => entry != null))))
}
