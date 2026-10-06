import { defineComponent, h, onUnmounted } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { Layer } from '@/container/Layer'
import { useErrorBarContext, useErrorBarRegistry } from './ErrorBarContext'
import { useAppSelector } from '@/state/hooks'
import { selectAxisWithScale } from '@/state/chartContext'
import { useChartLayout } from '@/context/chartLayoutContext'
import type { ErrorBarDirection } from '@/types/bar'
import type { ErrorBarsSettings } from '@/state/chartGraphicalItems'

interface LineCoordinate {
  x1: number
  y1: number
  x2: number
  y2: number
}

export const ErrorBarVueProps = {
  dataKey: { type: [String, Number, Function] as PropType<string | number | ((obj: any) => any)>, required: true as const },
  width: { type: Number, default: 5 },
  direction: { type: String as PropType<ErrorBarDirection> },
  stroke: { type: String, default: 'var(--v-charts-axis, black)' },
  strokeWidth: { type: [Number, String], default: 1.5 },
}

const ErrorBarView = defineComponent({
  name: 'ErrorBarView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof ErrorBarVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const layout = useChartLayout()
    const { data, dataPointFormatter, xAxisId, yAxisId, errorBarOffset } = useErrorBarContext()

    const xAxis = useAppSelector(state => selectAxisWithScale(state, 'xAxis', xAxisId))
    const yAxis = useAppSelector(state => selectAxisWithScale(state, 'yAxis', yAxisId))

    return () => {
      const xAxisVal = xAxis.value
      const yAxisVal = yAxis.value

      if (xAxisVal?.scale == null || yAxisVal?.scale == null || data.value == null) {
        return null
      }

      const direction: ErrorBarDirection = props.direction ?? (layout.value === 'horizontal' ? 'y' : 'x')

      if (direction === 'x' && xAxisVal.type !== 'number') {
        return null
      }

      const offset = errorBarOffset.value

      const errorBars = data.value.map((entry, dataIndex) => {
        const { x, y, value, errorVal } = dataPointFormatter(entry, props.dataKey!, direction)

        if (!errorVal || x == null || y == null) {
          return null
        }

        const lineCoordinates: Array<LineCoordinate> = []
        let lowBound: number, highBound: number

        if (Array.isArray(errorVal)) {
          const [low, high] = errorVal
          if (low == null || high == null) {
            return null
          }
          lowBound = low
          highBound = high
        }
        else {
          lowBound = highBound = errorVal
        }

        if (direction === 'x') {
          const { scale } = xAxisVal

          const yMid = y + offset
          const yMin = yMid + props.width
          const yMax = yMid - props.width

          const xMin = scale(value - lowBound)
          const xMax = scale(value + highBound)

          if (xMin != null && xMax != null) {
            lineCoordinates.push({ x1: xMax, y1: yMin, x2: xMax, y2: yMax })
            lineCoordinates.push({ x1: xMin, y1: yMid, x2: xMax, y2: yMid })
            lineCoordinates.push({ x1: xMin, y1: yMin, x2: xMin, y2: yMax })
          }
        }
        else if (direction === 'y') {
          const { scale } = yAxisVal

          const xMid = x + offset
          const xMin = xMid - props.width
          const xMax = xMid + props.width

          const yMin = scale(value - lowBound)
          const yMax = scale(value + highBound)

          if (yMin != null && yMax != null) {
            lineCoordinates.push({ x1: xMin, y1: yMax, x2: xMax, y2: yMax })
            lineCoordinates.push({ x1: xMid, y1: yMin, x2: xMid, y2: yMax })
            lineCoordinates.push({ x1: xMin, y1: yMin, x2: xMax, y2: yMin })
          }
        }

        return (
          <Layer class="v-charts-error-bar" key={`bar-${x}-${y}-${value}-${dataIndex}`}>
            {lineCoordinates.map((c, lineIndex) => (
              <line
                key={`errorbar-${dataIndex}-${c.x1}-${c.y1}-${c.x2}-${c.y2}-${lineIndex}`}
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke={props.stroke}
                stroke-width={props.strokeWidth}
              />
            ))}
          </Layer>
        )
      })

      return <Layer class="v-charts-error-bars">{errorBars}</Layer>
    }
  },
})

export const ErrorBar = defineComponent({
  name: 'ErrorBar',
  props: ErrorBarVueProps,
  setup(props, { attrs, slots }) {
    const layout = useChartLayout()
    // Register this ErrorBar's settings into the parent's registry so the graphical item
    // can report them to chart state, allowing axis domain to extend for error bar ranges.
    const registry = useErrorBarRegistry(null)
    if (registry) {
      const direction: ErrorBarDirection = props.direction ?? (layout.value === 'horizontal' ? 'y' : 'x')
      const settings: ErrorBarsSettings = { direction, dataKey: props.dataKey! }
      registry.register(settings)
      onUnmounted(() => registry.unregister(settings))
    }

    const View = useDeferredView(ErrorBarView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
