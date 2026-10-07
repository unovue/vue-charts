import type { ComputedRef, PropType, SVGAttributes, ShallowRef, SlotsType, VNode, VNodeChild } from 'vue'
import { useSeriesProps } from '@/hooks/useSeriesProps'
import { pieEvents } from '@/events/itemEvents'
import { delegateItemEvents } from '@/events/delegateItemEvents'
import { computed, defineComponent, h, shallowRef } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useTrackedData } from '@/hooks/useTrackedData'
import { useChart } from '@/model/chart'
import { Layer } from '@/container/Layer'
import { Sector } from '@/shape/Sector'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { labelOpacity } from '@/animation/ridingLabels'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { assignCells, extractCellProps, filterOutCells } from '@/utils/cell'
import { entryColor } from '@/core/color'

type CellProps = ReturnType<typeof extractCellProps>[number]
import type { PieSectorDataItem, ResolvedPieSettings } from '@/core/pie'
import { computePieSectors, pieLegend } from '@/core/pie'
import { polarToCartesian } from '@/utils/polar'
import type { PieInput } from './type'
import { PieVueProps } from './type'

const LABEL_OFFSET = 20
/** Horizontal distance from the centre over which a label's anchor blends from start to end. */
const ANCHOR_BLEND = 8

export interface PieSlots {
  label?: (props: PieSectorDataItem & { index: number }) => VNodeChild
  activeShape?: (props: PieSectorDataItem & { isActive: boolean }) => VNodeChild
  shape?: (props: PieSectorDataItem & { isActive: boolean }) => VNodeChild
  default?: () => VNode[]
}

