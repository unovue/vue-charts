import type { ExtractPropTypes, PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useChart } from '@/model/chart'
import { useSeriesProps } from '@/hooks/useSeriesProps'
import { scatterEvents } from '@/events/itemEvents'
import { delegateItemEvents, itemEventIndex } from '@/events/delegateItemEvents'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useScatter } from './hooks/useScatter'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { Layer } from '@/container/Layer'
import { Symbols } from '@/shape/Symbols'
import type { SymbolType, SymbolsProps } from '@/shape/Symbols'
import { Curve } from '@/shape/Curve'
import { useGraphicalLayerRef } from '@/model/runtime'
import { LabelList } from '@/components/label/LabelList'
import type { ScatterPointItem } from '@/types/common'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { getLinearRegression } from '@/utils/getLinearRegression'
import { getTooltipNameProp } from '@/core/tooltip'
import { mainColor } from '@/core/color'
import { getValueByDataKey } from '@/utils/chart'
import type { ScatterSlots } from './type'
import { ScatterVueProps } from './type'
import { createErrorBarRegistry, provideErrorBarContext, provideErrorBarRegistry } from '@/cartesian/error-bar/ErrorBarContext'
import type { ErrorBarDataPointFormatter } from '@/cartesian/error-bar/ErrorBarContext'

const interpolateNumber = (from: number, to: number) => (t: number) => from + (to - from) * t

const errorBarDataPointFormatter: ErrorBarDataPointFormatter<unknown> = (
  dataPoint,
  dataKey,
  direction,
) => {
  if (dataPoint == null || typeof dataPoint !== 'object'
    || !('cx' in dataPoint) || !('cy' in dataPoint) || !('node' in dataPoint)
    || (dataPoint.cx !== undefined && typeof dataPoint.cx !== 'number')
    || (dataPoint.cy !== undefined && typeof dataPoint.cy !== 'number')
    || dataPoint.node == null || typeof dataPoint.node !== 'object') {
    throw new Error('vccs: ErrorBar requires Scatter geometry.')
  }
  const node = dataPoint.node
  const value = direction === 'x'
    ? ('x' in node ? node.x : undefined)
    : ('y' in node ? node.y : undefined)
  return {
    x: dataPoint.cx,
    y: dataPoint.cy,
    value: Number(value),
    errorVal: getValueByDataKey('payload' in dataPoint ? dataPoint.payload : undefined, dataKey),
  }
}

