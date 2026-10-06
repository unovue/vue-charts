import type { VNodeChild } from 'vue'
import type { RowDataKey } from './types/typed'
import type { HeatmapProps, HeatmapSlots } from './chart/Heatmap'
import type { CalendarHeatmapProps, CalendarHeatmapSlots } from './chart/CalendarHeatmap'
import type { CohortChartProps, CohortChartSlots } from './chart/CohortChart'
import type { TrackerProps, TrackerSlots } from './chart/Tracker'
import type { BarListProps, BarListSlots } from './chart/BarList'
import type { SparklineProps, SparklineSlots } from './chart/Sparkline'
import type { JourneySankeyProps, JourneySankeySlots } from './chart/JourneySankey'
import type {
  AreaChart,
  BarChart,
  ComposedChart,
  FunnelChart,
  LineChart,
  PieChart,
  RadarChart,
  RadialBarChart,
  Sankey,
  ScatterChart,
  SunburstChart,
  Treemap,
} from './chart'
import type {
  Area,
  Bar,
  Brush,
  ErrorBar,
  Funnel,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
} from './cartesian'
import type { Pie, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBar } from './polar'
import type { Cell, LabelList, Legend, Tooltip } from './components'
import type { TooltipContentProps } from './components/tooltip/Tooltip'
import type { LegendContentProps } from './components/legend/type'
import type { LegendPayload } from './components/DefaultLegendContent'
import type { TooltipPayload } from '@/types/tooltip'

export type { RowDataKey } from './types/typed'

type RowItem<Item, Row> = Item extends object
  ? 'payload' extends keyof Item ? Omit<Item, 'payload'> & { payload: Row } : Item
  : Item

type RowCallback<Value, Row> = Value extends (...args: infer Args) => infer Result
  ? (...args: { [Index in keyof Args]: RowItem<Args[Index], Row> }) => Result
  : Value

type RowProps<Props, Row> = {
  [Key in keyof Props]: Key extends 'dataKey' | 'nameKey'
    ? RowDataKey<Row>
    : Key extends 'hidden' ? Array<Extract<RowDataKey<Row>, string>>
      : Key extends 'onUpdate:hidden' ? (hidden: Array<Extract<RowDataKey<Row>, string>>) => void
        : Key extends 'data'
          ? NonNullable<Props[Key]> extends readonly unknown[] ? Row[] : Props[Key]
          : RowCallback<Props[Key], Row>
}

type RowSlots<Slots, Row> = { [Key in keyof Slots]: RowCallback<Slots[Key], Row> }

type StandaloneComponent<Props, Slots> = { new (): { $props: Props, $slots: Slots } }

type StandaloneComponents<Row> = {
  Heatmap: StandaloneComponent<HeatmapProps<Row>, HeatmapSlots<Row>>
  CalendarHeatmap: StandaloneComponent<CalendarHeatmapProps<Row>, CalendarHeatmapSlots<Row>>
  CohortChart: StandaloneComponent<CohortChartProps<Row>, CohortChartSlots<Row>>
  Tracker: StandaloneComponent<TrackerProps<Row>, TrackerSlots<Row>>
  BarList: StandaloneComponent<BarListProps<Row>, BarListSlots<Row>>
  Sparkline: StandaloneComponent<SparklineProps<Row>, SparklineSlots<Row>>
  JourneySankey: StandaloneComponent<JourneySankeyProps<Row>, JourneySankeySlots<Row>>
}

export type TypedTooltipPayload<Row> = Omit<TooltipPayload[number], 'payload' | 'dataKey' | 'nameKey'> & {
  payload: Row
  dataKey?: RowDataKey<Row>
  nameKey?: RowDataKey<Row>
}

export type TypedTooltipContentProps<Row> = Pick<TooltipContentProps, 'active' | 'label' | 'coordinate' | 'accessibilityLayer'> & {
  payload: TypedTooltipPayload<Row>[]
}

// Legend payload describes a series, rather than the row hovered by Tooltip.
export type TypedLegendPayload<Row> = Omit<LegendPayload, 'dataKey'> & {
  dataKey?: RowDataKey<Row>
}

type ComponentConstructor = abstract new (...args: never[]) => { $props: object, $slots: object }

type TypedComponent<Component extends ComponentConstructor, Row, Slots = RowSlots<InstanceType<Component>['$slots'], Row>> =
  // A mapped type drops the original constructor, whose broad props would defeat checking.
  { [Key in keyof Component]: Component[Key] } & {
    new (): Omit<InstanceType<Component>, '$props' | '$slots'> & {
      $props: RowProps<InstanceType<Component>['$props'], Row>
      $slots: Slots
    }
  }

// Keep component references in emitted declarations instead of expanding Vue internals.
type RuntimeComponents = {
  AreaChart: typeof AreaChart
  BarChart: typeof BarChart
  ComposedChart: typeof ComposedChart
  FunnelChart: typeof FunnelChart
  LineChart: typeof LineChart
  PieChart: typeof PieChart
  RadarChart: typeof RadarChart
  RadialBarChart: typeof RadialBarChart
  Sankey: typeof Sankey
  ScatterChart: typeof ScatterChart
  SunburstChart: typeof SunburstChart
  Treemap: typeof Treemap
  Area: typeof Area
  Bar: typeof Bar
  Funnel: typeof Funnel
  ErrorBar: typeof ErrorBar
  Line: typeof Line
  Pie: typeof Pie
  Radar: typeof Radar
  RadialBar: typeof RadialBar
  Scatter: typeof Scatter
  XAxis: typeof XAxis
  YAxis: typeof YAxis
  ZAxis: typeof ZAxis
  PolarAngleAxis: typeof PolarAngleAxis
  PolarRadiusAxis: typeof PolarRadiusAxis
  Tooltip: typeof Tooltip
  Legend: typeof Legend
  Brush: typeof Brush
  ReferenceLine: typeof ReferenceLine
  ReferenceArea: typeof ReferenceArea
  ReferenceDot: typeof ReferenceDot
  LabelList: typeof LabelList
  Cell: typeof Cell
}

export type TypedComponents<Row, Components = RuntimeComponents & StandaloneComponents<Row>> = {
  [Key in keyof Components]: Key extends keyof StandaloneComponents<Row>
    ? StandaloneComponents<Row>[Key]
    : Components[Key] extends ComponentConstructor
      ? Key extends 'Tooltip'
        ? TypedComponent<Components[Key], Row, Omit<InstanceType<typeof Tooltip>['$slots'], 'content'> & {
          content?: (props: TypedTooltipContentProps<Row>) => VNodeChild
        }>
        : Key extends 'Legend'
          ? TypedComponent<Components[Key], Row, {
            content?: (props: Omit<LegendContentProps, 'payload'> & { payload: TypedLegendPayload<Row>[] }) => VNodeChild
          }>
          : TypedComponent<Components[Key], Row>
      : Components[Key]
}

/** Select runtime components while giving their keys and item payloads a row type. */
export function defineChartComponents<Row>() {
  return function selectComponents<Components extends object>(components: Components): TypedComponents<Row, Components> {
    // The runtime references stay identical; only the consumer declarations narrow.
    return components as TypedComponents<Row, Components>
  }
}
