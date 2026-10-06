import { computed } from 'vue'
import { useChart } from '@/model/chart'
import { computeScatterPoints } from '@/core/scatter'
import type { ResolvedScatterSettings } from '@/core/scatter'
import type { DataKey, TooltipType } from '@/types'

export interface ScatterProps {
  xAxisId?: string | number
  yAxisId?: string | number
  zAxisId?: string | number
  dataKey?: DataKey<any>
  data?: ReadonlyArray<unknown>
  name?: string | number
  hide?: boolean
  fill?: string
  stroke?: string
  isAnimationActive?: boolean
  tooltipType?: TooltipType
}

export function useScatter(props: ScatterProps) {
  const chart = useChart()
  const scatterSettings = computed<ResolvedScatterSettings>(() => ({
    data: props.data,
    dataKey: props.dataKey,
    tooltipType: props.tooltipType,
    name: props.name ?? String(props.dataKey ?? ''),
  }))

  const xAxis = computed(() => chart.axis('xAxis', props.xAxisId ?? 0))
  const yAxis = computed(() => chart.axis('yAxis', props.yAxisId ?? 0))
  const zAxis = computed(() => chart.axis('zAxis', props.zAxisId ?? 0))
  const points = computed(() => {
    const x = xAxis.value.withScale.value
    const y = yAxis.value.withScale.value
    const xTicks = xAxis.value.graphicalTicks.value
    const yTicks = yAxis.value.graphicalTicks.value
    const { chartData, dataStartIndex, dataEndIndex } = chart.dataRange.state.value
    const displayedData = props.data?.length ? props.data : chartData?.slice(dataStartIndex, dataEndIndex + 1)
    if (!x || !y || !xTicks?.length || !yTicks?.length || !displayedData)
      return undefined
    return computeScatterPoints({
      displayedData,
      xAxis: x,
      yAxis: y,
      zAxis: zAxis.value.withScale.value,
      scatterSettings: scatterSettings.value,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
    })
  })

  const shouldRender = computed(() => {
    return !props.hide && points.value != null && points.value.length > 0
  })

  return {
    shouldRender,
    points,
  }
}
