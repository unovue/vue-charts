import type { Area } from './cartesian/area/Area'
import type { DeclaredProps } from './utils/attributes'
import type { AreaChart } from './chart/AreaChart'
import type { Bar } from './cartesian/bar/Bar'
import type { BarChart } from './chart/BarChart'
import type { Brush } from './cartesian/brush/Brush'
import type { CartesianAxis } from './cartesian/cartesian-axis/CartesianAxis'
import type { CartesianGrid } from './cartesian/cartesian-grid/CartesianGrid'
import type { ComposedChart } from './chart/ComposedChart'
import type { Curve } from './shape/Curve'
import type { Customized } from './components/Customized'
import type { Dot } from './shape/Dot'
import type { ErrorBar } from './cartesian/error-bar/ErrorBar'
import type { Funnel } from './cartesian/funnel/Funnel'
import type { FunnelChart } from './chart/FunnelChart'
import type { Label } from './components/label/Label'
import type { LabelList } from './components/label/LabelList'
import type Legend from './components/legend/Legend'
import type { Line } from './cartesian/line/Line'
import type { LineChart } from './chart/LineChart'
import type { Pie } from './polar/pie/Pie'
import type { PieChart } from './chart/PieChart'
import type { PolarAngleAxis } from './polar/radar/PolarAngleAxis'
import type { PolarGrid } from './polar/radar/PolarGrid'
import type { PolarRadiusAxis } from './polar/radar/PolarRadiusAxis'
import type { Radar } from './polar/radar/Radar'
import type { RadarChart } from './chart/RadarChart'
import type { RadialBar } from './polar/radial-bar/RadialBar'
import type { RadialBarChart } from './chart/RadialBarChart'
import type { Rectangle } from './shape/Rectangle'
import type { ReferenceArea } from './cartesian/reference-area/ReferenceArea'
import type { ReferenceDot } from './cartesian/reference-dot/ReferenceDot'
import type { ReferenceLine } from './cartesian/reference-line/ReferenceLine'
import type { Sankey } from './chart/Sankey'
import type { Scatter } from './cartesian/scatter/Scatter'
import type { ScatterChart } from './chart/ScatterChart'
import type { Sector } from './shape/Sector'
import type { SunburstChart } from './chart/SunburstChart'
import type Text from './components/Text.vue'
import type { Tooltip } from './components/tooltip/Tooltip'
import type { Trapezoid } from './shape/Trapezoid'
import type { Treemap } from './chart/Treemap'
import type { XAxis } from './cartesian/axis/XAxis'
import type { YAxis } from './cartesian/axis/YAxis'
import type { ZAxis } from './cartesian/z-axis/ZAxis'

// Every public component props type is derived from the component itself, so
// declared props, emits (onX listeners, v-model updates) and defaults cannot drift.

export type AreaChartProps = DeclaredProps<typeof AreaChart>
export type AreaProps = DeclaredProps<typeof Area>
export type BarChartProps = DeclaredProps<typeof BarChart>
export type { BarListProps } from './chart/BarList'
export type BarProps = DeclaredProps<typeof Bar>
export type BrushProps = DeclaredProps<typeof Brush>
export type { CalendarHeatmapProps } from './chart/CalendarHeatmap'
export type CartesianAxisProps = DeclaredProps<typeof CartesianAxis>
export type CartesianGridProps = DeclaredProps<typeof CartesianGrid>
export type { CohortChartProps } from './chart/CohortChart'
export type ComposedChartProps = DeclaredProps<typeof ComposedChart>
export type CurveProps = DeclaredProps<typeof Curve>
export type CustomizedProps = DeclaredProps<typeof Customized>
export type DotProps = DeclaredProps<typeof Dot>
export type ErrorBarProps = DeclaredProps<typeof ErrorBar>
export type FunnelChartProps = DeclaredProps<typeof FunnelChart>
export type FunnelProps = DeclaredProps<typeof Funnel>
export type { HeatmapProps } from './chart/Heatmap'
export type { JourneySankeyProps } from './chart/JourneySankey'
export type LabelListProps = DeclaredProps<typeof LabelList>
export type LabelProps = DeclaredProps<typeof Label>
export type LegendProps = DeclaredProps<typeof Legend>
export type LineChartProps = DeclaredProps<typeof LineChart>
export type LineProps = DeclaredProps<typeof Line>
export type PieChartProps = DeclaredProps<typeof PieChart>
export type PieProps = DeclaredProps<typeof Pie>
export type PolarAngleAxisProps = DeclaredProps<typeof PolarAngleAxis>
export type PolarGridProps = DeclaredProps<typeof PolarGrid>
export type PolarRadiusAxisProps = DeclaredProps<typeof PolarRadiusAxis>
export type RadarChartProps = DeclaredProps<typeof RadarChart>
export type RadarProps = DeclaredProps<typeof Radar>
export type RadialBarChartProps = DeclaredProps<typeof RadialBarChart>
export type RadialBarProps = DeclaredProps<typeof RadialBar>
export type RectangleProps = DeclaredProps<typeof Rectangle>
export type ReferenceAreaProps = DeclaredProps<typeof ReferenceArea>
export type ReferenceDotProps = DeclaredProps<typeof ReferenceDot>
export type ReferenceLineProps = DeclaredProps<typeof ReferenceLine>
export type SankeyProps = DeclaredProps<typeof Sankey>
export type ScatterChartProps = DeclaredProps<typeof ScatterChart>
export type ScatterProps = DeclaredProps<typeof Scatter>
export type SectorProps = DeclaredProps<typeof Sector>
export type { SparklineProps } from './chart/Sparkline'
export type SunburstChartProps = DeclaredProps<typeof SunburstChart>
export type TextProps = DeclaredProps<typeof Text>
export type TooltipProps = DeclaredProps<typeof Tooltip>
export type { TrackerProps } from './chart/Tracker'
export type TrapezoidProps = DeclaredProps<typeof Trapezoid>
export type TreemapProps = DeclaredProps<typeof Treemap>
export type XAxisProps = DeclaredProps<typeof XAxis>
export type YAxisProps = DeclaredProps<typeof YAxis>
export type ZAxisProps = DeclaredProps<typeof ZAxis>
