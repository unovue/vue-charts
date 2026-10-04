import { defineComponent, h } from 'vue'
import type { ExtractPropTypes, PropType, SVGAttributes } from 'vue'
import { useDeferredView } from '@/hooks/deferredView'
import { useChartHeight, useChartWidth, useOffset } from '@/context/chartLayoutContext'
import { useIsPanorama } from '@/context/PanoramaContextProvider'
import { useAppSelector } from '@/state/hooks'
import { selectAxisPropsNeededForCartesianGridTicksGenerator } from '@/state/selectors/axisSelectors'
import { isNumber, warn } from '@/utils'
import { resolveDefaultProps } from '@/utils/resolveDefaultProps'
import type { CartesianGridProps, HorizontalCoordinatesGenerator, VerticalCoordinatesGenerator } from './type'
import { getCoordinatesOfGrid } from '@/utils/grid'
import { getTicks } from '@/cartesian/utils/get-ticks'
import { getTicksOfAxis } from '@/utils/chart'
import { CartesianAxis } from '@/cartesian/cartesian-axis/CartesianAxis'
import { CartesianAxisDefaultProps } from '@/cartesian/cartesian-grid/const'
import Background from './Background'
import HorizontalStripes from './HorizontalStripes'
import VerticalStripes from './VerticalStripes'
import HorizontalGridLines from './HorizontalGridLines'
import VerticalGridLines from './VerticalGridLines'

const defaultHorizontalCoordinatesGenerator: HorizontalCoordinatesGenerator = (
  { yAxis, width, height, offset },
  syncWithTicks,
) => getCoordinatesOfGrid(
  getTicks({
    ...CartesianAxisDefaultProps,
    ...yAxis,
    ticks: getTicksOfAxis(yAxis, true)!,
    viewBox: { x: 0, y: 0, width, height },
  }),
  offset.top!,
  offset.top! + offset.height!,
  syncWithTicks,
)

const defaultVerticalCoordinatesGenerator: VerticalCoordinatesGenerator = (
  { xAxis, width, height, offset },
  syncWithTicks,
) => {
  return getCoordinatesOfGrid(
    getTicks({
      ...CartesianAxis.defaultProps,
      ...xAxis,
      ticks: getTicksOfAxis(xAxis, true),
      viewBox: { x: 0, y: 0, width, height },
    }),
    offset.left!,
    offset.left! + offset.width!,
    syncWithTicks,
  )
}

const defaultProps = {
  horizontal: true,
  vertical: true,
  // The ordinates of horizontal grid lines
  horizontalPoints: [],
  // The abscissas of vertical grid lines
  verticalPoints: [],

  stroke: 'var(--v-charts-grid, #ccc)',
  fill: 'none',
  // The fill of colors of grid lines
  verticalFill: [],
  horizontalFill: [],
  xAxisId: 0,
  yAxisId: 0,
} as const satisfies Partial<CartesianGridProps>

const CartesianGridViewProps = {
  xAxisId: {
    type: [String, Number],
    default: 0,
  },
  yAxisId: {
    type: [String, Number],
    default: 0,
  },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  syncWithTicks: {
    type: Boolean,
    default: undefined,
  },
  horizontal: {
    type: [Boolean, Object],
    default: true,
  },
  vertical: {
    type: [Boolean, Object],
    default: true,
  },
  horizontalPoints: Array,
  verticalPoints: Array,
  horizontalValues: Array,
  verticalValues: Array,
  fill: String,
  fillOpacity: Number,
  ry: Number,
  verticalCoordinatesGenerator: Function,
  horizontalCoordinatesGenerator: Function,
}

