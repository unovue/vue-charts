import type { AreaChart } from './chart/AreaChart'
import type { Bar } from './cartesian/bar/Bar'
import type { BarChart } from './chart/BarChart'
import type { CartesianGrid } from './cartesian/cartesian-grid/CartesianGrid'
import type { ComposedChart } from './chart/ComposedChart'
import type { Customized } from './components/Customized'
import type { ErrorBar } from './cartesian/error-bar/ErrorBar'
import type { FunnelChart } from './chart/FunnelChart'
import type { Label } from './components/label/Label'
import type { LabelList } from './components/label/LabelList'
import type { LineChart } from './chart/LineChart'
import type { PieChart } from './chart/PieChart'
import type { PolarAngleAxis } from './polar/radar/PolarAngleAxis'
import type { PolarGrid } from './polar/radar/PolarGrid'
import type { PolarRadiusAxis } from './polar/radar/PolarRadiusAxis'
import type { Radar } from './polar/radar/Radar'
import type { RadarChart } from './chart/RadarChart'
import type { RadialBar } from './polar/radial-bar/RadialBar'
import type { RadialBarChart } from './chart/RadialBarChart'
import type { ReferenceArea } from './cartesian/reference-area/ReferenceArea'
import type { ReferenceDot } from './cartesian/reference-dot/ReferenceDot'
import type { ReferenceLine } from './cartesian/reference-line/ReferenceLine'
import type { Sankey } from './chart/Sankey'
import type { Scatter } from './cartesian/scatter/Scatter'
import type { ScatterChart } from './chart/ScatterChart'
import type { SunburstChart } from './chart/SunburstChart'
import type Text from './components/Text.vue'
import type { Tooltip } from './components/tooltip/Tooltip'
import type { Treemap } from './chart/Treemap'
import type { XAxis } from './cartesian/axis/XAxis'
import type { YAxis } from './cartesian/axis/YAxis'
import type { ZAxis } from './cartesian/z-axis/ZAxis'

export type AreaChartProps = InstanceType<typeof AreaChart>['$props']
export type BarProps = InstanceType<typeof Bar>['$props']
export type BarChartProps = InstanceType<typeof BarChart>['$props']
export type { BarListProps } from './chart/BarList'
export type { CalendarHeatmapProps } from './chart/CalendarHeatmap'
export type CartesianGridProps = InstanceType<typeof CartesianGrid>['$props']
export type { CohortChartProps } from './chart/CohortChart'
export type ComposedChartProps = InstanceType<typeof ComposedChart>['$props']
export type CustomizedProps = InstanceType<typeof Customized>['$props']
export type ErrorBarProps = InstanceType<typeof ErrorBar>['$props']
export type FunnelChartProps = InstanceType<typeof FunnelChart>['$props']
export type { HeatmapProps } from './chart/Heatmap'
export type { JourneySankeyProps } from './chart/JourneySankey'
export type LabelProps = InstanceType<typeof Label>['$props']
export type LabelListProps = InstanceType<typeof LabelList>['$props']
export type LineChartProps = InstanceType<typeof LineChart>['$props']
export type PieChartProps = InstanceType<typeof PieChart>['$props']
export type PolarAngleAxisProps = InstanceType<typeof PolarAngleAxis>['$props']
export type PolarGridProps = InstanceType<typeof PolarGrid>['$props']
export type PolarRadiusAxisProps = InstanceType<typeof PolarRadiusAxis>['$props']
export type RadarProps = InstanceType<typeof Radar>['$props']
export type RadarChartProps = InstanceType<typeof RadarChart>['$props']
export type RadialBarProps = InstanceType<typeof RadialBar>['$props']
export type RadialBarChartProps = InstanceType<typeof RadialBarChart>['$props']
export type ReferenceAreaProps = InstanceType<typeof ReferenceArea>['$props']
export type ReferenceDotProps = InstanceType<typeof ReferenceDot>['$props']
export type ReferenceLineProps = InstanceType<typeof ReferenceLine>['$props']
export type SankeyProps = InstanceType<typeof Sankey>['$props']
export type ScatterProps = InstanceType<typeof Scatter>['$props']
export type ScatterChartProps = InstanceType<typeof ScatterChart>['$props']
export type { SparklineProps } from './chart/Sparkline'
export type SunburstChartProps = InstanceType<typeof SunburstChart>['$props']
export type TextProps = InstanceType<typeof Text>['$props']
export type TooltipProps = InstanceType<typeof Tooltip>['$props']
export type { TrackerProps } from './chart/Tracker'
export type TreemapProps = InstanceType<typeof Treemap>['$props']
export type XAxisProps = InstanceType<typeof XAxis>['$props']
export type YAxisProps = InstanceType<typeof YAxis>['$props']
export type ZAxisProps = InstanceType<typeof ZAxis>['$props']
