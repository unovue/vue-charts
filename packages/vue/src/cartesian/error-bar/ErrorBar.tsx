import { computed, defineComponent, h, onUnmounted } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { Layer } from '@/container/Layer'
import { useErrorBarContext, useErrorBarRegistry } from './ErrorBarContext'
import { useChart } from '@/model/chart'
import { errorBarLines } from '@/core/errorBar'
import { useChartLayout } from '@/context/chartLayoutContext'
import type { ErrorBarDirection } from '@/types/bar'
import type { ErrorBarsSettings } from '@/types/graphical'

export const ErrorBarVueProps = {
  dataKey: { type: [String, Number, Function] as PropType<string | number | ((obj: unknown) => unknown)>, required: true as const },
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
    const context = useErrorBarContext()
    const chart = useChart()
    const errorBars = computed(() => {
      const direction = props.direction ?? (layout.value === 'horizontal' ? 'y' : 'x')
      const axis = direction === 'x'
        ? chart.axis('xAxis', context.xAxisId).withScale.value
        : chart.axis('yAxis', context.yAxisId).withScale.value
      if (!axis || !context.data.value)
        return undefined
      return context.data.value.map((entry, index) => {
        const point = context.dataPointFormatter(entry, props.dataKey!, direction)
        const lines = errorBarLines(point, axis, direction, context.errorBarOffset.value, props.width)
        return { point, lines, index }
      })
    })

    return () => {
      if (!errorBars.value)
        return null
      return (
        <Layer class="v-charts-error-bars">
          {errorBars.value.map(({ point: { x, y, value }, lines, index }) => lines && (
            <Layer class="v-charts-error-bar" key={`bar-${x}-${y}-${value}-${index}`}>
              {lines.map((line, lineIndex) => (
                <line
                  key={`errorbar-${index}-${line.x1}-${line.y1}-${line.x2}-${line.y2}-${lineIndex}`}
                  {...line}
                  stroke={props.stroke}
                  stroke-width={props.strokeWidth}
                />
              ))}
            </Layer>
          ))}
        </Layer>
      )
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
