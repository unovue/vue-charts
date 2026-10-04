import { useChartTooltip } from '@/state/chartContext'
import type { TooltipPayloadConfiguration } from './chartTooltip'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import type { Ref } from 'vue'
import { computed, watch } from 'vue'

type SetTooltipEntrySettingsProps<T> = {
  args: Ref<T>
  fn: (input: T) => TooltipPayloadConfiguration
}

export function SetTooltipEntrySettings<T>({ fn, args }: SetTooltipEntrySettingsProps<T>) {
  const tooltip = useChartTooltip()
  const isPanorama = useIsPanorama()
  watch(computed(() => isPanorama ? undefined : fn(args.value)), (tooltipEntrySettings, _previous, onCleanup) => {
    if (!tooltipEntrySettings) {
      return
    }
    tooltip.addTooltipEntrySettings(tooltipEntrySettings)
    onCleanup(() => {
      tooltip.removeTooltipEntrySettings(tooltipEntrySettings)
    })
  }, { immediate: true })
}
