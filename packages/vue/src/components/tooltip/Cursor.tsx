import { useChartPresentation } from '@/model/presentation'
import { Teleport, computed, defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'
import { useCursorLayerRef } from '@/model/runtime'
import type { TooltipPayload } from '@/types/tooltip'
import type {
  ChartCoordinate,
} from '@/types'
import { Cross } from '@/shape/Cross'
import { Curve } from '@/shape/Curve'
import { Rectangle } from '@/shape/Rectangle'
import { Sector } from '@/shape/Sector'
import { getCursorPoints } from '@/components/utils'
import type { RadialCursorPoints } from '@/components/types'
import type { Point } from '@/shape'

import type { CursorSlotProps } from './types'

export const Cursor = defineComponent({
  name: 'Cursor',
  props: {
    cursor: [Boolean, Object],
    cursorSlot: Function as PropType<(props: CursorSlotProps) => VNode>,
    tooltipEventType: String,
    coordinate: Object as PropType<ChartCoordinate>,
    payload: Array as PropType<TooltipPayload>,
    index: String,
  },
  setup(props) {
    const presentation = useChartPresentation()
    const offset = presentation.offset
    const layout = presentation.layout
    const chartName = presentation.name
    const tooltipAxisBandSize = presentation.bandSize
    const cursorLayerRef = useCursorLayerRef(null)
    const points = computed(() => getCursorPoints(layout.value, props.coordinate!, offset.value))
    return () => {
      if (!props.cursor || !props.coordinate)
        return null

      const isScatterChart = chartName.value === 'ScatterChart'
      if (!isScatterChart && props.tooltipEventType !== 'axis')
        return null

      const cursor = props.cursor
      // Extract user-provided SVG props when cursor is a plain object (not boolean)
      const cursorSvgProps = (typeof cursor === 'object') ? cursor : {}

      let cursorElement: VNode
      if (isScatterChart) {
        const { offset: _offset, ...coord } = props.coordinate!
        const off = offset.value
        const crossProps = {
          stroke: 'var(--v-charts-cursor, #ccc)',
          fill: 'none',
          // spread offset first (matches Recharts), then variant-specific props override
          ...off,
          ...coord,
          class: 'v-charts-tooltip-cursor',
          style: { pointerEvents: 'none' as const },
          payload: props.payload ?? [],
          payloadIndex: props.index,
          ...cursorSvgProps,
        }
        cursorElement = props.cursorSlot ? props.cursorSlot(crossProps) : <Cross {...crossProps} />
      }
      else if (chartName.value === 'BarChart') {
        const bandSize = tooltipAxisBandSize.value ?? 0
        const halfSize = bandSize / 2
        const coord = props.coordinate!
        const off = offset.value
        const rectProps = {
          // spread offset first (matches Recharts), then override with cursor-specific props
          ...off,
          stroke: 'none',
          fill: 'var(--v-charts-cursor, #ccc)',
          x: layout.value === 'horizontal' ? coord.x - halfSize : off.left + 0.5,
          y: layout.value === 'horizontal' ? off.top + 0.5 : coord.y - halfSize,
          width: layout.value === 'horizontal' ? bandSize : off.width - 1,
          height: layout.value === 'horizontal' ? off.height - 1 : bandSize,
          class: 'v-charts-tooltip-cursor',
          style: { pointerEvents: 'none' as const },
          payload: props.payload ?? [],
          payloadIndex: props.index,
          ...cursorSvgProps,
        }
        cursorElement = props.cursorSlot ? props.cursorSlot(rectProps) : <Rectangle {...rectProps} />
      }
      else if (layout.value === 'radial' && props.coordinate?.cx != null) {
        const radialPoints = points.value as RadialCursorPoints
        const off = offset.value
        const sectorProps = {
          stroke: 'var(--v-charts-cursor, #ccc)',
          ...off,
          cx: radialPoints.cx,
          cy: radialPoints.cy,
          startAngle: radialPoints.startAngle,
          endAngle: radialPoints.endAngle,
          innerRadius: radialPoints.radius,
          outerRadius: radialPoints.radius,
          fill: 'none',
          class: 'v-charts-tooltip-cursor',
          style: { pointerEvents: 'none' as const },
          payload: props.payload ?? [],
          payloadIndex: props.index,
          ...cursorSvgProps,
        }
        cursorElement = props.cursorSlot ? props.cursorSlot(sectorProps) : <Sector {...sectorProps} />
      }
      else {
        const off = offset.value
        const cursorProps = {
          stroke: 'var(--v-charts-cursor, #ccc)',
          ...off,
          layout: layout.value,
          points: points.value as ReadonlyArray<Point>,
          class: ['v-charts-tooltip-cursor'],
          style: { pointerEvents: 'none' as const },
          payload: props.payload ?? [],
          payloadIndex: props.index,
          ...cursorSvgProps,
        }
        cursorElement = props.cursorSlot ? props.cursorSlot(cursorProps) : <Curve {...cursorProps} />
      }

      // Teleport cursor into the cursor layer so it renders behind graphical items (bars, lines)
      if (cursorLayerRef?.value) {
        return <Teleport to={cursorLayerRef.value}>{cursorElement}</Teleport>
      }
      return cursorElement
    }
  },
})
