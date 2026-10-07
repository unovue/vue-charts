// Every public name is imported from the file that defines it.

// Cartesian components
export { Area } from './cartesian/area/Area'
export { XAxis } from './cartesian/axis/XAxis'
export { YAxis } from './cartesian/axis/YAxis'
export { Bar } from './cartesian/bar/Bar'
export { Brush } from './cartesian/brush/Brush'
export { CartesianAxis } from './cartesian/cartesian-axis/CartesianAxis'
export { CartesianGrid } from './cartesian/cartesian-grid/CartesianGrid'
export { ErrorBar } from './cartesian/error-bar/ErrorBar'
export { Funnel } from './cartesian/funnel/Funnel'
export { Line } from './cartesian/line/Line'
export { ReferenceArea } from './cartesian/reference-area/ReferenceArea'
export { ReferenceDot } from './cartesian/reference-dot/ReferenceDot'
export { ReferenceLine } from './cartesian/reference-line/ReferenceLine'
export { Scatter } from './cartesian/scatter/Scatter'
export { ZAxis } from './cartesian/z-axis/ZAxis'
export type { CartesianPosition } from './cartesian/getCartesianPosition'
export type { AreaSlots } from './cartesian/area/Area'
export type { AreaDotSlotProps } from './cartesian/area/type'
export type { BarSlots } from './cartesian/bar/type'
export type { Orientation, Unit } from './cartesian/cartesian-axis/CartesianAxis'
export type { CartesianGridLineSlotProps, CartesianGridSlots } from './cartesian/cartesian-grid/type'
export type { FunnelSlots } from './cartesian/funnel/Funnel'
export type { LineSlots } from './cartesian/line/type'
export type { ReferenceDotShapeProps, ReferenceDotSlots } from './cartesian/reference-dot/ReferenceDot'
export type { FunnelTrapezoidItem } from './types/funnel'
export type { LinePointItem } from './types/line'
export type { TickFormatter } from './types/tick'

// Chart containers and standalone charts
export { AreaChart } from './chart/AreaChart'
export { BarChart } from './chart/BarChart'
export { BarList } from './chart/BarList'
export { CalendarHeatmap } from './chart/CalendarHeatmap'
export { CohortChart } from './chart/CohortChart'
export { ComposedChart } from './chart/ComposedChart'
export { FunnelChart } from './chart/FunnelChart'
export { Heatmap } from './chart/Heatmap'
export { JourneySankey } from './chart/JourneySankey'
export { LineChart } from './chart/LineChart'
export { PieChart } from './chart/PieChart'
export { RadarChart } from './chart/RadarChart'
export { RadialBarChart } from './chart/RadialBarChart'
export { Sankey } from './chart/Sankey'
export { ScatterChart } from './chart/ScatterChart'
export { Sparkline } from './chart/Sparkline'
export { SunburstChart } from './chart/SunburstChart'
export { Tracker } from './chart/Tracker'
export { Treemap } from './chart/Treemap'
export type { BarListRow, BarListSlotProps, BarListSlots } from './chart/BarList'
export type { CalendarDay, CalendarHeatmapSlots } from './chart/CalendarHeatmap'
export type { CohortCell, CohortChartSlots } from './chart/CohortChart'
export type { HeatmapCell, HeatmapKey, HeatmapSlots } from './chart/Heatmap'
export type { JourneyHeaderSlotProps, JourneyLabelSlotProps, JourneySankeySlots } from './chart/journeyTypes'
export type { SankeyLinkSlotProps, SankeyNodeSlotProps, SankeySlots } from './chart/Sankey'
export type { SparklineSlots } from './chart/Sparkline'
export type { SunburstContentSlotProps, SunburstSlots } from './chart/SunburstChart'
export type { SunburstData } from './chart/sunburstUtils'
export type { TrackerRow, TrackerSlots } from './chart/Tracker'
export type { TreemapContentSlotProps, TreemapSlots } from './chart/Treemap'

// Containers

import type { SvgTemplateAttributes, WithAttributes } from './utils/attributes'
import { forwardsSvgAttributes } from './utils/attributes'
import ResponsiveContainerComponent from './container/ResponsiveContainer.vue'

/**
 * @deprecated Charts are responsive by default: remove the wrapper and set `width`, `height`
 * or `aspect` on the chart. Removed in 2.0 (see internals/migrations.md).
 */
export const ResponsiveContainer: typeof ResponsiveContainerComponent = ResponsiveContainerComponent
export type { ResponsiveContainerProps } from './container/ResponsiveContainer.vue'

// General components
import TextComponent from './components/Text.vue'

