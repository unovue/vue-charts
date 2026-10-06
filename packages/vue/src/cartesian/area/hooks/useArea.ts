import { useChartId } from '@/hooks/useChartId'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useChartName } from '@/state/chartContext'
import type { AreaDotSlotProps, ResolvedAreaProps } from '@/cartesian/area/type'
import { computed, inject, provide } from 'vue'
import type { InjectionKey, Ref, SVGAttributes, ShallowRef } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectArea } from '@/state/selectors/areaSelectors'
import { useIsAnimating } from '@/hooks/useIsAnimating'
import { isClipDot } from '@/utils/chart'
import { filterProps } from '@/utils/VueUtils'
import type { AreaPointItem, ComputedArea } from '@/state/selectors/areaSelectors'

// Area Context 类型定义
export interface AreaContext {
  // 基础计算属性
  clipPathId: Ref<string>
  layout: Ref<'horizontal' | 'vertical' | 'centric' | 'radial'>
  points: Ref<ReadonlyArray<AreaPointItem> | undefined>

  // 响应式 props 和 attrs
  props: ResolvedAreaProps
  attrs: SVGAttributes

  // 计算属性
  dot: any
  clipDot: boolean
  dotSize: number

  // dot slot for custom rendering
  dotSlot?: (props: AreaDotSlotProps) => any

  areaData: Readonly<ShallowRef<ComputedArea | undefined>>

  // is Area animating
  isAnimating: Ref<boolean>
}

// Injection Key
export const AreaContextKey: InjectionKey<AreaContext> = Symbol('AreaContext')

// 提供 Area Context
export function provideAreaContext(context: AreaContext) {
  provide(AreaContextKey, context)
}

// 使用 Area Context
export function useAreaContext() {
  const context = inject(AreaContextKey)
  if (!context) {
    throw new Error('useAreaContext must be used within Area component')
  }
  return context
}

export function useArea(props: ResolvedAreaProps, attrs: SVGAttributes = {}, dotSlot?: (props: AreaDotSlotProps) => any) {
  const layout = useChartLayout()
  const chartName = useChartName()
  const localId = useChartId('v-charts-area')
  const clipPathId = computed(() => props.id || localId)

  /**
   * is Area animating
   */
  const isAnimating = useIsAnimating(() => props.isAnimationActive)
  /**
   * render only when layout is horizontal or vertical and chartName is AreaChart or ComposedChart
   */
  const shouldRender = computed(() =>
    (layout.value === 'horizontal' || layout.value === 'vertical')
    && (chartName.value === 'AreaChart' || chartName.value === 'ComposedChart'),
  )

  const areaSettings = computed(
    () => ({
      baseValue: props.baseValue,
      stackId: props.stackId,
      connectNulls: props.connectNulls!,
      data: props.data,
      dataKey: props.dataKey!,
    }),
  )
  const areaData = useAppSelector(state => selectArea(state, props.xAxisId!, props.yAxisId!, areaSettings.value))
  // Dot related logic
  const dot = props.dot
  const clipDot = isClipDot(dot)
  const { r = 3, strokeWidth = 2 } = filterProps(dot, false) ?? { r: 3, strokeWidth: 2 }
  const dotSize = r * 2 + strokeWidth

  // Create Area Context - 保持响应式
  const areaContext: AreaContext = {
    clipPathId,
    layout,
    points: computed(() => areaData.value?.points),
    props,
    attrs,
    dot,
    clipDot,
    dotSize,
    dotSlot,
    areaData,
    isAnimating,
  }

  // Provide context
  provideAreaContext(areaContext)

  return {
    shouldRender,
    areaData,
    points: areaContext.points,
    clipPathId,
  }
}
