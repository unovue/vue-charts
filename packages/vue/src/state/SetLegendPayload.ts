import type { LegendPayload } from '@/components/DefaultLegendContent'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import type { MaybeRef } from 'vue'
import { unref, watch } from 'vue'
import { useChartLegend } from '@/state/chartContext'

export function SetLegendPayload(_legendPayload: MaybeRef<ReadonlyArray<LegendPayload>>): null {
  const { addLegendPayload, removeLegendPayload } = useChartLegend()
  const isPanorama = useIsPanorama()
  // Track the payload input, not the chart state read by registration operations.
  watch(() => unref(_legendPayload), (legendPayload, _, onCleanup) => {
    if (isPanorama) {
      return
    }
    addLegendPayload(legendPayload)
    onCleanup(() => {
      removeLegendPayload(legendPayload)
    })
  }, { immediate: true })
  return null
}
