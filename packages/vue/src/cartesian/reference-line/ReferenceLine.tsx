import type { PropType, SVGAttributes } from 'vue'
import { classProp } from '@/types'
import { computed, defineComponent, onMounted, onUnmounted, reactive } from 'vue'
import { Layer } from '@/container/Layer'
import { Label } from '@/components/label/Label'
import { useAppSelector } from '@/state/hooks'
import { useChartReferenceElements } from '@/state/chartContext'
import type { AxisId } from '@/state/chartCartesianAxis'
import { selectAxisScale, selectXAxisSettings, selectYAxisSettings } from '@/state/selectors/axisSelectors'
import { useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/chart/provideClipPathId'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { isNumOrStr, isWellBehavedNumber } from '@/utils'
import { isInRange, scaleCoord } from '@/utils/scale'
import type { IfOverflow } from '@/types'

export const ReferenceLineVueProps = {
  x: { type: [Number, String] as PropType<number | string>, default: undefined },
  y: { type: [Number, String] as PropType<number | string>, default: undefined },
  xAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  stroke: { type: String, default: 'var(--v-charts-grid, #ccc)' },
  strokeWidth: { type: [Number, String], default: 1 },
  fill: { type: String, default: 'none' },
  label: { type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Record<string, any>>, default: undefined },
  ifOverflow: { type: String as PropType<IfOverflow>, default: 'discard' },
  class: classProp,
}

export const ReferenceLine = defineComponent({
  name: 'ReferenceLine',
  props: ReferenceLineVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    const { addLine, removeLine } = useChartReferenceElements()
    const isPanorama = useIsPanorama()
    const clipPathId = useClipPathId()
    const viewBox = useViewBox()

    const settings = reactive({
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
      ifOverflow: props.ifOverflow,
      x: props.x,
      y: props.y,
    })

    onMounted(() => {
      addLine(settings)
    })
    onUnmounted(() => {
      removeLine(settings)
    })

    const xAxisSettings = useAppSelector(state => selectXAxisSettings(state, props.xAxisId))
    const yAxisSettings = useAppSelector(state => selectYAxisSettings(state, props.yAxisId))
    const xAxisScale = useAppSelector(state => selectAxisScale(state, 'xAxis', props.xAxisId, isPanorama))
    const yAxisScale = useAppSelector(state => selectAxisScale(state, 'yAxis', props.yAxisId, isPanorama))

    const endPoints = computed(() => {
      const vb = viewBox.value
      const xScale = xAxisScale.value
      const yScale = yAxisScale.value
      if (!vb || !xScale || !yScale)
        return null

      if (isNumOrStr(props.y)) {
        const coord = scaleCoord(yScale, props.y!)
        if (coord == null)
          return null
        if (props.ifOverflow === 'discard' && !isInRange(yScale, coord))
          return null
        const yOrientation = yAxisSettings.value?.orientation
        const points = [
          { x: vb.x + vb.width, y: coord },
          { x: vb.x, y: coord },
        ]
        return yOrientation === 'left' ? points.reverse() : points
      }

      if (isNumOrStr(props.x)) {
        const coord = scaleCoord(xScale, props.x!)
        if (coord == null)
          return null
        if (props.ifOverflow === 'discard' && !isInRange(xScale, coord))
          return null
        const xOrientation = xAxisSettings.value?.orientation
        const points = [
          { x: coord, y: vb.y + vb.height },
          { x: coord, y: vb.y },
        ]
        return xOrientation === 'top' ? points.reverse() : points
      }

      return null
    })

    return () => {
      const pts = endPoints.value
      if (!pts || pts.length < 2)
        return null

      const [p1, p2] = pts
      if (!isWellBehavedNumber(p1.x) || !isWellBehavedNumber(p1.y)
        || !isWellBehavedNumber(p2.x) || !isWellBehavedNumber(p2.y)) {
        return null
      }

      const clipPath = props.ifOverflow === 'hidden' ? `url(#${clipPathId})` : undefined

      const svgAttrs: SVGAttributes = {
        ...attrs,
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        'fill': props.fill,
      }

      const labelViewBox = {
        x: Math.min(p1.x, p2.x),
        y: Math.min(p1.y, p2.y),
        width: Math.abs(p2.x - p1.x),
        height: Math.abs(p2.y - p1.y),
      }

      const labelValue = props.label
      const labelProps = typeof labelValue === 'object' && labelValue !== null
        ? labelValue
        : {}

      return (
        <Layer class={['v-charts-reference-line', props.class]}>
          <line
            {...svgAttrs}
            clip-path={clipPath}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            class="v-charts-reference-line-line"
          />
          {labelValue != null && labelValue !== false && (
            <Label
              viewBox={labelViewBox}
              value={typeof labelValue === 'string' || typeof labelValue === 'number' ? labelValue : undefined}
              {...labelProps}
            />
          )}
        </Layer>
      )
    }
  },
})