const PieView = defineComponent({
  name: 'PieView',
  inheritAttrs: false,
  props: {
    item: { type: Object as PropType<PieInput>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes>, required: true },
    data: { type: Object as PropType<ShallowRef<unknown[] | undefined>>, required: true },
    pieSettings: { type: Object as PropType<ComputedRef<ResolvedPieSettings>>, required: true },
    cells: { type: Object as PropType<ShallowRef<CellProps[]>>, required: true },
  },
  slots: Object as SlotsType<Omit<PieSlots, 'default'> & { default?: () => VNode[] }>,
  setup(view, { slots }) {
    const emit = pieEvents.use()
    const props = view.item
    const attrs = view.svgAttrs
    const data = view.data
    const pieSettings = view.pieSettings
    const cells = view.cells
    const tooltip = useChart().tooltip
    const chart = useChart()
    const displayedData = computed(() => data.value?.length ? data.value : chart.data.value)
    const sectors = computed(() => displayedData.value == null
      ? undefined
      : computePieSectors({
          offset: chart.offset.value,
          pieSettings: pieSettings.value,
          displayedData: displayedData.value,
        }))

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    let appeared = false
    const { items } = useKeyedTransition(() => sectors.value?.map((sector, index) => ({ ...sector, index })), {
      key: (sector, index) => sector.name ?? index,
      connected: true,
      interpolate: (from, to, t) => ({ ...to, startAngle: from.startAngle + (to.startAngle - from.startAngle) * t, endAngle: from.endAngle + (to.endAngle - from.endAngle) * t, innerRadius: from.innerRadius + (to.innerRadius - from.innerRadius) * t, outerRadius: from.outerRadius + (to.outerRadius - from.outerRadius) * t, paddingAngle: from.paddingAngle + (to.paddingAngle - from.paddingAngle) * t }),
      enterFrom: (to, { previous, next }) => {
        const angle = appeared ? previous?.endAngle ?? next?.startAngle ?? to.startAngle : sectors.value?.[0]?.startAngle ?? to.startAngle
        return { ...to, startAngle: angle, endAngle: angle, paddingAngle: 0 }
      },
      exitTo: (from, { previous, next }) => {
        const angle = previous?.endAngle ?? next?.startAngle ?? from.startAngle
        return { ...from, startAngle: angle, endAngle: angle, paddingAngle: 0 }
      },
      isActive: () => props.isAnimationActive ?? true,
      transition: () => props.transition,
      onEnd: callbacks.onEnd,

      onStart: () => {
        callbacks.onStart()
        if (sectors.value?.length)
          appeared = true
      },
    })

    const tooltipConfiguration = computed(() => ({
      model: { index: () => props.activeIndex, request: (index: number | null) => emit('update:activeIndex', index) },
      dataDefinedOnItem: displayedData.value ?? [],
      positions: sectors.value?.map(s => s.tooltipPosition),
      colors: sectors.value?.map((sector, index) => entryColor({ cell: cells.value[index], row: sector.payload, seriesFill: props.fill, index })),
      settings: {
        dataKey: props.dataKey,
        nameKey: props.nameKey,
        name: String(props.dataKey ?? ''),
        hide: props.hide,
        type: props.tooltipType,
        color: props.fill,
        fill: props.fill,
        stroke: props.stroke,
        unit: '',
      },
    }))
    tooltip.entries.register(tooltipConfiguration)
    const activeIndex = tooltip.activeIndexFor(tooltipConfiguration)

    // Hoisted event handlers — stable closures, not recreated per animation frame
    function handleSectorEnter(sector: PieSectorDataItem, index: number) {
      tooltip.activate('hover', {
        type: 'item',
        configuration: tooltipConfiguration.value,
        index,
        dataKey: props.dataKey,
        coordinate: sector.tooltipPosition,
      })
    }

    function handleSectorLeave() {
      tooltip.clear('hover')
    }
    let sectorList = items.value
    const listeners = delegateItemEvents(position => sectorList[position]?.value, {
      click: (sector, _position, event) => {
        tooltip.activate('click', {
          type: 'item',
          configuration: tooltipConfiguration.value,
          index: sector.index,
          dataKey: props.dataKey,
          coordinate: sector.tooltipPosition,
        })
        emit('click', sector, sector.index, event)
      },
      mouseenter: (sector, _position, event) => {
        handleSectorEnter(sector, sector.index)
        emit('mouseenter', sector, sector.index, event)
      },
      mouseleave: (sector, _position, event) => {
        handleSectorLeave()
        emit('mouseleave', sector, sector.index, event)
      },
    })

    // Labels ride along with the sectors as drawn (their angle follows the moving sector), show
    // the new value at once and fade with sectors that enter or leave.
    function renderLabel(sector: PieSectorDataItem, index: number, key: PropertyKey, opacity: number | undefined) {
      const midAngle = (sector.startAngle + sector.endAngle) / 2
      const edgePoint = rounded(polarToCartesian(sector.cx, sector.cy, sector.outerRadius, midAngle))
      const pos = rounded(polarToCartesian(sector.cx, sector.cy, sector.outerRadius + LABEL_OFFSET, midAngle))
      // Right of the centre a label starts at its point, left of it it ends there. Near the
      // vertical it slides between the two by a share of its own width, so a label travelling
      // round the pie does not jump by its width when it crosses.
      const towardEnd = Math.min(1, Math.max(0, 0.5 - (pos.x - sector.cx) / (2 * ANCHOR_BLEND)))
      const anchor = towardEnd === 0 ? 'start' : towardEnd === 1 ? 'end' : towardEnd === 0.5 ? 'middle' : 'start'
      const slide = anchor === 'start' && towardEnd > 0
        ? { transformBox: 'fill-box' as const, transform: `translateX(${-Math.round(towardEnd * 1000) / 10}%)` }
        : undefined
      return (
        <g key={`label-${String(key)}`} opacity={opacity}>
          {props.labelLine && (
            <line
              x1={edgePoint.x}
              y1={edgePoint.y}
              x2={pos.x}
              y2={pos.y}
              stroke={sector.fill}
              fill="none"
            />
          )}
          {slots.label
            ? slots.label({ ...sector, midAngle, index })
            : (
                <text
                  x={pos.x}
                  y={pos.y}
                  text-anchor={anchor}
                  style={slide}
                  dominant-baseline="middle"
                  fill={sector.fill}
                >
                  {String(sector.value)}
                </text>
              )}
        </g>
      )
    }

    return () => {
      if (props.hide)
        return null
      // Cell fills override the entry/pie fill. Slots are read here, during render, so their
      // dependencies are tracked and server rendering sees them too.
      const children = slots.default?.() ?? []
      assignCells(cells, extractCellProps(children))
      // Events read this exact render's sectors, including Cell fill overrides.
      sectorList = cells.value.length
        ? items.value.map(item => ({ ...item, value: { ...item.value, fill: entryColor({ cell: cells.value[item.value.index], row: item.value.payload, seriesFill: props.fill, index: item.value.index }) } }))
        : items.value
      if (!sectorList || sectorList.length === 0) {
        return null
      }
      const stroke = props.stroke
      return (
        <Layer data-slot="series" class={['v-charts-pie', props.class]} {...listeners}>
          {sectorList.map(({ key, value: sector }, position) => {
            const animatedStartAngle = sector.startAngle
            const animatedEndAngle = sector.endAngle
            const shapeProps = { ...sector, startAngle: animatedStartAngle, endAngle: animatedEndAngle, stroke, isActive: activeIndex.value === sector.index }
            const shapeSlot = shapeProps.isActive && slots.activeShape ? slots.activeShape : slots.shape
            const content = shapeSlot
              ? shapeSlot(shapeProps)
              : (
                  <Sector
                    {...attrs}
                    cx={sector.cx}
                    cy={sector.cy}
                    innerRadius={sector.innerRadius}
                    outerRadius={sector.outerRadius}
                    startAngle={animatedStartAngle}
                    endAngle={animatedEndAngle}
                    fill={sector.fill}
                    stroke={stroke}
                  />
                )

            return (
              <g
                key={key}
                data-v-charts-item-index={position}
              >
                {content}
              </g>
            )
          })}
          {filterOutCells(children)}
          {(props.label || slots.label) && sectorList.map((item, index) => renderLabel(item.value, index, item.key, labelOpacity(item)))}
        </Layer>
      )
    }
  },
})

