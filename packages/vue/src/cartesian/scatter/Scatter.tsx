import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { scatterEvents } from '@/events/itemEvents'
import type { ExtractPropTypes, PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { selectActiveTooltipDataKey, selectActiveTooltipIndex, useChartTooltip } from '@/state/chartContext'
import type { ValueAnimationTransition } from 'motion-dom'
import { useScatter } from './hooks/useScatter'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { Layer } from '@/container/Layer'
import { Symbols } from '@/shape/Symbols'
import type { SymbolType, SymbolsProps } from '@/shape/Symbols'
import { Curve } from '@/shape/Curve'
import type { CurveType } from '@/shape/Curve'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { LabelList } from '@/components/label/LabelList'
import type { DataKey } from '@/types'
import type { TooltipType } from '@/types/tooltip'
import type { ScatterPointItem } from '@/types/common'
import type { ErrorBarDirection } from '@/types/bar'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { getLinearRegression } from '@/utils/getLinearRegression'
import { getTooltipNameProp, getValueByDataKey } from '@/utils/chart'
import { useAppSelector } from '@/state/hooks'
import { createErrorBarRegistry, provideErrorBarContext, provideErrorBarRegistry } from '@/cartesian/error-bar/ErrorBarContext'
import type { ErrorBarDataPointFormatter } from '@/cartesian/error-bar/ErrorBarContext'

const interpolateNumber = (from: number, to: number) => (t: number) => from + (to - from) * t

const errorBarDataPointFormatter: ErrorBarDataPointFormatter<ScatterPointItem> = (
  dataPoint: ScatterPointItem,
  dataKey: DataKey<any>,
  direction: ErrorBarDirection,
) => ({
  x: dataPoint.cx,
  y: dataPoint.cy,
  value: direction === 'x' ? Number(dataPoint.node.x) : Number(dataPoint.node.y),
  errorVal: getValueByDataKey(dataPoint.payload, dataKey),
})

const ScatterVueProps = {
  xAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  yAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  zAxisId: { type: [String, Number] as PropType<string | number>, default: 0 },
  dataKey: { type: [String, Number, Function] as PropType<DataKey<any>>, default: undefined },
  data: { type: Array as PropType<ReadonlyArray<Record<string, any>>>, default: undefined },
  name: { type: [String, Number] as PropType<string | number>, default: undefined },
  hide: { type: Boolean, default: false },
  fill: { type: String, default: undefined },
  shape: { type: String as PropType<SymbolType>, default: 'circle' },
  isAnimationActive: { type: Boolean, default: true },
  line: { type: [Boolean, Object], default: false },
  lineType: { type: String as PropType<'fitting' | 'joint'>, default: 'joint' },
  lineJointType: { type: [String, Function] as PropType<CurveType>, default: 'linear' },
  label: { type: [Boolean, Object], default: false },
  legendType: { type: String, default: 'circle' },
  tooltipType: { type: String as PropType<TooltipType>, default: undefined },
  transition: { type: Object as PropType<ValueAnimationTransition<number>>, default: undefined },
}

const ScatterView = defineComponent({
  name: 'ScatterView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof ScatterVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
  },
  slots: Object as SlotsType<{
    shape?: (props: ScatterPointItem & { index: number, isActive: boolean }) => import('vue').VNodeChild
    default?: () => any
  }>,
  setup(view, { slots }) {
    const emit = scatterEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const trackedProps = proxyRefs({ ...toRefs(props), data })
    const { shouldRender, points } = useScatter(trackedProps)
    const svgAttrs = attrs as SVGAttributes
    const tooltip = useChartTooltip()
    const activeIndex = useAppSelector(selectActiveTooltipIndex)
    const activeDataKey = useAppSelector(selectActiveTooltipDataKey)

    // Scatter needs custom tooltip: each computed scatter point has a tooltipPayload array
    // with per-axis name/unit/value. We pass these arrays as dataDefinedOnItem so that
    // arrayTooltipSearcher returns the tooltipPayload array for the active index,
    // which combineTooltipPayload processes into per-axis tooltip entries.
    const tooltipConfiguration = computed(() => ({
      // This owned array contains payloads that reference caller-owned rows.
      dataDefinedOnItem: points.value?.map(point => point.tooltipPayload),
      positions: points.value?.map(point => point.tooltipPosition),
      settings: {
        stroke: svgAttrs.stroke as string,
        strokeWidth: svgAttrs['stroke-width'] as string | number | undefined,
        fill: svgAttrs.fill as string ?? props.fill,
        dataKey: props.dataKey,
        nameKey: undefined,
        name: getTooltipNameProp(props.name, props.dataKey),
        hide: props.hide,
        type: props.tooltipType,
        color: svgAttrs.fill as string ?? props.fill,
        unit: '',
      },
    }))
    tooltip.entries.register(tooltipConfiguration)

    provideErrorBarContext({
      data: points,
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
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
        isActive: () => props.isAnimationActive,
        transition: () => props.transition,
        ...callbacks,
      })
    }

    const dispatchScatterHover = (point: ScatterPointItem, index: number) => {
      const payload = {
        activeDataKey: props.dataKey,
        activeIndex: String(index),
        activeCoordinate: point.tooltipPosition,
      }
      // Dispatch to both axis and item interaction so Scatter works in both
      // ComposedChart (tooltipEventType='axis') and ScatterChart (tooltipEventType='item')
      tooltip.setMouseOverAxisIndex(payload)
      tooltip.setActiveMouseOverItemIndex(payload)
    }
    const onMouseLeaveSymbol = () => {
      tooltip.mouseLeaveChart()
    }

    const renderSymbols = (data: ReadonlyArray<ScatterPointItem>, svgAttrs: SVGAttributes) => {
      const currentActiveIndex = activeIndex.value
      const currentActiveDataKey = activeDataKey.value

      return data.map((point, i) => {
        if (point.cx == null || point.cy == null) {
          return null
        }
        const keyboard = tooltip.state.value.keyboardInteraction
        const isActive = keyboard.active
          ? keyboard.configuration === tooltipConfiguration.value && keyboard.index === String(i)
          : currentActiveIndex === String(i) && currentActiveDataKey === props.dataKey
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
            onMouseenter={(event: MouseEvent) => { dispatchScatterHover(point, i); emit('mouseenter', point, i, event) }}
            onMousemove={(e: MouseEvent) => {
              // Stop propagation to prevent SVG-level mousemove from overriding
              // our per-dot index with the axis-computed index
              e.stopPropagation()
              dispatchScatterHover(point, i)
            }}
            onMouseleave={(event: MouseEvent) => { onMouseLeaveSymbol(); emit('mouseleave', point, i, event) }}
            onClick={(event: MouseEvent) => { tooltip.setActiveClickItemIndex({ activeIndex: String(i), activeDataKey: props.dataKey, activeCoordinate: point.tooltipPosition }); emit('click', point, i, event) }}
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
        <Layer class="v-charts-scatter">
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
  slots: Object as SlotsType<{
    shape?: (props: ScatterPointItem & { index: number, isActive: boolean }) => import('vue').VNodeChild
    default?: () => any
  }>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    scatterEvents.provide(emit)
    const errorBarRegistry = createErrorBarRegistry()
    provideErrorBarRegistry(errorBarRegistry)
    const data = useSetupGraphicalItem(props as any, 'scatter', { skipTooltip: true, errorBars: errorBarRegistry.errorBars })
    return () => h(ScatterView, { item: props, svgAttrs: attrs, data }, slots)
  },
})

// Preserve template slot inference in published declarations.
export const Scatter: typeof _Scatter & { new (): { $slots: { default?: () => import('vue').VNode[], shape?: (props: ScatterPointItem & { index: number, isActive: boolean }) => import('vue').VNodeChild } } } = _Scatter
