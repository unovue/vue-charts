import { useChartId } from '@/hooks/useChartId'
import { useChartLayout } from '@/context/chartLayoutContext'
import { useChartName } from '@/state/selectors/selectors'
import type { LinePointItem, ResolvedLineProps } from '../type'
import type { ComputedRef, InjectionKey, Ref, SVGAttributes, ShallowRef } from 'vue'
import { computed, inject, provide, shallowRef } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { selectLinePoints } from '@/state/selectors/lineSelectors'
import { useIsAnimating } from '@/hooks/useIsAnimating'
import { isClipDot } from '@/utils/chart'
import { filterProps } from '@/utils/VueUtils'
import { useNeedsClip } from '@/cartesian/useNeedsClip'

// Line Context 类型定义
export interface LineContext {
  clipPathId: Ref<string>
  layout: Readonly<Ref<string>>
  points: Ref<ReadonlyArray<LinePointItem> | undefined>
  props: ResolvedLineProps
  attrs: SVGAttributes
  lineData: Readonly<ShallowRef<ReadonlyArray<LinePointItem> | undefined>>
  isAnimating: Ref<boolean>
  needClip: ComputedRef<boolean>
  dot: any
  clipDot: boolean
  dotSize: number
  shapeSlot?: (props: any) => any
  dotSlot?: (props: any) => any
  labelSlot?: (props: any) => any
  /** The labels as drawn on this frame; LabelList children read them. */
  labelData: ShallowRef<readonly any[] | undefined>
}

// Injection Key
export const LineContextKey: InjectionKey<LineContext> = Symbol('LineContext')

// 提供 Line Context
export function provideLineContext(context: LineContext) {
  provide(LineContextKey, context)
}

// 使用 Line Context
export function useLineContext() {
  const context = inject(LineContextKey)
  if (!context) {
    throw new Error('useLineContext must be used within Line component')
  }
  return context
}

export function useLine(props: ResolvedLineProps, attrs: SVGAttributes = {}, shapeSlot?: (props: any) => any, dotSlot?: (props: any) => any, labelSlot?: (props: any) => any) {
  const layout = useChartLayout()
  const chartName = useChartName()
  const localId = useChartId('v-charts-line')
  const clipPathId = computed(() => props.id || localId)

  const isAnimating = useIsAnimating(() => props.isAnimationActive)
  const { needClip } = useNeedsClip(props.xAxisId!, props.yAxisId!)

  const shouldRender = computed(() =>
    (layout.value === 'horizontal' || layout.value === 'vertical')
    && (chartName.value === 'LineChart' || chartName.value === 'ComposedChart'),
  )

  const lineSettings = computed(
    () => ({
      data: props.data,
      dataKey: props.dataKey!,
    }),
  )

  const lineData = useAppSelector(state =>
    selectLinePoints(state, props.xAxisId!, props.yAxisId!, lineSettings.value),
  )

  // Dot related logic
  const dot = props.dot
  const clipDot = isClipDot(dot)
  const { r = 3, strokeWidth = 2 } = filterProps(dot, false) ?? { r: 3, strokeWidth: 2 }
  const dotSize = r * 2 + strokeWidth

  // Create Line Context - 保持响应式
  const lineContext: LineContext = {
    clipPathId,
    layout,
    points: computed(() => lineData.value),
    props,
    attrs,
    lineData,
    isAnimating,
    needClip,
    dot,
    clipDot,
    dotSize,
    shapeSlot,
    dotSlot,
    labelSlot,
    labelData: shallowRef(undefined),
  }

  // Provide context
  provideLineContext(lineContext)

  return {
    shouldRender,
    needClip,
    lineData,
    points: lineContext.points,
    clipPathId,
    isAnimating,
    labelData: lineContext.labelData,
  }
}
