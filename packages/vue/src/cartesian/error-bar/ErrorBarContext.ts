import type { Ref, ShallowRef } from 'vue'
import { shallowRef } from 'vue'
import { createContext } from 'motion-v'
import { createContext as createNullableContext } from '@/utils/createContext'
import type { ErrorBarDirection } from '@/types/bar'
import type { DataKey } from '@/types'
import type { AxisId } from '@/state/chartCartesianAxis'
import type { ErrorBarsSettings } from '@/state/chartGraphicalItems'

export interface ErrorBarDataItem {
  x: number | null | undefined
  y: number | null | undefined
  value: number
  errorVal?: number[] | number
}

export type ErrorBarDataPointFormatter<T> = (
  entry: T,
  dataKey: DataKey<any>,
  direction: ErrorBarDirection,
) => ErrorBarDataItem

export interface ErrorBarContextType {
  data: Readonly<ShallowRef<readonly any[] | undefined>>
  xAxisId: AxisId
  yAxisId: AxisId
  dataPointFormatter: ErrorBarDataPointFormatter<any>
  errorBarOffset: Ref<number>
}

export const [useErrorBarContext, provideErrorBarContext] = createContext<ErrorBarContextType>('ErrorBarContext')

export interface ErrorBarRegistryType {
  errorBars: ShallowRef<ReadonlyArray<ErrorBarsSettings>>
  register: (settings: ErrorBarsSettings) => void
  unregister: (settings: ErrorBarsSettings) => void
}

export const [useErrorBarRegistry, provideErrorBarRegistry] = createNullableContext<ErrorBarRegistryType>('ErrorBarRegistry')

export function createErrorBarRegistry(): ErrorBarRegistryType {
  const errorBars = shallowRef<ReadonlyArray<ErrorBarsSettings>>([])
  return {
    errorBars,
    register(settings) {
      errorBars.value = [...errorBars.value, settings]
    },
    unregister(settings) {
      errorBars.value = errorBars.value.filter(s => s !== settings)
    },
  }
}
