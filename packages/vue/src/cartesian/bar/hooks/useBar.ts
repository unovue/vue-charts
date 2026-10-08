import type { BarSlots, ResolvedBarProps } from '../type'
import { computed, inject, provide, shallowRef } from 'vue'
import type { InjectionKey, Ref, ShallowRef } from 'vue'
import { useChartId } from '@/hooks/useChartId'
import { sameAxis } from '@/core/axis/key'
import { useChartPresentation } from '@/model/presentation'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useChart } from '@/model/chart'
import { computeBarRectangles } from '@/core/bar'
import { barPositions, barSizeList, stackedData as getStackedData } from '@/core/barSizing'
import type { BarRectangleItem } from '@/types/bar'
import type { CartesianGraphicalItemSettings } from '@/types/graphical'

export interface BarContext {
  clipPathId: string
  layout: Ref<'horizontal' | 'vertical' | 'centric' | 'radial'>
  props: ResolvedBarProps
  data: Readonly<ShallowRef<readonly BarRectangleItem[] | undefined>>
  shapeSlot?: BarSlots['shape']
  activeBarSlot?: BarSlots['shape']
  cellProps: ShallowRef<Record<string, unknown>[]>
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
const barKey: InjectionKey<BarContext> = Symbol('v-charts-bar-context')

function provideBarContext(value: BarContext) {
  provide(barKey, value)
  return value
}

export function useBarContext(fallback?: BarContext): BarContext
export function useBarContext(fallback: BarContext | null): BarContext | null
export function useBarContext(fallback?: BarContext | null) {
  const value = inject(barKey, fallback)
  if (value === undefined)
    throw new Error('vccs: useBarContext requires its provider.')
  return value
}

export function useBar(
  props: ResolvedBarProps,
  settings: Readonly<Ref<CartesianGraphicalItemSettings>>,
  shapeSlot?: BarSlots['shape'],
  activeBarSlot?: BarSlots['activeBar'],
) {
  const chart = useChart()
  const layout = useChartPresentation().layout
  const { needClip } = useNeedsClip(() => props.xAxisId, () => props.yAxisId)
  const xAxis = computed(() => chart.axis('xAxis', props.xAxisId))
  const yAxis = computed(() => chart.axis('yAxis', props.yAxisId))
  const categoricalAxis = computed(() => layout.value === 'horizontal' ? xAxis.value : yAxis.value)
  const numericAxis = computed(() => layout.value === 'horizontal' ? yAxis.value : xAxis.value)
  const visibleBars = computed(() => chart.items.cartesian.entries.value.filter(item =>
    item.type === 'bar' && !item.hide && (layout.value === 'horizontal'
      ? sameAxis(item.xAxisId, props.xAxisId)
      : sameAxis(item.yAxisId, props.yAxisId)),
  ))
  const sizeList = computed(() => barSizeList(
    visibleBars.value,
    chart.options.value.barSize,
    layout.value === 'horizontal' ? categoricalAxis.value.size.value.width : categoricalAxis.value.size.value.height,
  ))
  const bandSize = computed(() => categoricalAxis.value.bandSize.value)
  const barBandSize = computed(() => categoricalAxis.value.barBandSize.value
    ?? props.maxBarSize ?? chart.options.value.maxBarSize ?? 0)
  const positions = computed(() => barPositions(
    sizeList.value,
    chart.options.value.maxBarSize,
    chart.options.value.barGap,
    chart.options.value.barCategoryGap,
    barBandSize.value,
    bandSize.value,
    props.maxBarSize,
  ))
  const position = computed(() => positions.value?.find(item =>
    item.stackId === settings.value.stackId && item.dataKeys.includes(props.dataKey),
  )?.position)
  const stackedData = computed(() => getStackedData(numericAxis.value.stackGroups.value, settings.value))
  const rects = computed(() => {
    const x = xAxis.value.withScale.value
    const y = yAxis.value.withScale.value
    const xTicks = xAxis.value.graphicalTicks.value
    const yTicks = yAxis.value.graphicalTicks.value
    const pos = position.value
    const displayedData = chart.dataRange.displayedData(props)
    const type = layout.value
    if (!pos || !x || !y || !xTicks || !yTicks || !displayedData
      || (type !== 'horizontal' && type !== 'vertical')) {
      return undefined
    }
    return computeBarRectangles({
      layout: type,
      barSettings: settings.value,
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
  const cellPropsRef = shallowRef<Record<string, unknown>[]>([])
  const drawn = shallowRef<readonly DrawnBar[]>([])

  provideBarContext({
    clipPathId,
    layout,
    props,
    data: rects,
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
    cellProps: cellPropsRef,
    drawn,
  }
}
