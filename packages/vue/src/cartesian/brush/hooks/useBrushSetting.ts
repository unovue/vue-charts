import { watch, watchEffect } from 'vue'
import type { BrushProps } from '../type'
import { useAppDispatch } from '@/state/hooks'
import { setBrushSettings } from '@/state/brushSlice'
import { useChartDataActions } from '@/state/chartContext'

/**
 * setting brush settings
 * @param props
 */
export function useBrushSetting(props: BrushProps) {
  const dispatch = useAppDispatch()
  const data = useChartDataActions()
  watchEffect((onCleanup) => {
    dispatch(setBrushSettings({
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height!,
      padding: props.padding!,
    }))
    onCleanup(() => {
      dispatch(setBrushSettings(null))
    })
  })

  watch([() => props.startIndex, () => props.endIndex], ([startIndex, endIndex]) => {
    data.setRange({ startIndex, endIndex })
  }, { immediate: true })
}
