import type { PropType } from 'vue'
import { Fragment, defineComponent, watch } from 'vue'
import { useOffset } from '@/context/chartLayoutContext'
import { Layer } from '@/container/Layer'
import type { Point } from '@/shape/Curve'
import { Curve } from '@/shape/Curve'
import type { LinePointItem } from './type'
import { useLineContext } from './hooks/useLine'
import { Dot } from '@/shape/Dot'
import { AnimatedLabelList as LabelList } from '@/components/label/AnimatedLabelList'
import { usePointTransition } from '@/animation/usePointTransition'
import { SweepClip } from '@/animation/SweepClip'
import { useAppSelector } from '@/state/hooks'
import { selectAxisSettings } from '@/state/selectors/axisSelectors'
import { getValueByDataKey } from '@/utils/chart'
// Dots component
export const Dots = defineComponent({
  name: 'LineDots',
  props: {
    keys: { type: Array as PropType<PropertyKey[]>, default: () => [] },
    points: {
      type: Array as PropType<ReadonlyArray<Point>>,
      default: () => [],
    },
  },
  setup(_props) {
    const { clipPathId, clipDot, props, attrs, needClip, dotSlot } = useLineContext()

    return () => {
      const { points } = _props
      if (!shouldRenderDots(points!, props.dot!)) {
        return null
      }
      const dotObjProps = typeof props.dot === 'object' && props.dot !== null ? props.dot : {}
      const dotsProps = {
        'fill': 'var(--v-charts-background, #fff)',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        ...dotObjProps,
      }
      return (
        <Layer
          class="v-charts-line-dots"
          clip-path={needClip.value ? `url(#clipPath-${clipDot ? '' : 'dots-'}${clipPathId.value})` : undefined}
        >
          {
            points?.map((point, index) => {
              const pointAsLine = point as LinePointItem
              if (dotSlot) {
                return <g key={_props.keys[index]}>{dotSlot({ ...dotsProps, ...attrs, cx: point.x, cy: point.y, index, value: pointAsLine.value, payload: pointAsLine.payload })}</g>
              }
              return <Dot key={_props.keys[index]} r={3} {...dotsProps} {...attrs} cx={point.x} cy={point.y} class="v-charts-line-dot" clipDot={clipDot} />
            })
          }
        </Layer>
      )
    }
  },
})

export const StaticLine = defineComponent({
  name: 'StaticLine',
  setup() {
    const { points, clipPathId, layout, attrs, lineData, props, isAnimating, needClip, shapeSlot, labelSlot } = useLineContext()
    const offset = useOffset()
    const categoryAxis = useAppSelector(state => layout.value === 'vertical'
      ? selectAxisSettings(state, 'yAxis', props.yAxisId)
      : selectAxisSettings(state, 'xAxis', props.xAxisId))
    const display = usePointTransition(() => points.value, {
      key: (point, index) => {
        const dataKey = categoryAxis.value?.dataKey
        const category = dataKey == null ? undefined : getValueByDataKey(point.payload, dataKey)
        return category == null ? index : String(category)
      },
      isActive: () => props.isAnimationActive !== false,
      transition: () => props.transition,
      onStart: () => props.onAnimationStart?.(),
      onEnd: () => props.onAnimationEnd?.(),
    })
    watch(display.isAnimating, (value) => { isAnimating.value = value }, { immediate: true })
    return () => {
      const curveProps = {
        ...attrs,
        'fill': 'none',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        'points': display.points.value,
        'connectNulls': props.connectNulls,
        'type': props.type,
        'layout': layout.value === 'vertical' ? 'vertical' as const : 'horizontal' as const,
        'class': 'v-charts-line-curve',
      }
      const sweepId = `line-anim-${clipPathId.value}`
      const labelProps = typeof props.label === 'object' ? props.label : {}
      return (
        <Fragment>
          <defs>
            <SweepClip
              id={sweepId}
              progress={display.reveal.value}
              vertical={layout.value === 'vertical'}
              x={offset.value.left - 8}
              y={offset.value.top - 8}
              width={offset.value.width + 16}
              height={offset.value.height + 16}
            />
          </defs>
          <g clip-path={display.reveal.value < 1 ? `url(#${sweepId})` : undefined}>
            <Layer clip-path={needClip.value ? `url(#clipPath-${clipPathId.value})` : undefined}>
              {display.points.value.length > 1 && (shapeSlot ? shapeSlot(curveProps) : <Curve {...curveProps} />)}
            </Layer>
            <Dots points={display.points.value} keys={display.items.value.map(item => item.key)} />
          </g>
          {!isAnimating.value && (props.label || labelSlot) && (
            <LabelList
              {...labelProps}
              data={lineData.value ?? []}
              dataKey={props.dataKey}
              v-slots={labelSlot ? { label: labelSlot } : undefined}
            />
          )}
        </Fragment>
      )
    }
  },
})

function shouldRenderDots(points: ReadonlyArray<LinePointItem>, dot: unknown): boolean {
  return points != null && points.length > 0 && (!!dot || points.length === 1)
}
