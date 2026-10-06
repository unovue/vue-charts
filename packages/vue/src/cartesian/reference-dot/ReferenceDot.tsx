import { useChart } from '@/model/chart'
import { computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType, SVGAttributes, SlotsType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { Layer } from '@/container/Layer'
import { Dot } from '@/shape/Dot'
import { Label } from '@/components/label/Label'
import type { AxisId } from '@/types/axisSettings'
import { useClipPathId } from '@/model/runtime'
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

const ReferenceDotView = defineComponent({
  name: 'ReferenceDotView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof ReferenceDotVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  slots: Object as SlotsType<ReferenceDotSlots>,
  setup(view, { slots }) {
    const chart = useChart()
    const props = view.item
    const attrs = view.svgAttrs

    const clipPathId = useClipPathId()

    const xAxisScale = computed(() => chart.axis('xAxis', props.xAxisId).scale.value)
    const yAxisScale = computed(() => chart.axis('yAxis', props.yAxisId).scale.value)

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

const _ReferenceDot = defineComponent({
  name: 'ReferenceDot',
  props: ReferenceDotVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<ReferenceDotSlots>,
  setup(props, { attrs, slots }) {
    const { dots } = useChart().references
    const settings = computed(() => ({
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
      ifOverflow: props.ifOverflow,
      x: props.x,
      y: props.y,
      r: props.r,
    }))

    dots.register(settings)

    const View = useDeferredView(ReferenceDotView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})

export const ReferenceDot = _ReferenceDot as typeof _ReferenceDot & {
  new (): { $slots: ReferenceDotSlots }
}
