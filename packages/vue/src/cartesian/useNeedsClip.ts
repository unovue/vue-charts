import { useAppSelector } from '@/state/hooks'
import { selectXAxisSettings, selectYAxisSettings } from '@/state/chartContext'
import type { AxisId } from '@/types/axis'
import { computed } from 'vue'

export function useNeedsClip(xAxisId: AxisId, yAxisId: AxisId) {
  const xAxis = useAppSelector(state => selectXAxisSettings(state, xAxisId))
  const yAxis = useAppSelector(state => selectYAxisSettings(state, yAxisId))

  const needClipX = computed(() => {
    return xAxis.value && xAxis.value.allowDataOverflow
  })
  const needClipY = computed(() => {
    return yAxis.value && yAxis.value.allowDataOverflow
  })

  const needClip = computed(() => {
    return needClipX.value || needClipY.value
  })

  return { needClip, needClipX, needClipY }
}
