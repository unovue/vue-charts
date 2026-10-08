import type { ChartDataKey } from '@/types/base'
import { inject, provide, shallowRef } from 'vue'
import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { ErrorBarDirection } from '@/types/bar'
import type { AxisId } from '@/types/axisSettings'
import type { ErrorBarsSettings } from '@/types/graphical'

import type { ErrorBarDataItem } from '@/core/errorBar'

export type ErrorBarDataPointFormatter<T> = (
  entry: T,
  dataKey: ChartDataKey,
  direction: ErrorBarDirection,
) => ErrorBarDataItem

export interface ErrorBarContextType {
  data: Readonly<ShallowRef<readonly unknown[] | undefined>>
  xAxisId: AxisId
  yAxisId: AxisId
  // This injection boundary accepts geometry from several independent series shapes.
  dataPointFormatter: ErrorBarDataPointFormatter<unknown>
  errorBarOffset: Ref<number>
}

const errorBarKey: InjectionKey<ErrorBarContextType> = Symbol('v-charts-error-bar-context')

export function provideErrorBarContext(value: ErrorBarContextType) {
  provide(errorBarKey, value)
  return value
}

export function useErrorBarContext<T extends ErrorBarContextType | null | undefined = ErrorBarContextType>(
  fallback?: T,
): T extends null ? ErrorBarContextType | null : ErrorBarContextType
export function useErrorBarContext(fallback?: ErrorBarContextType | null) {
  const value = inject(errorBarKey, fallback)
  if (value === undefined)
    throw new Error('vccs: useErrorBarContext requires its provider.')
  return value
}

export interface ErrorBarRegistryType {
  errorBars: ShallowRef<ReadonlyArray<ErrorBarsSettings>>
  register: (settings: ErrorBarsSettings) => void
  unregister: (settings: ErrorBarsSettings) => void
}

const registryKey: InjectionKey<ErrorBarRegistryType> = Symbol('v-charts-error-bar-registry')

export function provideErrorBarRegistry(value: ErrorBarRegistryType) {
  provide(registryKey, value)
  return value
}

export function useErrorBarRegistry<T extends ErrorBarRegistryType | null | undefined = ErrorBarRegistryType>(
  fallback?: T,
): T extends null ? ErrorBarRegistryType | null : ErrorBarRegistryType
export function useErrorBarRegistry(fallback?: ErrorBarRegistryType | null) {
  const value = inject(registryKey, fallback)
  if (value === undefined)
    throw new Error('vccs: ErrorBar requires its series registry.')
  return value
}

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
