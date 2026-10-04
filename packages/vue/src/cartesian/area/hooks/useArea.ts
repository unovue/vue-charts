import { useChartLayout } from '@/context/chartLayoutContext'
import { useChartName } from '@/state/selectors/selectors'
import type { AreaDotSlotProps, AreaProps } from '@/cartesian/area/type'
import { computed, inject, provide, ref, useId, watch } from 'vue'
import type { InjectionKey, Ref, SVGAttributes, ShallowRef } from 'vue'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
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
  props: AreaProps
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

  isClipRectAnimating: Ref<boolean>
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

export function useArea(props: AreaProps, attrs: SVGAttributes = {}, dotSlot?: (props: AreaDotSlotProps) => any) {
  const layout = useChartLayout()
  const chartName = useChartName()
  const localId = `v-charts-area-${useId().replace(/[^\w-]/g, '_')}`
  const clipPathId = computed(() => props.id || localId)
  const isPanorama = useIsPanorama()

  /**
   * is Area animating
   */
  const isAnimating = useIsAnimating(() => props.isAnimationActive)
  /**
   * render only when layout is horizontal or vertical and chartName is AreaChart or ComposedChart
   */
  const shouldRender = computed(() =>
    (layout.value === 'horizontal' || layout.value === 'vertical')
    && (chartName.value === 'AreaChart' || chartName.value === 'ComposedChart')
    && !props.hide,
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
  const areaData = useAppSelector(state => selectArea(state, props.xAxisId!, props.yAxisId!, isPanorama, areaSettings.value))
  const isClipRectAnimating = ref(true)
  watch(() => props.hide, (v) => {
    if (!v) {
      isClipRectAnimating.value = true
    }
  })
  const shouldShowAnimation = computed(() => {
    return props.isAnimationActive && areaData.value?.points?.length && isClipRectAnimating.value
  })
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
    isClipRectAnimating,
  }

  // Provide context
  provideAreaContext(areaContext)

  return {
    shouldRender,
    areaData,
    points: areaContext.points,
    clipPathId,
    shouldShowAnimation,
  }
}