/**
 * Node and browsers can differ in the last digit of sin/cos; rounding to 1/1000 px keeps the
 * server's label positions identical to the client's, so hydration matches.
 */
function rounded({ x, y }: { x: number, y: number }) {
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }
}

export const Pie = defineComponent({
  name: 'Pie',
  emits: pieEvents.emits,
  props: PieVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<Omit<PieSlots, 'default'> & { default?: () => VNode[] }>,
  setup(inputProps, { attrs, slots, emit }) {
    const props = useSeriesProps(inputProps)
    pieEvents.provide(emit)
    const data = useTrackedData(() => props.data)
    const pieSettings = computed<ResolvedPieSettings>(() => ({
      data: data.value,
      dataKey: props.dataKey,
      nameKey: props.nameKey,
      cx: props.cx,
      cy: props.cy,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
      startAngle: props.startAngle,
      endAngle: props.endAngle,
      paddingAngle: props.paddingAngle,
      minAngle: props.minAngle,
      fill: props.fill,
      legendType: props.legendType,
      tooltipType: props.tooltipType,
      presentationProps: {},
    }))

    useChart().items.polar.register(computed(() => ({
      stackId: undefined,
      barSize: undefined,
      type: 'pie' as const,
      data: data.value ?? [],
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: 0,
      radiusAxisId: 0,
    })))

    const chart = useChart()
    const cells = shallowRef<CellProps[]>([])
    const legendPayload = computed(() => pieLegend(
      data.value?.length ? data.value : chart.data.value,
      pieSettings.value,
      cells.value,
    ))
    useChart().legend.entries.register(computed(() => (legendPayload.value ?? []).map(entry => ({ ...entry, dataKey: props.dataKey, inactive: props.hide }))))

    const View = useDeferredView(PieView)
    return () => h(View, { item: props, svgAttrs: attrs, data, pieSettings, cells }, slots)
  },
})
