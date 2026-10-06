import { computed } from 'vue'
import { useChart } from '@/model/chart'
import type { BrushProps, BrushStartEndIndex } from '../type'

export function useBrushSetting(props: BrushProps, onRangeChange: (range: BrushStartEndIndex) => void) {
  const chart = useChart()
  chart.brush.register(computed(() => ({
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height!,
    padding: props.padding!,
    onRangeChange,
  })))
}
