import { computed, watch } from 'vue'
import { useChart } from '@/model/chart'
import type { BrushProps } from '../type'

export function useBrushSetting(props: BrushProps) {
  const chart = useChart()
  const data = chart.dataRange
  chart.brush.register(computed(() => ({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height!,
    padding: props.padding!,
  })))

  watch([() => props.startIndex, () => props.endIndex, () => data.state.value.chartData], ([startIndex, endIndex]) => {
    data.setRange({ startIndex, endIndex })
  }, { immediate: true })
}
