import type { HTMLAttributes, VNodeProps } from 'vue'
import type { chartEmits } from '@/events/componentEvents'

export type DirectChartAttributes = HTMLAttributes & VNodeProps
type ChartPointerListeners = {
  [Event in keyof typeof chartEmits as `on${Capitalize<Event>}`]?:
  (...args: Parameters<typeof chartEmits[Event]>) => void
}

type ChartRootAttributes = Omit<DirectChartAttributes, keyof ChartPointerListeners> & ChartPointerListeners

/**
 * Public props of a standalone chart: the component's own props and emits (`$props`), the root
 * attributes, and the row-typed overrides in `Typed`.
 */
export type StandaloneChartProps<Props, Typed> = ChartRootAttributes & Omit<Props, keyof Typed> & Typed
