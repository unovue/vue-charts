import { computed } from 'vue'
import type { ChartAnimation } from '@/model/animation'
import { useChartAnimation } from '@/model/animation'
import { useChart } from '@/model/chart'
import { seriesColor } from '@/utils/theme'

const seriesIds = new WeakMap<object, symbol>()

export function getSeriesId(props: object): symbol | undefined {
  return seriesIds.get(props)
}

/** Share effective settings between series rendering and registration. */
export function useSeriesProps<T extends ChartAnimation & { hide?: boolean, dataKey?: unknown }>(props: T, colors: readonly ('fill' | 'stroke')[] = []): T {
  const chart = useChart()
  const legend = chart.legend
  const id = Symbol('series-color')
  const color = computed(() => {
    const items = chart.items.cartesian.entries.value.length
      ? chart.items.cartesian.entries.value
      : chart.items.polar.entries.value.filter(item => item.type === 'radar')
    return seriesColor(items.findIndex(item => item.seriesId === id))
  })
  const animation = useChartAnimation()
  const hide = computed(() => props.hide || (props.dataKey !== undefined && legend.state.value.hidden.has(String(props.dataKey))))
  const resolved = new Proxy(props, {
    get(target, key, receiver) {
      if ((key === 'fill' || key === 'stroke') && colors.includes(key))
        return Reflect.get(target, key, receiver) ?? color.value
      if (key === 'hide')
        return hide.value
      if (key === 'isAnimationActive')
        return props.isAnimationActive ?? animation.isAnimationActive ?? true
      if (key === 'transition')
        return props.transition ?? animation.transition
      return Reflect.get(target, key, receiver)
    },
  })
  if (colors.length)
    seriesIds.set(resolved, id)
  return resolved
}
