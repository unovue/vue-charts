import type { PropType, SVGAttributes, SlotsType } from 'vue'
import { computed, defineComponent, onMounted, onUnmounted, reactive } from 'vue'
import { Layer } from '@/container/Layer'
import { Dot } from '@/shape/Dot'
import { Label } from '@/components/label/Label'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { addDot, removeDot } from '@/state/referenceElementsSlice'
import type { AxisId } from '@/state/cartesianAxisSlice'
import { selectAxisScale } from '@/state/selectors/axisSelectors'
import { useClipPathId } from '@/chart/provideClipPathId'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { isNumOrStr } from '@/utils'
import { isInRange, scaleCoord } from '@/utils/scale'
import type { IfOverflow } from '@/types'

export interface ReferenceDotShapeProps extends SVGAttributes {
  cx: number
  cy: number
  r: number
  fill?: string
  stroke?: string
  clipPath?: string
}

export interface ReferenceDotSlots {
  shape?: (props: ReferenceDotShapeProps) => any
}

export const ReferenceDotVueProps = {
  x: { type: [Number, String] as PropType<number | string>, default: undefined },
  y: { type: [Number, String] as PropType<number | string>, default: undefined },
  r: { type: Number, default: 10 },
  xAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  fill: { type: String, default: 'var(--v-charts-background, #fff)' },
  stroke: { type: String, default: 'var(--v-charts-grid, #ccc)' },
  label: { type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Record<string, any>>, default: undefined },
  ifOverflow: { type: String as PropType<IfOverflow>, default: 'discard' },
}

const _ReferenceDot = defineComponent({
  name: 'ReferenceDot',
  props: ReferenceDotVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<ReferenceDotSlots>,
  setup(props, { attrs, slots }) {
    const dispatch = useAppDispatch()
    const isPanorama = useIsPanorama()
    const clipPathId = useClipPathId()

    const settings = reactive({
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
      ifOverflow: props.ifOverflow,
      x: props.x,
      y: props.y,
      r: props.r,
    })

    onMounted(() => {
      dispatch(addDot(settings))
    })
    onUnmounted(() => {
      dispatch(removeDot(settings))
    })

    const xAxisScale = useAppSelector(state => selectAxisScale(state, 'xAxis', props.xAxisId, isPanorama))
    const yAxisScale = useAppSelector(state => selectAxisScale(state, 'yAxis', props.yAxisId, isPanorama))

    const dotCoord = computed(() => {
      const xScale = xAxisScale.value
      const yScale = yAxisScale.value
      if (!xScale || !yScale)
        return null
      if (!isNumOrStr(props.x) || !isNumOrStr(props.y))
        return null

      const cx = scaleCoord(xScale, props.x!)
      const cy = scaleCoord(yScale, props.y!)
      if (cx == null || cy == null)
        return null

      if (props.ifOverflow === 'discard') {
        if (!isInRange(xScale, cx) || !isInRange(yScale, cy))
          return null
      }

      return { cx, cy }
    })

    return () => {
      const coord = dotCoord.value
      if (!coord)
        return null

      const { cx, cy } = coord
      const clipPath = props.ifOverflow === 'hidden' ? `url(#${clipPathId})` : undefined

      const { class: userClass, ...restAttrs } = attrs
      const svgAttrs: SVGAttributes = {
        ...restAttrs,
        fill: props.fill,
        stroke: props.stroke,
      }

      const labelViewBox = {
        x: cx - props.r,
        y: cy - props.r,
        width: props.r * 2,
        height: props.r * 2,
      }

      const labelValue = props.label
      const labelProps = typeof labelValue === 'object' && labelValue !== null
        ? labelValue
        : {}

      const shapeProps: ReferenceDotShapeProps = {
        ...svgAttrs,
        cx,
        cy,
        r: props.r,
        clipPath,
      }

      return (
        <Layer class={['v-charts-reference-dot', userClass]}>
          {slots.shape
            ? slots.shape(shapeProps)
            : (
                <Dot
                  {...svgAttrs}
                  cx={cx}
                  cy={cy}
                  r={props.r}
                  clip-path={clipPath}
                />
              )}
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

export const ReferenceDot = _ReferenceDot as typeof _ReferenceDot & {
  new (): { $slots: ReferenceDotSlots }
}
