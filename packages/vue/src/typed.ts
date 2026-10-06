import type { VNodeChild } from 'vue'
import {
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
import {
  Area,
  Bar,
  Brush,
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
import { Pie, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBar } from './polar'
import { Cell, LabelList, Legend, Tooltip } from './components'
import type { TooltipContentProps } from './components/tooltip/Tooltip'
import type { LegendContentProps } from './components/legend/type'
import type { LegendPayload } from './components/DefaultLegendContent'
import type { TooltipPayload } from '@/types/tooltip'

export type RowDataKey<Row> = Extract<keyof Row, string> | ((row: Row) => unknown)

type RowProps<Props, Row> = {
  [Key in keyof Props]: Key extends 'dataKey' | 'nameKey'
    ? Extract<NonNullable<Props[Key]>, Function> extends never ? Extract<keyof Row, string> : RowDataKey<Row>
    : Key extends 'data'
      ? NonNullable<Props[Key]> extends readonly unknown[] ? Row[] : Props[Key]
      : Props[Key]
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

type TypedComponent<Component extends ComponentConstructor, Row, Slots = InstanceType<Component>['$slots']> =
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

const components: RuntimeComponents = {
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
  Area,
  Bar,
  Funnel,
  Line,
  Pie,
  Radar,
  RadialBar,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  LabelList,
  Cell,
}

export type TypedComponents<Row> = {
  [Key in keyof typeof components]: Key extends 'Tooltip'
    ? TypedComponent<(typeof components)[Key], Row, Omit<InstanceType<typeof Tooltip>['$slots'], 'content'> & {
      content?: (props: TypedTooltipContentProps<Row>) => VNodeChild
    }>
    : Key extends 'Legend'
      ? TypedComponent<(typeof components)[Key], Row, {
        content?: (props: Omit<LegendContentProps, 'payload'> & { payload: TypedLegendPayload<Row>[] }) => VNodeChild
      }>
      : TypedComponent<(typeof components)[Key], Row>
}

/** Opt into row keys and payloads without wrapping or replacing runtime components. */
export function defineChartComponents<Row>(): TypedComponents<Row> {
  // The only bridge cast: Vue's runtime components remain identical; only declarations narrow.
  return components as unknown as TypedComponents<Row>
}
