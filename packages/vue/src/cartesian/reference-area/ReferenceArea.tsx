import { useChart } from '@/model/chart'
import { computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType, SVGAttributes } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { classProp } from '@/types'
import { Layer } from '@/container/Layer'
import { Label } from '@/components/label/Label'
import { Rectangle } from '@/shape/Rectangle'
import type { AxisId } from '@/types/axisSettings'
import { useClipPathId } from '@/model/runtime'
import { isNumOrStr } from '@/utils'
import { rangeMax, rangeMin, scaleValue } from '@/utils/scale'
import type { IfOverflow } from '@/types'

export const ReferenceAreaVueProps = {
  x1: { type: [Number, String] as PropType<number | string>, default: undefined },
  x2: { type: [Number, String] as PropType<number | string>, default: undefined },
  y1: { type: [Number, String] as PropType<number | string>, default: undefined },
  y2: { type: [Number, String] as PropType<number | string>, default: undefined },
  xAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  yAxisId: { type: [Number, String] as PropType<AxisId>, default: 0 },
  stroke: { type: String, default: 'none' },
  strokeWidth: { type: [Number, String], default: 1 },
  fill: { type: String, default: 'var(--v-charts-grid, #ccc)' },
  fillOpacity: { type: Number, default: 0.5 },
  label: { type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Record<string, any>>, default: undefined },
  ifOverflow: { type: String as PropType<IfOverflow>, default: 'discard' },
  radius: { type: [Number, Array] as PropType<number | [number, number, number, number]>, default: 0 },
  class: classProp,
}

const ReferenceAreaView = defineComponent({
  name: 'ReferenceAreaView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof ReferenceAreaVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const chart = useChart()
    const props = view.item
    const attrs = view.svgAttrs

    const clipPathId = useClipPathId()

    const xAxisScale = computed(() => chart.axis('xAxis', props.xAxisId).scale.value)
    const yAxisScale = computed(() => chart.axis('yAxis', props.yAxisId).scale.value)

    const rect = computed(() => {
      const xScale = xAxisScale.value
      const yScale = yAxisScale.value
      if (!xScale || !yScale)
        return null

      const hasX1 = isNumOrStr(props.x1)
      const hasX2 = isNumOrStr(props.x2)
      const hasY1 = isNumOrStr(props.y1)
      const hasY2 = isNumOrStr(props.y2)

      if (!hasX1 && !hasX2 && !hasY1 && !hasY2)
        return null

      const px1 = hasX1 ? scaleValue(xScale, props.x1!, 'start') : rangeMin(xScale)
      const px2 = hasX2 ? scaleValue(xScale, props.x2!, 'end') : rangeMax(xScale)
      const py1 = hasY1 ? scaleValue(yScale, props.y1!, 'start') : rangeMin(yScale)
      const py2 = hasY2 ? scaleValue(yScale, props.y2!, 'end') : rangeMax(yScale)

      if (px1 == null || px2 == null || py1 == null || py2 == null)
        return null

      const x = Math.min(px1, px2)
      const y = Math.min(py1, py2)
      const width = Math.abs(px2 - px1)
      const height = Math.abs(py2 - py1)

      return { x, y, width, height }
    })

    return () => {
      const r = rect.value
      if (!r)
        return null

      const clipPath = props.ifOverflow === 'hidden' ? `url(#${clipPathId})` : undefined

      const svgAttrs: SVGAttributes = {
        ...attrs,
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        'fill': props.fill,
        'fill-opacity': props.fillOpacity,
      }

      const labelValue = props.label
      const labelProps = typeof labelValue === 'object' && labelValue !== null
        ? labelValue
        : {}

      return (
        <Layer class={['v-charts-reference-area', props.class]}>
          {slots.shape
            ? slots.shape(r)
            : (
                <Rectangle
                  {...svgAttrs}
                  clip-path={clipPath}
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  radius={props.radius}
                  class="v-charts-reference-area-rect"
                />
              )}
          {labelValue != null && labelValue !== false && (
            <Label
              viewBox={r}
              value={typeof labelValue === 'string' || typeof labelValue === 'number' ? labelValue : undefined}
              {...labelProps}
            />
          )}
        </Layer>
      )
    }
  },
})

const _ReferenceArea = defineComponent({
  name: 'ReferenceArea',
  props: ReferenceAreaVueProps,
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    const { areas } = useChart().references
    const settings = computed(() => ({
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
      ifOverflow: props.ifOverflow,
      x1: props.x1,
      x2: props.x2,
      y1: props.y1,
      y2: props.y2,
    }))

    areas.register(settings)

    const View = useDeferredView(ReferenceAreaView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const ReferenceArea: typeof _ReferenceArea & { new (): { $slots: { shape?: (props: { x: number, y: number, width: number, height: number }) => import('vue').VNodeChild } } } = _ReferenceArea
