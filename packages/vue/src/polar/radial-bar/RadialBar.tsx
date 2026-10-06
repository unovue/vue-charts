import { useLegendHiddenProps } from '@/hooks/useLegendHiddenProps'
import { radialBarEvents } from '@/events/itemEvents'
import { Fragment, computed, defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useChart } from '@/model/chart'
import { getBandSizeOfAxis } from '@/core/axis/scale'
import { getBaseValueOfBar } from '@/core/coordinates'
import { barPositions, barSizeList, stackedData as getStackedData } from '@/core/barSizing'
import type { RadialBarDataItem } from '@/types/radialBar'
import type { RadialBarSettings } from '@/core/radialBar'
import { computeRadialBarDataItems, radialBarLegend } from '@/core/radialBar'
import { Layer } from '@/container/Layer'
import { Sector } from '@/shape/Sector'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { LabelList } from '@/components/label/LabelList'
import { provideCartesianLabelListData } from '@/context/cartesianLabelListContext'
import { interpolate } from '@/utils/data-utils'
import { RadialBarVueProps } from './type'

function getLegendItemColor(stroke: string | undefined, fill: string | undefined): string | undefined {
  return fill
}

const RadialBarView = defineComponent({
  name: 'RadialBarView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof RadialBarVueProps>>, required: true },
    svgAttrs: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(view, { slots }) {
    const emit = radialBarEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const tooltip = useChart().tooltip

    const radialBarSettings = computed<RadialBarSettings>(() => ({
      dataKey: props.dataKey,
      minPointSize: props.minPointSize,
      stackId: props.stackId,
      maxBarSize: props.maxBarSize,
      barSize: props.barSize,
    }))

    const chart = useChart()
    const radiusAxis = computed(() => chart.axis('radiusAxis', props.radiusAxisId))
    const angleAxis = computed(() => chart.axis('angleAxis', props.angleAxisId))
    const radiusTicks = computed(() => radiusAxis.value.graphicalTicks.value ?? undefined)
    const angleTicks = computed(() => angleAxis.value.ticks.value ?? undefined)
    const categoricalAxis = computed(() => chart.inputs.layout() === 'centric' ? angleAxis.value : radiusAxis.value)
    const categoricalTicks = computed(() => chart.inputs.layout() === 'centric' ? angleTicks.value : radiusTicks.value)
    const numericAxis = computed(() => chart.inputs.layout() === 'centric' ? radiusAxis.value : angleAxis.value)
    const bandSize = computed(() => getBandSizeOfAxis(categoricalAxis.value.withScale.value, categoricalTicks.value))
    const barBandSize = computed(() => getBandSizeOfAxis(
      categoricalAxis.value.withScale.value,
      categoricalTicks.value,
      true,
    ) ?? props.maxBarSize ?? chart.options.value.maxBarSize ?? 0)
    const visibleBars = computed(() => chart.items.polar.entries.value.filter(item =>
      item.type === 'radialBar' && !item.hide && (chart.inputs.layout() === 'centric'
        ? item.angleAxisId === props.angleAxisId
        : item.radiusAxisId === props.radiusAxisId),
    ))
    // Polar charts retain their existing percentage-size fallback (no total category size).
    const sizeList = computed(() => barSizeList(visibleBars.value, chart.options.value.barSize))
    const positions = computed(() => barPositions(
      sizeList.value,
      chart.options.value.maxBarSize!,
      chart.options.value.barGap,
      chart.options.value.barCategoryGap,
      barBandSize.value,
      bandSize.value,
      props.maxBarSize,
    ))
    const position = computed(() => positions.value?.find(item =>
      item.stackId === props.stackId && item.dataKeys.includes(props.dataKey!),
    )?.position)
    const stackedData = computed(() => getStackedData(numericAxis.value.stackGroups.value, radialBarSettings.value))
    const sectors = computed(() => {
      const radius = radiusAxis.value.withScale.value
      const angle = angleAxis.value.withScale.value
      const viewport = chart.polarLayout.viewBox.value
      const { chartData, dataStartIndex, dataEndIndex } = chart.dataRange.state.value
      const band = bandSize.value
      const pos = position.value
      const radialTicks = radiusTicks.value
      const angularTicks = angleTicks.value
      const layout = chart.inputs.layout()
      if (!radius || !angle || !chartData || band == null || !pos || !viewport
        || !radialTicks || !angularTicks || (layout !== 'centric' && layout !== 'radial')) {
        return undefined
      }
      const numeric = layout === 'centric' ? radius : angle
      return computeRadialBarDataItems({
        angleAxis: angle,
        angleAxisTicks: angularTicks,
        bandSize: band,
        baseValue: getBaseValueOfBar({ numericAxis: numeric }),
        cx: viewport.cx,
        cy: viewport.cy,
        dataKey: props.dataKey,
        dataStartIndex,
        displayedData: chartData.slice(dataStartIndex, dataEndIndex + 1),
        endAngle: viewport.endAngle,
        layout,
        minPointSize: props.minPointSize,
        pos,
        radiusAxis: radius,
        radiusAxisTicks: radialTicks,
        stackedData: stackedData.value,
        stackedDomain: stackedData.value ? numeric.scale.domain() : null,
        startAngle: viewport.startAngle,
      })
    })

    useChart().tooltip.entries.register(computed(() => ({
      dataDefinedOnItem: undefined,
      positions: undefined,
      settings: {
        dataKey: props.dataKey,
        nameKey: undefined,
        name: props.name ?? String(props.dataKey ?? ''),
        hide: props.hide,
        type: props.tooltipType,
        color: getLegendItemColor(props.stroke, props.fill),
        fill: props.fill,
        stroke: props.stroke,
        unit: '',
      },
    })))

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const { items } = useKeyedTransition(() => sectors.value?.map((sector, index) => ({ ...sector, index })), {
      key: (sector, index) => sector.payload?.name ?? index,
      interpolate: (from, to, t) => ({
        ...to,
        startAngle: interpolate(from.startAngle ?? 0, to.startAngle ?? 0, t),
        endAngle: interpolate(from.endAngle, to.endAngle, t),
        innerRadius: interpolate(from.innerRadius ?? 0, to.innerRadius ?? 0, t),
        outerRadius: interpolate(from.outerRadius ?? 0, to.outerRadius ?? 0, t),
      }),
      enterFrom: to => ({ ...to, endAngle: to.startAngle ?? 0 }),
      exitTo: from => ({ ...from, endAngle: from.startAngle ?? 0 }),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onEnd: callbacks.onEnd,
      onStart: callbacks.onStart,

    })

    // Labels ride along with the bars as drawn, show the new values at once and fade with bars
    // that enter or leave.
    provideCartesianLabelListData(computed(() => {
      if (items.value.length === 0)
        return undefined
      const defaultFill = props.fill
      return items.value.map((item) => {
        const sector = item.value
        const opacity = labelOpacity(item)
        return {
          key: item.key,
          ...(opacity != null ? { opacity } : {}),
          value: sector.value ?? '',
          payload: sector.payload,
          parentViewBox: undefined,
          fill: (sector as any).fill ?? defaultFill,
          cx: sector.cx,
          cy: sector.cy,
          innerRadius: sector.innerRadius,
          outerRadius: sector.outerRadius,
          startAngle: sector.startAngle,
          endAngle: sector.endAngle,
          clockWise: false,
        }
      })
    }))

    const renderSectors = (sectorData: RadialBarDataItem[]) => {
      const defaultFill = props.fill
      const defaultStroke = props.stroke
      const showBackground = !!props.background
      const backgroundProps = typeof props.background === 'object' ? props.background : {}

      return (
        <Layer class="v-charts-radial-bar">
          {showBackground && sectors.value?.map((sector, i) => {
            if (!sector.background)
              return null
            const bg = sector.background
            return (
              <Sector
                key={`bg-${sector.payload?.name ?? i}`}
                cx={bg.cx}
                cy={bg.cy}
                innerRadius={bg.innerRadius}
                outerRadius={bg.outerRadius}
                startAngle={bg.startAngle}
                endAngle={bg.endAngle}
                cornerRadius={props.cornerRadius}
                forceCornerRadius={props.forceCornerRadius}
                cornerIsExternal={props.cornerIsExternal}
                fill="var(--v-charts-muted, #eee)"
                fill-opacity={0.5}
                {...backgroundProps}
              />
            )
          })}
          {sectorData.map((sector, i) => {
            if (sector.innerRadius == null || sector.outerRadius == null
              || sector.startAngle == null || sector.endAngle == null) {
              return null
            }
            const sectorFill = (sector as any).fill ?? defaultFill
            const onMouseenter = (event: MouseEvent) => {
              tooltip.setActiveMouseOverItemIndex({
                activeIndex: String(sector.index),
                activeDataKey: props.dataKey,
              })
              emit('mouseenter', sector, sector.index, event)
            }
            const onMouseleave = (event: MouseEvent) => {
              tooltip.mouseLeaveItem()
              emit('mouseleave', sector, sector.index, event)
            }
            return (
              <Sector
                key={items.value[i].key}
                cx={sector.cx}
                cy={sector.cy}
                innerRadius={sector.innerRadius}
                outerRadius={sector.outerRadius}
                startAngle={sector.startAngle}
                endAngle={sector.endAngle}
                cornerRadius={props.cornerRadius}
                forceCornerRadius={props.forceCornerRadius}
                cornerIsExternal={props.cornerIsExternal}
                fill={sectorFill}
                fill-opacity={props.fillOpacity}
                stroke={defaultStroke ?? sectorFill}
                stroke-width={props.strokeWidth}
                stroke-dasharray={props.strokeDasharray}
                onMouseenter={onMouseenter}
                onMouseleave={onMouseleave}
                onClick={(event: MouseEvent) => { tooltip.setActiveClickItemIndex({ activeIndex: String(sector.index), activeDataKey: props.dataKey }); emit('click', sector, sector.index, event) }}
              />
            )
          })}
        </Layer>
      )
    }

    return () => {
      if (props.hide)
        return null

      const data = items.value
      if (data.length === 0)
        return null

      const labelEl = props.label
        ? <LabelList {...(typeof props.label === 'object' ? props.label : {})} />
        : null
      const slotChildren = slots.default?.()

      return (
        <Fragment>
          {renderSectors(items.value.map(item => item.value))}
          {labelEl}
          {slotChildren}
        </Fragment>
      )
    }
  },
})

export const RadialBar = defineComponent({
  name: 'RadialBar',
  emits: radialBarEvents.emits,
  props: RadialBarVueProps,
  inheritAttrs: false,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useLegendHiddenProps(inputProps)
    radialBarEvents.provide(emit)
    useChart().items.polar.register(computed(() => ({
      type: 'radialBar' as const,
      data: undefined,
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: props.angleAxisId,
      radiusAxisId: props.radiusAxisId,
      barSize: props.barSize,
      stackId: props.stackId,
      minPointSize: props.minPointSize,
      maxBarSize: props.maxBarSize,
    })))

    const chart = useChart()
    const legendPayload = computed(() => radialBarLegend(chart.data.value, props.legendType))
    // Rows without their own fill are drawn in the series colour; their legend icons match.
    useChart().legend.entries.register(computed(() => (legendPayload.value ?? []).map(entry => ({ ...entry, color: entry.color ?? props.fill, dataKey: props.dataKey, inactive: props.hide }))))

    const View = useDeferredView(RadialBarView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
