import { useChartId } from '@/hooks/useChartId'
import type { Ref, SVGAttributes, ShallowRef } from 'vue'
import { computed, ref, shallowRef } from 'vue'
import { createContext } from 'motion-v'
import type { ResolvedBarProps } from '../type'
import { getNormalizedStackId } from '@/utils/chart'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useChart } from '@/model/chart'
import { computeBarRectangles } from '@/core/bar'
import { combineAllBarPositions, combineBarSizeList, combineStackedData } from '@/core/barSizing'
import type { BarRectangleItem } from '@/types/bar'

export interface BarContext {
  // 基础计算属性
  clipPathId: string
  layout: Ref<'horizontal' | 'vertical' | 'centric' | 'radial'>
  props: ResolvedBarProps
  attrs: SVGAttributes
  data: Readonly<ShallowRef<readonly BarRectangleItem[] | undefined>>
  isAnimating: Ref<boolean>
  shapeSlot?: (props: any) => any
  activeBarSlot?: (props: any) => any
  cellProps: ShallowRef<Record<string, any>[]>
  /** Where the bars sit in their category band, so bars can enter and leave between categories. */
  band: Readonly<Ref<{ offset: number, size: number } | undefined>>
  /** The bars as drawn on this frame, so labels can ride along with them. */
  drawn: ShallowRef<readonly DrawnBar[]>
}

export interface DrawnBar {
  bar: BarRectangleItem
  /** Identity across data changes (the category). */
  key?: PropertyKey
  /** Position in the data. */
  index: number
  /** Below 1 while the bar fades in or out. */
  opacity?: number
}
export const [useBarContext, provideBarContext] = createContext<BarContext>('BarContext')

export function useBar(props: ResolvedBarProps, attrs: SVGAttributes, shapeSlot?: (props: any) => any, activeBarSlot?: (props: any) => any) {
  const chart = useChart()
  const layout = useChartLayout()
  const { needClip } = useNeedsClip(() => props.xAxisId, () => props.yAxisId)
  const barSettings = computed(() => ({
    barSize: props.barSize,
    data: props.data,
    dataKey: props.dataKey,
    maxBarSize: props.maxBarSize,
    minPointSize: props.minPointSize,
    stackId: getNormalizedStackId(props.stackId),
  }))
  const xAxis = computed(() => chart.axis('xAxis', props.xAxisId))
  const yAxis = computed(() => chart.axis('yAxis', props.yAxisId))
  const categoricalAxis = computed(() => layout.value === 'horizontal' ? xAxis.value : yAxis.value)
  const numericAxis = computed(() => layout.value === 'horizontal' ? yAxis.value : xAxis.value)
  const visibleBars = computed(() => chart.items.cartesian.entries.value.filter(item =>
    item.type === 'bar' && !item.hide && (layout.value === 'horizontal'
      ? item.xAxisId === props.xAxisId
      : item.yAxisId === props.yAxisId),
  ))
  const sizeList = computed(() => combineBarSizeList(
    visibleBars.value,
    chart.rootProps.value.barSize,
    layout.value === 'horizontal' ? categoricalAxis.value.size.value.width : categoricalAxis.value.size.value.height,
  ))
  const bandSize = computed(() => categoricalAxis.value.bandSize.value)
  const barBandSize = computed(() => categoricalAxis.value.barBandSize.value
    ?? props.maxBarSize ?? chart.rootProps.value.maxBarSize ?? 0)
  const positions = computed(() => combineAllBarPositions(
    sizeList.value,
    chart.rootProps.value.maxBarSize!,
    chart.rootProps.value.barGap,
    chart.rootProps.value.barCategoryGap,
    barBandSize.value,
    bandSize.value,
    props.maxBarSize,
  ))
  const position = computed(() => positions.value?.find(item =>
    item.stackId === barSettings.value.stackId && item.dataKeys.includes(props.dataKey),
  )?.position)
  const stackedData = computed(() => combineStackedData(numericAxis.value.stackGroups.value, barSettings.value))
  const rects = computed(() => {
    const x = xAxis.value.withScale.value
    const y = yAxis.value.withScale.value
    const xTicks = xAxis.value.graphicalTicks.value
    const yTicks = yAxis.value.graphicalTicks.value
    const pos = position.value
    const { chartData, dataStartIndex, dataEndIndex } = chart.dataRange.state.value
    const displayedData = props.data?.length ? props.data : chartData?.slice(dataStartIndex, dataEndIndex + 1)
    const type = layout.value
    if (!pos || !x || !y || !xTicks || !yTicks || !displayedData
      || (type !== 'horizontal' && type !== 'vertical')) {
      return undefined
    }
    return computeBarRectangles({
      layout: type,
      barSettings: barSettings.value,
      pos,
      bandSize: bandSize.value!,
      xAxis: x,
      yAxis: y,
      xAxisTicks: xTicks,
      yAxisTicks: yTicks,
      stackedData: stackedData.value,
      displayedData,
      offset: chart.offset.value,
    })
  })
  const band = computed(() => position.value && bandSize.value ? { offset: position.value.offset, size: bandSize.value } : undefined)

  const shouldRender = computed(() => {
    // A hidden bar stays mounted so its bars can leave; it draws nothing once they have.
    return layout.value === 'vertical' || layout.value === 'horizontal'
  })

  const clipPathId = useChartId('v-charts-bar')
  const isAnimating = ref(false)
  const cellPropsRef = shallowRef<Record<string, any>[]>([])
  const drawn = shallowRef<readonly DrawnBar[]>([])

  provideBarContext({
    clipPathId,
    layout,
    props,
    attrs,
    data: rects,
    isAnimating,
    shapeSlot,
    activeBarSlot,
    cellProps: cellPropsRef,
    band,
    drawn,
  })

  return {
    shouldRender,
    needClip,
    clipPathId,
    barData: rects,
    isAnimating,
    cellProps: cellPropsRef,
    drawn,
  }
}
