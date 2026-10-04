import { onUnmounted, watch } from 'vue'
import type { BrushProps } from '../type'
import { useChartBrush, useChartDataActions } from '@/state/chartContext'

/**
 * setting brush settings
 * @param props
 */
export function useBrushSetting(props: BrushProps) {
  const { setBrushSettings } = useChartBrush()
  const data = useChartDataActions()
  watch(() => ({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height!,
    padding: props.padding!,
  }), (settings) => {
    setBrushSettings(settings)
  }, { immediate: true })

  // SSR stops watches immediately; clear settings only on an actual unmount.
  onUnmounted(() => setBrushSettings(null))

  watch([() => props.startIndex, () => props.endIndex], ([startIndex, endIndex]) => {
    data.setRange({ startIndex, endIndex })
  }, { immediate: true })
}