const ScatterView = defineComponent({
  name: 'ScatterView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof ScatterVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<ScatterSlots>,
  setup(view, { slots }) {
    const chart = useChart()
    const emit = scatterEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, points } = useScatter(trackedProps)
    const svgAttrs = attrs as SVGAttributes
    const tooltip = chart.tooltip
    // Scatter needs custom tooltip: each computed scatter point has a tooltipPayload array
    // with per-axis name/unit/value. We pass these arrays as dataDefinedOnItem so that
    // the selected row supplies the tooltipPayload array for the active index,
    // which tooltipPayload processes into per-axis tooltip entries.
    const tooltipConfiguration = computed(() => ({
      // This owned array contains payloads that reference caller-owned rows.
      dataDefinedOnItem: points.value?.map(point => point.tooltipPayload),
      positions: points.value?.map(point => point.tooltipPosition),
      settings: {
        stroke: svgAttrs.stroke,
        strokeWidth: svgAttrs['stroke-width'],
        fill: props.fill,
        dataKey: props.dataKey,
        nameKey: undefined,
        name: getTooltipNameProp(props.name, props.dataKey),
        hide: props.hide,
        type: props.tooltipType,
        color: mainColor('scatter', props),
        unit: '',
      },
    }))
    tooltip.entries.register(tooltipConfiguration)
    const activeIndex = tooltip.activeIndexFor(tooltipConfiguration)

    provideErrorBarContext({
      data: points,
      get xAxisId() { return props.xAxisId },
      get yAxisId() { return props.yAxisId },
      dataPointFormatter: errorBarDataPointFormatter,
      errorBarOffset: computed(() => 0),
    })

    const createDisplay = () => {
      const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
      return useKeyedTransition(() => points.value, {
        key: (_point, index) => index,
        interpolate: (from, to, t) => ({
          ...to,
          cx: to.cx == null ? to.cx : interpolateNumber(from.cx ?? to.cx, to.cx)(t),
          cy: to.cy == null ? to.cy : interpolateNumber(from.cy ?? to.cy, to.cy)(t),
          size: interpolateNumber(from.size ?? 0, to.size ?? 0)(t),
        }),
        enterFrom: to => ({ ...to, size: 0 }),
        exitTo: from => ({ ...from, size: 0 }),
        isActive: () => props.isAnimationActive !== false,
        transition: () => props.transition,
        ...callbacks,
      })
    }

    const dispatchScatterHover = (point: ScatterPointItem, index: number) => {
      // No type: the chart's own event type decides, so Scatter works in a ComposedChart
      // (axis) and in a ScatterChart (item); the configuration names this series.
      tooltip.activate('hover', {
        configuration: tooltipConfiguration.value,
        dataKey: props.dataKey,
        index,
        coordinate: point.tooltipPosition,
      })
    }
    const onMouseLeaveSymbol = () => {
      tooltip.clear('hover')
    }
    let symbolData: ReadonlyArray<ScatterPointItem> = []
    const listeners = delegateItemEvents(index => symbolData[index], {
      click: (point, index, event) => {
        tooltip.activate('click', { type: 'item', configuration: tooltipConfiguration.value, index, dataKey: props.dataKey, coordinate: point.tooltipPosition })
        emit('click', point, index, event)
      },
      mouseenter: (point, index, event) => {
        dispatchScatterHover(point, index)
        emit('mouseenter', point, index, event)
      },
      mouseleave: (point, index, event) => {
        onMouseLeaveSymbol()
        emit('mouseleave', point, index, event)
      },
    })
    function handleSymbolMove(event: MouseEvent) {
      const index = itemEventIndex(event)
      const point = index == null ? undefined : symbolData[index]
      if (point && index !== undefined) {
        // Keep the SVG's axis hover handler from replacing the selected Scatter item.
        event.stopPropagation()
        dispatchScatterHover(point, index)
      }
    }

    const renderSymbols = (data: ReadonlyArray<ScatterPointItem>, svgAttrs: SVGAttributes) => {
      symbolData = data
      const currentActiveIndex = activeIndex.value

      return data.map((point, i) => {
        if (point.cx == null || point.cy == null) {
          return null
        }
        const isActive = currentActiveIndex === i
        const symbolProps: SymbolsProps = {
          ...svgAttrs,
          ...(props.fill != null ? { fill: props.fill } : {}),
          cx: point.cx,
          cy: point.cy,
          size: isActive ? (point.size ?? 64) * 1.6 : point.size,
          type: props.shape as SymbolType,
          ...(isActive ? { 'stroke': 'var(--v-charts-background, #fff)', 'stroke-width': 2 } : {}),
        }
        return (
          <g
            key={i}
            class="v-charts-scatter-symbol"
            data-v-charts-item-index={i}
          >
            {slots.shape ? slots.shape({ ...point, index: i, isActive }) : Symbols(symbolProps)}
          </g>
        )
      })
    }

    const renderLine = (data: ReadonlyArray<ScatterPointItem>, svgAttrs: SVGAttributes) => {
      if (!props.line)
        return null

      let linePoints: { x: number, y: number }[]
      if (props.lineType === 'joint') {
        linePoints = data.map(p => ({ x: p.cx ?? 0, y: p.cy ?? 0 }))
      }
      else {
        const { xmin, xmax, a, b } = getLinearRegression(data)
        linePoints = [
          { x: xmin, y: a * xmin + b },
          { x: xmax, y: a * xmax + b },
        ]
      }

      const lineProps = {
        fill: 'none',
        stroke: (svgAttrs.stroke as string) ?? props.fill,
        ...(typeof props.line === 'object' ? props.line : {}),
        points: linePoints,
      }

      return (
        <Layer class="v-charts-scatter-line" style={{ pointerEvents: 'none' }}>
          <Curve {...lineProps} type={props.lineJointType} />
        </Layer>
      )
    }

    const renderGeometry = (display: ReturnType<typeof createDisplay>) => {
      if (!shouldRender.value) {
        return null
      }

      const svgAttrs = attrs as SVGAttributes
      const data = display.items.value.map(item => item.value)
      const symbolsContent = (
        <>
          {renderLine(data, svgAttrs)}
          {renderSymbols(data, svgAttrs)}
        </>
      )

      return (
        <Fragment>
          {symbolsContent}
          {props.label && (() => {
            // Labels ride along with the points as drawn and fade with points that enter or leave.
            const labelData = display.items.value.map((item) => {
              const point = item.value
              const opacity = labelOpacity(item)
              return {
                x: point.cx ?? 0,
                y: point.cy ?? 0,
                width: 0,
                height: 0,
                value: undefined,
                payload: point.payload,
                key: item.key,
                ...(opacity != null ? { opacity } : {}),
              }
            })
            return (
              <LabelList
                {...(typeof props.label === 'object' ? props.label : {})}
                data={labelData}

              />
            )
          })()}
        </Fragment>
      )
    }

    // Default children (notably ErrorBar) must register before any deferred geometry runs.
    // Keep their context in this synchronous shell; defer only the geometry render.
    const Geometry = useDeferredView(defineComponent({
      name: 'ScatterGeometry',
      setup: () => {
        const display = createDisplay()
        return () => renderGeometry(display)
      },
    }))
    const teleport = useLayerTeleport()
    const graphicalLayerRef = useGraphicalLayerRef(null)
    return () => {
      if (props.hide)
        return null
      return teleport((
        <Layer data-slot="series" class={['v-charts-scatter', props.class]} {...listeners} onMousemove={handleSymbolMove}>
          {slots.default?.()}
          {h(Geometry)}
        </Layer>
      ), graphicalLayerRef,
      )
    }
  },
})

const _Scatter = defineComponent({
  name: 'Scatter',
  emits: scatterEvents.emits,
  props: ScatterVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<ScatterSlots>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps, ['fill'])
    scatterEvents.provide(emit)
    const errorBarRegistry = createErrorBarRegistry()
    provideErrorBarRegistry(errorBarRegistry)
    const data = useSetupGraphicalItem(props, 'scatter', { skipTooltip: true, errorBars: errorBarRegistry.errorBars })
    return () => h(ScatterView, { item: props, svgAttrs: attrs, data }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Scatter: typeof _Scatter & { new (): { $slots: ScatterSlots } } = _Scatter