const CartesianGridView = defineComponent({
  name: 'CartesianGridView',
  inheritAttrs: true,
  props: {
    item: { type: Object as PropType<ExtractPropTypes<typeof CartesianGridViewProps>>, required: true },
    svgAttrs: { type: Object as PropType<SVGAttributes & Pick<CartesianGridProps, 'verticalFill' | 'horizontalFill'> & { ry?: number }>, required: true },
  },
  setup(view, { slots }) {
    const props = view.item
    const attrs = view.svgAttrs
    const chartWidth = useChartWidth()
    const chartHeight = useChartHeight()
    const offset = useOffset()

    const isPanorama = useIsPanorama()
    const xAxis = useAppSelector(state =>
      selectAxisPropsNeededForCartesianGridTicksGenerator(state, 'xAxis', props.xAxisId!, isPanorama),
    )
    const yAxis = useAppSelector(state =>
      selectAxisPropsNeededForCartesianGridTicksGenerator(state, 'yAxis', props.yAxisId!, isPanorama),
    )

    return () => {
      const propsIncludingDefaults = {
        ...resolveDefaultProps({ ...props, ...attrs }, defaultProps),
        x: isNumber(props.x) ? props.x : offset.value.left,
        y: isNumber(props.y) ? props.y : offset.value.top,
        width: isNumber(props.width) ? props.width : offset.value.width,
        height: isNumber(props.height) ? props.height : offset.value.height,
      }
      const { x, y, width, height, syncWithTicks, horizontalValues, verticalValues } = propsIncludingDefaults

      const verticalCoordinatesGenerator = propsIncludingDefaults.verticalCoordinatesGenerator || defaultVerticalCoordinatesGenerator
      const horizontalCoordinatesGenerator = propsIncludingDefaults.horizontalCoordinatesGenerator || defaultHorizontalCoordinatesGenerator

      let { horizontalPoints, verticalPoints } = propsIncludingDefaults
      // No horizontal points are specified
      if ((!horizontalPoints || !horizontalPoints.length) && typeof horizontalCoordinatesGenerator === 'function') {
        const isHorizontalValues = horizontalValues && horizontalValues.length
        const generatorResult = horizontalCoordinatesGenerator(
          {
            yAxis: yAxis.value
              ? {
                  ...yAxis.value,
                  ticks: isHorizontalValues ? horizontalValues : yAxis.value?.ticks,
                }
              : undefined,
            width: chartWidth.value,
            height: chartHeight.value,
            offset: offset.value,
          },
          isHorizontalValues ? true : syncWithTicks,
        )

        warn(
          Array.isArray(generatorResult),
          `horizontalCoordinatesGenerator should return Array but instead it returned [${typeof generatorResult}]`,
        )
        if (Array.isArray(generatorResult)) {
          horizontalPoints = generatorResult
        }
      }

      // No vertical points are specified
      if ((!verticalPoints || !verticalPoints.length) && typeof verticalCoordinatesGenerator === 'function') {
        const isVerticalValues = verticalValues && verticalValues.length
        const generatorResult = verticalCoordinatesGenerator(
          {
            xAxis: xAxis.value
              ? {
                  ...xAxis.value,
                  ticks: isVerticalValues ? verticalValues : xAxis.value?.ticks,
                }
              : undefined,
            width: chartWidth.value,
            height: chartHeight.value,
            offset: offset.value,
          },
          isVerticalValues ? true : syncWithTicks,
        )
        warn(
          Array.isArray(generatorResult),
          `verticalCoordinatesGenerator should return Array but instead it returned [${typeof generatorResult}]`,
        )
        if (Array.isArray(generatorResult)) {
          verticalPoints = generatorResult
        }
      }

      if (
        !isNumber(width)
        || width <= 0
        || !isNumber(height)
        || height <= 0
        || !isNumber(x)
        || x !== +x
        || !isNumber(y)
        || y !== +y
      ) {
        return null
      }
      return (
        <g class="v-charts-cartesian-grid">
          <Background
            fill={propsIncludingDefaults.fill}
            fillOpacity={propsIncludingDefaults.fillOpacity}
            x={propsIncludingDefaults.x}
            y={propsIncludingDefaults.y}
            width={propsIncludingDefaults.width}
            height={propsIncludingDefaults.height}
            ry={propsIncludingDefaults.ry}
          />

          <HorizontalStripes {...propsIncludingDefaults} horizontalPoints={horizontalPoints} />
          <VerticalStripes {...propsIncludingDefaults} verticalPoints={verticalPoints} />

          <HorizontalGridLines
            {...propsIncludingDefaults}
            offset={offset.value}
            horizontalPoints={horizontalPoints}
            xAxis={xAxis.value!}
            yAxis={yAxis.value!}
            v-slots={slots.horizontal ? { horizontal: slots.horizontal } : undefined}
          />

          <VerticalGridLines
            {...propsIncludingDefaults}
            offset={offset}
            verticalPoints={verticalPoints}
            xAxis={xAxis}
            yAxis={yAxis}
            v-slots={slots.vertical ? { vertical: slots.vertical } : undefined}
          />
        </g>
      )
    }
  },
})

export const CartesianGrid = defineComponent({
  name: 'CartesianGrid',
  inheritAttrs: false,
  props: CartesianGridViewProps,
  setup(props, { attrs, slots }) {
    const View = useDeferredView(CartesianGridView)
    return () => h(View, { item: props, svgAttrs: attrs }, slots)
  },
})
