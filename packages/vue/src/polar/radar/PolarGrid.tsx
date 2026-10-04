import { computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useAppSelector } from '@/state/hooks'
import { selectPolarViewBox } from '@/state/selectors/polarAxisSelectors'
import { selectPolarGridAngles, selectPolarGridRadii } from '@/state/selectors/polarGridSelectors'
import { polarToCartesian } from '@/utils/polar'

function getPolygonPath(radius: number, cx: number, cy: number, polarAngles: ReadonlyArray<number>): string {
  let path = ''
  polarAngles.forEach((angle, i) => {
    const point = polarToCartesian(cx, cy, radius, angle)
    path += i === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`
  })
  return `${path}Z`
}

const PolarGridViewProps = {
  angleAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  radiusAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  gridType: { type: String as PropType<'polygon' | 'circle'>, default: 'polygon' },
  radialLines: { type: Boolean, default: true },
  stroke: { type: String, default: 'var(--v-charts-grid, #ccc)' },
  fill: { type: String, default: 'none' },
  polarRadius: { type: Array as PropType<number[]>, default: undefined },
  strokeWidth: { type: Number, default: undefined },
}

const PolarGridView = defineComponent({
  name: 'PolarGridView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof PolarGridViewProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const polarViewBox = useAppSelector(state => selectPolarViewBox(state))
    const polarAngles = useAppSelector(state => selectPolarGridAngles(state, props.angleAxisId))
    const selectedPolarRadii = useAppSelector(state => selectPolarGridRadii(state, props.radiusAxisId))

    const polarRadii = computed(() => {
      if (Array.isArray(props.polarRadius))
        return props.polarRadius
      return selectedPolarRadii.value
    })

    return () => {
      const viewBox = polarViewBox.value
      const angles = polarAngles.value
      const radii = polarRadii.value

      if (viewBox == null || angles == null || radii == null || viewBox.outerRadius <= 0) {
        return null
      }

      const { cx, cy, innerRadius } = viewBox
      const { stroke, gridType, fill, strokeWidth } = props
      const shapeClass = attrs.class
      const renderBackground = fill && fill !== 'none'

      return (
        <g class="v-charts-polar-grid">
          {/* Concentric grid shapes */}
          <g class="v-charts-polar-grid-concentric">
            {/* Background fill — single shape at max radius, rendered first so rings draw on top */}
            {renderBackground && (
              gridType === 'circle'
                ? (
                    <circle
                      class={['v-charts-polar-grid-concentric-circle', shapeClass]}
                      cx={cx}
                      cy={cy}
                      r={Math.max(...radii)}
                      stroke={stroke}
                      fill={fill}
                      stroke-width={strokeWidth}
                    />
                  )
                : (
                    <path
                      class={['v-charts-polar-grid-concentric-polygon', shapeClass]}
                      d={getPolygonPath(Math.max(...radii), cx, cy, angles)}
                      stroke={stroke}
                      fill={fill}
                      stroke-width={strokeWidth}
                    />
                  )
            )}
            {/* Concentric rings — stroke only */}
            {radii.map((radius, i) => (
              gridType === 'circle'
                ? (
                    <circle
                      key={`circle-${i}`}
                      class={['v-charts-polar-grid-concentric-circle', shapeClass]}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      stroke={stroke}
                      fill="none"
                      stroke-width={strokeWidth}
                    />
                  )
                : (
                    <path
                      key={`polygon-${i}`}
                      class={['v-charts-polar-grid-concentric-polygon', shapeClass]}
                      d={getPolygonPath(radius, cx, cy, angles)}
                      stroke={stroke}
                      fill="none"
                      stroke-width={strokeWidth}
                    />
                  )
            ))}
          </g>
          {/* Radial lines */}
          {props.radialLines && angles.length > 0 && (
            <g class="v-charts-polar-grid-angle">
              {angles.map((angle) => {
                const start = polarToCartesian(cx, cy, innerRadius, angle)
                const end = polarToCartesian(cx, cy, viewBox.outerRadius, angle)
                return (
                  <line
                    key={`line-${angle}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={stroke}
                  />
                )
              })}
            </g>
          )}
        </g>
      )
    }
  },
})

export const PolarGrid = defineComponent({
  name: 'PolarGrid',
  props: PolarGridViewProps,
  inheritAttrs: false,
  setup(props, { attrs, slots }) {
    const View = useDeferredView(PolarGridView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
