import type {
  AreaChartProps,
  AreaProps,
  AxisProps,
  BarChartProps,
  BarListProps,
  BarProps,
  BrushProps,
  CalendarHeatmapProps,
  CartesianAxisProps,
  CartesianGridProps,
  CellProps,
  CohortChartProps,
  ComposedChartProps,
  CrossProps,
  CurveProps,
  CustomizedProps,
  DotProps,
  ErrorBarProps,
  FunnelChartProps,
  FunnelProps,
  HeatmapProps,
  JourneySankeyProps,
  LabelListProps,
  LabelProps,
  LegendProps,
  LineChartProps,
  LineProps,
  PieChartProps,
  PieProps,
  PolarAngleAxisProps,
  PolarGridProps,
  PolarRadiusAxisProps,
  PolygonProps,
  RadarChartProps,
  RadarProps,
  RadialBarChartProps,
  RadialBarProps,
  RectangleProps,
  ReferenceAreaProps,
  ReferenceDotProps,
  ReferenceLineProps,
  ResponsiveContainerProps,
  SankeyProps,
  ScatterChartProps,
  ScatterProps,
  SectorProps,
  SparklineProps,
  SunburstChartProps,
  SymbolsProps,
  TextProps,
  TooltipPayloadEntry,
  TooltipProps,
  TrackerProps,
  TrapezoidProps,
  TreemapProps,
  XAxisProps,
  YAxisProps,
  ZAxisProps,
} from 'vccs'

export type PublicPropsProbe = [
  AreaProps,
  AreaChartProps,
  BarProps,
  BarChartProps,
  BarListProps,
  BrushProps,
  CalendarHeatmapProps,
  CartesianAxisProps,
  CartesianGridProps,
  CellProps,
  CohortChartProps,
  ComposedChartProps,
  CrossProps,
  CurveProps,
  CustomizedProps,
  DotProps,
  ErrorBarProps,
  FunnelProps,
  FunnelChartProps,
  HeatmapProps,
  JourneySankeyProps,
  LabelProps,
  LabelListProps,
  LegendProps,
  LineProps,
  LineChartProps,
  PieProps,
  PieChartProps,
  PolarAngleAxisProps,
  PolarGridProps,
  PolarRadiusAxisProps,
  PolygonProps,
  RadarProps,
  RadarChartProps,
  RadialBarProps,
  RadialBarChartProps,
  RectangleProps,
  ReferenceAreaProps,
  ReferenceDotProps,
  ReferenceLineProps,
  ResponsiveContainerProps,
  SankeyProps,
  ScatterProps,
  ScatterChartProps,
  SectorProps,
  SparklineProps,
  SunburstChartProps,
  SymbolsProps,
  TextProps,
  TooltipProps,
  TrackerProps,
  TrapezoidProps,
  TreemapProps,
  XAxisProps,
  YAxisProps,
  ZAxisProps,
  TooltipPayloadEntry,
]

// @ts-expect-error Cartesian charts do not accept polar geometry.
export type CartesianPolarProp = BarChartProps['cx']
// @ts-expect-error Pie charts do not accept bar sizing.
export type PieBarProp = PieChartProps['barSize']
// @ts-expect-error Funnel charts do not accept polar geometry.
export type FunnelPolarProp = FunnelChartProps['cx']
// @ts-expect-error Funnel charts do not accept bar sizing.
export type FunnelBarProp = FunnelChartProps['barSize']
export type RadialBarSizing = RadialBarChartProps['barSize']

export type SharedAxisProps = AxisProps
export const axisPresentation: AxisProps = { tick: false, angle: -45, label: 'Day', name: 'Visits', stroke: 'red', tickSize: 8 }
export const horizontalAxis: XAxisProps = { orientation: 'top', type: 'number', padding: 'gap', scale: 'linear' }
export const verticalAxis: YAxisProps = { orientation: 'right', type: 'category', padding: { top: 4, bottom: 8 } }
// @ts-expect-error X axis orientation is top or bottom.
export const invalidHorizontalAxis: XAxisProps = { orientation: 'sideways' }
// @ts-expect-error Y axis orientation is left or right.
export const invalidVerticalAxis: YAxisProps = { orientation: 'top' }
// @ts-expect-error Axis type is numeric or categorical.
export const invalidAxisType: XAxisProps = { type: 'date' }
// @ts-expect-error Padding strings have two supported values.
export const invalidAxisPadding: YAxisProps = { padding: 'wide' }
// @ts-expect-error Scale names must be supported.
export const invalidAxisScale: XAxisProps = { scale: 'made-up' }

export const emptyBrushRange: BrushProps['range'] = null
export const selectedBrushRange: BrushProps['range'] = { startIndex: 0, endIndex: 1 }
// @ts-expect-error Brush exposes one range model, not a start model.
export type RemovedBrushStart = BrushProps['startIndex']
// @ts-expect-error Brush exposes one range model, not an end model.
export type RemovedBrushEnd = BrushProps['endIndex']
export type StandaloneSelection = [
  TrackerProps['activeIndex'],
  HeatmapProps['activeIndex'],
  CohortChartProps['activeIndex'],
  CalendarHeatmapProps['activeIndex'],
  SparklineProps['activeIndex'],
]
