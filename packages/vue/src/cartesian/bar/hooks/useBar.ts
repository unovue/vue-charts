import { useChartId } from '@/hooks/useChartId'
import type { Ref, SVGAttributes, ShallowRef } from 'vue'
import { computed, ref, shallowRef } from 'vue'
import { createContext } from 'motion-v'
import type { BarProps } from '../type'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { getNormalizedStackId } from '@/utils/chart'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useNeedsClip } from '@/cartesian/useNeedsClip'
import { useAppSelector } from '@/state/hooks'
import { selectBarRectangles } from '@/state/selectors/barSelectors'
import type { BarRectangleItem } from '@/types/bar'

export interface BarContext {
  // 基础计算属性
  clipPathId: string
  layout: Ref<'horizontal' | 'vertical' | 'centric' | 'radial'>
  props: BarProps
  attrs: SVGAttributes
  data: Readonly<ShallowRef<readonly BarRectangleItem[]>>
  isAnimating: Ref<boolean>
  shapeSlot?: (props: any) => any
  activeBarSlot?: (props: any) => any
  cellProps: ShallowRef<Record<string, any>[]>
}
export const [useBarContext, provideBarContext] = createContext<BarContext>('BarContext')

export function useBar(props: BarProps, attrs: SVGAttributes, shapeSlot?: (props: any) => any, activeBarSlot?: (props: any) => any) {
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

  const shouldRender = computed(() => {
    return (layout.value === 'vertical' || layout.value === 'horizontal') && !props.hide
  })

  const clipPathId = useChartId('v-charts-bar')
  const isAnimating = ref(false)
  const cellPropsRef = shallowRef<Record<string, any>[]>([])

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
  })

  return {
    shouldRender,
    needClip,
    clipPathId,
    barData: rects,
    isAnimating,
    cellProps: cellPropsRef,
  }
}
