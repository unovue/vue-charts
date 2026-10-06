import type { LegendPayload } from '@/components/DefaultLegendContent'
import type { MaybeRef } from 'vue'
import { onUnmounted, unref, watch } from 'vue'
import { useChartLegend } from '@/state/chartContext'

export function SetLegendPayload(_legendPayload: MaybeRef<ReadonlyArray<LegendPayload>>): null {
  const { addLegendPayload, removeLegendPayload } = useChartLegend()

  let registeredPayload: ReadonlyArray<LegendPayload> | undefined
  // Track the payload input, not the chart state read by registration operations.
  watch(() => unref(_legendPayload), (legendPayload) => {
    if (registeredPayload)
      removeLegendPayload(registeredPayload)
    addLegendPayload(legendPayload)
    registeredPayload = legendPayload
  }, { immediate: true })
  // SSR stops watches immediately; retain the payload until the component unmounts.
  onUnmounted(() => {
    if (registeredPayload)
      removeLegendPayload(registeredPayload)
  })
  return null
}
