import { useChartTooltip } from '@/state/chartContext'
import { useTrackedData } from '@/hooks/useTrackedData'
import { computed, defineComponent, ref, watch } from 'vue'
import type { SlotsType } from 'vue'
import { useAppSelector } from '@/state/hooks'
import { Layer } from '@/container/Layer'
import { Sector } from '@/shape/Sector'
import { Animate } from '@/animation/Animate'
import { SetPolarGraphicalItem } from '@/state/SetGraphicalItem'
import { SetLegendPayload } from '@/state/SetLegendPayload'
import { SetTooltipEntrySettings } from '@/state/SetTooltipEntrySettings'
import { extractCellProps } from '@/utils/cell'
import type { PieSectorDataItem, ResolvedPieSettings } from '@/state/selectors/pieSelectors'
import { computePieSectors, selectDisplayedData, selectPieLegend, selectSynchronisedPieSettings } from '@/state/selectors/pieSelectors'
import { selectChartOffset } from '@/state/selectors/selectChartOffset'
import { polarToCartesian } from '@/utils/polar'
import type { PiePropsWithSVG } from './type'
import { PieVueProps } from './type'

const LABEL_OFFSET = 20

export const Pie = defineComponent<PiePropsWithSVG>({
  name: 'Pie',
  props: PieVueProps,
  inheritAttrs: false,
  slots: Object as SlotsType<{
    shape?: (props: PieSectorDataItem & { isActive: boolean }) => any
    default?: () => any
  }>,
  setup(props, { attrs, slots }) {
    const data = useTrackedData(() => props.data)
    const tooltip = useChartTooltip()
    const isControlled = computed(() => props.activeIndex !== -1)
    const activeIndex = ref(props.activeIndex)
    watch(() => props.activeIndex, (val) => {
      activeIndex.value = val
    })

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

    SetPolarGraphicalItem(computed(() => ({
      type: 'pie' as const,
      data: data.value ?? [],
      dataKey: props.dataKey,
      hide: props.hide,
      angleAxisId: 0,
      radiusAxisId: 0,
    })))

    const displayedData = useAppSelector(state => selectDisplayedData(state, pieSettings.value))
    const synchronisedSettings = useAppSelector(state => selectSynchronisedPieSettings(state, pieSettings.value))
    const offset = useAppSelector(state => selectChartOffset(state))

    const legendPayload = useAppSelector(state => selectPieLegend(state, pieSettings.value))
    // Keep Immer from freezing caller-owned rows referenced by legend payloads.
    SetLegendPayload(computed(() => Object.freeze(legendPayload.value ?? [])))

    const sectors = computed(() => {
      if (synchronisedSettings.value == null || displayedData.value == null) {
        return undefined
      }
      const result = computePieSectors({
        offset: offset.value,
        pieSettings: pieSettings.value,
        displayedData: displayedData.value,
      })
      // Cell fills override the selector's entry/pie fill (Bar pattern)
      const cells = extractCellProps(slots.default?.() ?? [])
      if (cells.length === 0) {
        return result
      }
      return result?.map((sector, i) =>
        cells[i]?.fill != null ? { ...sector, fill: cells[i].fill } : sector,
      )
    })

    SetTooltipEntrySettings({
      fn: v => v,
      args: computed(() => ({
        dataDefinedOnItem: displayedData.value ?? [],
        positions: sectors.value?.map(s => s.tooltipPosition),
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
      })),
    })

    // Hoisted event handlers — stable closures, not recreated per animation frame
    function handleSectorEnter(sector: PieSectorDataItem, index: number) {
      if (!isControlled.value) {
        activeIndex.value = index
      }
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: String(index),
        activeDataKey: props.dataKey,
        activeCoordinate: sector.tooltipPosition,
      })
    }

    function handleSectorLeave() {
      if (!isControlled.value) {
        activeIndex.value = -1
      }
      tooltip.mouseLeaveItem()
    }

    function renderLabel(sector: PieSectorDataItem, index: number) {
      const edgePoint = polarToCartesian(sector.cx, sector.cy, sector.outerRadius, sector.midAngle)
      const pos = polarToCartesian(sector.cx, sector.cy, sector.outerRadius + LABEL_OFFSET, sector.midAngle)
      const anchor = pos.x > sector.cx ? 'start' : pos.x < sector.cx ? 'end' : 'middle'
      return (
        <g key={`label-${index}`}>
          <line
            x1={edgePoint.x}
            y1={edgePoint.y}
            x2={pos.x}
            y2={pos.y}
            stroke={sector.fill}
            fill="none"
          />
          <text
            x={pos.x}
            y={pos.y}
            text-anchor={anchor}
            dominant-baseline="middle"
            fill={sector.fill}
          >
            {String(sector.value)}
          </text>
        </g>
      )
    }

    return () => {
      const sectorList = sectors.value
      if (!sectorList || sectorList.length === 0) {
        return null
      }
      const stroke = (attrs.stroke as string) ?? props.stroke
      return (
        <Layer class={['v-charts-pie', props.class]}>
          <Animate isActive={props.isAnimationActive} from={0} to={1} transition={props.transition}>
            {(progress: number) => {
              // Chain animation: curAngle accumulates so all sectors sweep as one continuous arc
              let curAngle = sectorList[0]?.startAngle ?? 0
              const sectorNodes = sectorList.map((sector, i) => {
                const paddingAngle = i > 0 ? sector.paddingAngle : 0
                const deltaAngle = (sector.endAngle - sector.startAngle) * progress
                const animatedStartAngle = curAngle + paddingAngle
                const animatedEndAngle = curAngle + deltaAngle + paddingAngle
                curAngle = animatedEndAngle

                const content = slots.shape
                  ? slots.shape({ ...sector, startAngle: animatedStartAngle, endAngle: animatedEndAngle, stroke, isActive: activeIndex.value === i })
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
                    key={`sector-${i}`}
                    onMouseenter={() => handleSectorEnter(sector, i)}
                    onMouseleave={handleSectorLeave}
                  >
                    {content}
                  </g>
                )
              })

              if (progress >= 1 && props.label) {
                sectorNodes.push(...sectorList.map(renderLabel))
              }

              return sectorNodes
            }}
          </Animate>
        </Layer>
      )
    }
  },
})
