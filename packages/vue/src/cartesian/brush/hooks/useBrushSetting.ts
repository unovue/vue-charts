import { computed } from 'vue'
import { useChart } from '@/model/chart'
import type { BrushInput, BrushStartEndIndex } from '../type'

export function useBrushSetting(props: BrushInput, onRangeChange: (range: BrushStartEndIndex) => void) {
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
