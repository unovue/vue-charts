import { useChart } from '@/model/chart'
import { computed } from 'vue'

/** Share the effective hide value between rendering and graphical-item registration. */
export function useLegendHiddenProps<T extends { hide?: boolean, dataKey?: unknown }>(props: T): T {
  const legend = useChart().legend
  const hide = computed(() => props.hide || (props.dataKey !== undefined && legend.state.value.hidden.has(String(props.dataKey))))
  return new Proxy(props, {
    get(target, key, receiver) {
      if (key === 'hide')
        return hide.value
      return Reflect.get(target, key, receiver)
    },
  })
}
