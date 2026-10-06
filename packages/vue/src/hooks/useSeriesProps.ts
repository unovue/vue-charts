import { computed } from 'vue'
import type { ChartAnimation } from '@/model/animation'
import { useChartAnimation } from '@/model/animation'
import { useChart } from '@/model/chart'

/** Share effective settings between series rendering and registration. */
export function useSeriesProps<T extends ChartAnimation & { hide?: boolean, dataKey?: unknown }>(props: T): T {
  const legend = useChart().legend
  const animation = useChartAnimation()
  const hide = computed(() => props.hide || (props.dataKey !== undefined && legend.state.value.hidden.has(String(props.dataKey))))
  return new Proxy(props, {
    get(target, key, receiver) {
      if (key === 'hide')
        return hide.value
      if (key === 'isAnimationActive')
        return props.isAnimationActive ?? animation.isAnimationActive ?? true
      if (key === 'transition')
        return props.transition ?? animation.transition
      return Reflect.get(target, key, receiver)
    },
  })
}
