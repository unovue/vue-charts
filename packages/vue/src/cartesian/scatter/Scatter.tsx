import type { ExtractPropTypes, PropType, SVGAttributes, ShallowRef, SlotsType } from 'vue'
import { useLayerTeleport } from '@/hooks/useLayerTeleport'
import { Fragment, computed, defineComponent, h, proxyRefs, toRefs } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useChartTooltip } from '@/state/chartContext'
import type { ValueAnimationTransition } from 'motion-dom'
import { useScatter } from './hooks/useScatter'
import { useSetupGraphicalItem } from '@/hooks/useSetupGraphicalItem'
import { Layer } from '@/container/Layer'
import { Symbols } from '@/shape/Symbols'
import type { SymbolType, SymbolsProps } from '@/shape/Symbols'
import { Curve } from '@/shape/Curve'
import type { CurveType } from '@/shape/Curve'
import { useGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { LabelList } from '@/components/label'
import type { DataKey } from '@/types'
import type { TooltipType } from '@/types/tooltip'
import type { ScatterPointItem } from '@/types/common'
import type { ErrorBarDirection } from '@/types/bar'
import { Animate } from '@/animation/Animate'
import { getLinearRegression } from '@/utils/getLinearRegression'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { getTooltipNameProp, getValueByDataKey } from '@/utils/chart'
import { useAppSelector } from '@/state/hooks'
import { selectActiveTooltipDataKey, selectActiveTooltipIndex } from '@/state/selectors/tooltipSelectors'
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
    default?: () => any
  }>,
  setup(view, { slots }) {
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
    SetTooltipEntrySettings({
      fn: input => ({
        // This owned array contains payloads that reference caller-owned rows.
        dataDefinedOnItem: input.points && input.points.map(p => p.tooltipPayload),
        positions: undefined,
        settings: {
          stroke: input.stroke,
          strokeWidth: input.strokeWidth,
          fill: input.fill,
          dataKey: input.dataKey,
          nameKey: undefined,
          name: getTooltipNameProp(input.name, input.dataKey),
          hide: input.hide,
          type: input.tooltipType,
          color: input.fill,
          unit: '',
        },
      }),
      args: computed(() => ({
        points: points.value,
        fill: svgAttrs.fill as string ?? props.fill,
        stroke: svgAttrs.stroke as string,
        strokeWidth: svgAttrs['stroke-width'] as string | number | undefined,
        name: props.name,
        dataKey: props.dataKey,
        hide: props.hide,
        tooltipType: props.tooltipType,
      })),
    })

    provideErrorBarContext({
      data: points,
      xAxisId: props.xAxisId,
      yAxisId: props.yAxisId,
      dataPointFormatter: errorBarDataPointFormatter,
      errorBarOffset: computed(() => 0),
    })

    let previousPoints: ReadonlyArray<ScatterPointItem> | null = null
    let animationId = 0

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
        const isActive = currentActiveIndex === String(i) && currentActiveDataKey === props.dataKey
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
            class="v-charts-scatter-symbol"
            onMouseenter={() => dispatchScatterHover(point, i)}
            onMousemove={(e: MouseEvent) => {
              // Stop propagation to prevent SVG-level mousemove from overriding
              // our per-dot index with the axis-computed index
              e.stopPropagation()
              dispatchScatterHover(point, i)
            }}
            onMouseleave={onMouseLeaveSymbol}
          >
            {Symbols(symbolProps)}
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

    const renderGeometry = () => {
      if (!shouldRender.value) {
        return null
      }

      const svgAttrs = attrs as SVGAttributes
      const data = points.value!
      const isAnimationActive = props.isAnimationActive

      let symbolsContent: any

      if (isAnimationActive && previousPoints !== data) {
        const prevData = previousPoints
        animationId++
        symbolsContent = (
          <Animate
            key={animationId}
            transition={props.transition}
            isActive={isAnimationActive}
          >
            {(t: number) => {
              const stepData: ReadonlyArray<ScatterPointItem> = t === 1
                ? data
                : data.map((entry, index) => {
                    const prev = prevData && prevData[index]
                    if (prev) {
                      return {
                        ...entry,
                        cx: entry.cx == null ? undefined : interpolateNumber(prev.cx ?? 0, entry.cx)(t),
                        cy: entry.cy == null ? undefined : interpolateNumber(prev.cy ?? 0, entry.cy)(t),
                        size: interpolateNumber(prev.size ?? 0, entry.size ?? 0)(t),
                      }
                    }
                    // New point: animate size from 0
                    return { ...entry, size: interpolateNumber(0, entry.size ?? 0)(t) }
                  })

              if (t > 0) {
                previousPoints = stepData
              }
              return (
                <>
                  {renderLine(stepData, svgAttrs)}
                  {renderSymbols(stepData, svgAttrs)}
                </>
              )
            }}
          </Animate>
        )
      }
      else {
        previousPoints = data
        symbolsContent = (
          <>
            {renderLine(data, svgAttrs)}
            {renderSymbols(data, svgAttrs)}
          </>
        )
      }

      return (
        <Fragment>
          {symbolsContent}
          {props.label && (() => {
            const labelData = data.map(point => ({
              x: point.cx ?? 0,
              y: point.cy ?? 0,
              width: 0,
              height: 0,
              value: undefined,
              payload: point.payload,
            }))
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
      setup: () => renderGeometry,
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

export const Scatter = defineComponent({
  name: 'Scatter',
  props: ScatterVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{
    default?: () => any
  }>,
  setup(props, { attrs, slots }) {
    const errorBarRegistry = createErrorBarRegistry()
    provideErrorBarRegistry(errorBarRegistry)
    const data = useSetupGraphicalItem(props as any, 'scatter', { skipTooltip: true, errorBars: errorBarRegistry.errorBars })
    return () => h(ScatterView, { item: props, svgAttrs: attrs, data }, slots)
  },
})
