import { useChart } from '@/model/chart'
import type { AxisId } from '@/types/axis'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useNeedsClip(
  xAxisId: MaybeRefOrGetter<AxisId>,
  yAxisId: MaybeRefOrGetter<AxisId>,
) {
  const chart = useChart()
  const needClipX = computed(() => chart.axis('xAxis', toValue(xAxisId)).settings.value.allowDataOverflow)
  const needClipY = computed(() => chart.axis('yAxis', toValue(yAxisId)).settings.value.allowDataOverflow)
  const needClip = computed(() => needClipX.value || needClipY.value)
  return { needClip, needClipX, needClipY }
}
