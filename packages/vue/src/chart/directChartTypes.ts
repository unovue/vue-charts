import type { HTMLAttributes, VNodeProps } from 'vue'
import type { chartEmits } from '@/events/componentEvents'

export type DirectChartAttributes = HTMLAttributes & VNodeProps
type ChartPointerListeners = {
  [Event in keyof typeof chartEmits as `on${Capitalize<Event>}`]?:
  (...args: Parameters<typeof chartEmits[Event]>) => void
}

export type ChartRootAttributes = Omit<DirectChartAttributes, keyof ChartPointerListeners> & ChartPointerListeners