/** SVG text with wrapping and scaling; forwards SVG attributes such as `font-size`. */
export const Text: WithAttributes<typeof TextComponent, SvgTemplateAttributes> = forwardsSvgAttributes(TextComponent)
export { Cell } from './components/Cell'
export { Customized } from './components/Customized'
export { Label } from './components/label/Label'
export { LabelList } from './components/label/LabelList'
export { default as Legend } from './components/legend/Legend'
export { Tooltip } from './components/tooltip/Tooltip'
export type { CellProps } from './components/Cell'
export type { CustomizedSlotProps, CustomizedSlots } from './components/Customized'
export type { LegendContentProps } from './components/legend/type'
export type { TooltipSlots } from './components/tooltip/Tooltip'
export type {
  CrossCursorSlotProps,
  CursorSlotProps,
  CurveCursorSlotProps,
  RectangleCursorSlotProps,
  SectorCursorSlotProps,
  TooltipContentProps,
} from './components/tooltip/types'

// Polar components
export { Pie } from './polar/pie/Pie'
export { PolarAngleAxis } from './polar/radar/PolarAngleAxis'
export { PolarGrid } from './polar/radar/PolarGrid'
export { PolarRadiusAxis } from './polar/radar/PolarRadiusAxis'
export { Radar } from './polar/radar/Radar'
export { RadialBar } from './polar/radial-bar/RadialBar'
export type { PieSlots } from './polar/pie/Pie'
export type { RadarShapeSlotProps, RadarSlots } from './polar/radar/Radar'
export type { RadialBarShapeSlotProps, RadialBarSlots } from './polar/radial-bar/RadialBar'

// Shapes
export { Cross } from './shape/Cross'
export { Curve } from './shape/Curve'
export { Dot } from './shape/Dot'
export { Polygon } from './shape/Polygon'
export { Rectangle } from './shape/Rectangle'
export { Sector } from './shape/Sector'
export { Symbols } from './shape/Symbols'
export { Trapezoid } from './shape/Trapezoid'
export type { CrossProps } from './shape/Cross'
export type { CurveType } from './shape/Curve'
export type { PolygonPoint, PolygonProps } from './shape/Polygon'
export type { SymbolsProps, SymbolType } from './shape/Symbols'
export type { MinPointSize, Point, TrapezoidItem } from './types/shape'

// Component props, derived from the components
export type * from './publicProps'

export {
  useIsTooltipActive,
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  usePlotArea,
  useXAxisDomain,
  useYAxisDomain,
  useXAxisTicks,
  useYAxisTicks,
  useXAxisScale,
  useYAxisScale,
  useXAxisInverseScale,
  useYAxisInverseScale,
  useXAxisInverseDataSnapScale,
  useYAxisInverseDataSnapScale,
  useXAxisInverseTickSnapScale,
  useYAxisInverseTickSnapScale,
  useCartesianScale,
  useChartWidth,
  useChartHeight,
  useMargin,
} from './hooks/publicHooks'
export type { InverseScaleFunction, ScaleFunction, CartesianDataPoint } from './hooks/publicHooks'
export { useActiveTooltipDataPoints } from './hooks/useActiveTooltipDataPoints'

export { chartThemeTokens } from './utils/theme'
export type { ChartTransition } from './animation/motion'
export type { ChartPointerState } from './events/componentEvents'
export type { TreemapLayoutNode } from './chart/treemapUtils'
export type { SankeyLayoutNode, SankeyLayoutLink } from './chart/sankeyUtils'
export type { GridCell } from './chart/cellGridUtils'

export type { JourneyInput, JourneyLink, JourneyNode, JourneyStep } from './chart/journeyUtils'

export type { CellSlotProps } from './chart/CellGridLayer'
export type { BarRectangleItem } from './types/bar'

export type { AreaPointItem } from './core/area'
export type { ScatterPointItem } from './types/common'
export type { PieSectorDataItem } from './core/pie'
export type { RadarPoint } from './types/radar'
export type { RadialBarDataItem } from './types/radialBar'

export type { BrushStartEndIndex } from '@/types/chartData'
export type { LegendPayload } from './components/DefaultLegendContent'
export type { LegendBoundingBox } from './components/legend/Legend'
export type { BrushIndex } from './cartesian/brush/type'
export type { TooltipActiveIndex } from '@/types/tooltip'
export type { LegendHidden } from './components/legend/type'
export { defineChartComponents } from './typed'
export type { RowDataKey } from './types/typed'
export type {
  TypedComponents,
  TypedTooltipContentProps,
  TypedTooltipPayload,
  TypedLegendPayload,
} from './typed'

export type { TooltipPayloadEntry, TooltipPayload } from './types/tooltip'

export type { AxisProps } from './cartesian/axis/AxisProps'
