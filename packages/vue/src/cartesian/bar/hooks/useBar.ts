import { useChartId } from '@/hooks/useChartId'
import type { Ref, SVGAttributes, ShallowRef } from 'vue'
import { computed, ref, shallowRef } from 'vue'
import { createContext } from 'motion-v'
import type { ResolvedBarProps } from '../type'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { getNormalizedStackId } from '@/utils/chart'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useAppSelector } from '@/state/hooks'
import { selectAxisBandSize, selectBarPosition, selectBarRectangles } from '@/state/selectors/barSelectors'
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
  const isPanorama = useIsPanorama()
  const layout = useChartLayout()
  const { needClip } = useNeedsClip(props.xAxisId, props.yAxisId)
  const barSettings = computed(() => ({
    barSize: props.barSize,
    data: props.data,
    dataKey: props.dataKey,
    maxBarSize: props.maxBarSize,
    minPointSize: props.minPointSize,
    stackId: getNormalizedStackId(props.stackId),
  }))
  const rects = useAppSelector(state => selectBarRectangles(state, props.xAxisId, props.yAxisId, isPanorama, barSettings.value))
  const position = useAppSelector(state => selectBarPosition(state, props.xAxisId, props.yAxisId, isPanorama, barSettings.value))
  const bandSize = useAppSelector(state => selectAxisBandSize(state, props.xAxisId, props.yAxisId, isPanorama))
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
