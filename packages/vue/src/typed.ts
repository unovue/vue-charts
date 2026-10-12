import type { VNodeChild } from 'vue'
import type { RowDataKey } from './types/typed'
import type { HeatmapProps, HeatmapSlots } from './chart/Heatmap'
import type { CalendarHeatmapProps, CalendarHeatmapSlots } from './chart/CalendarHeatmap'
import type { CohortChartProps, CohortChartSlots } from './chart/CohortChart'
import type { TrackerProps, TrackerSlots } from './chart/Tracker'
import type { BarListProps, BarListSlots } from './chart/BarList'
import type { SparklineProps, SparklineSlots } from './chart/Sparkline'
import type { JourneySankeyProps, JourneySankeySlots } from './chart/JourneySankey'
import type { TooltipContentProps } from './components/tooltip/types'
import type { LegendContentProps } from './components/legend/type'
import type { LegendPayload } from './types/legend'
import type { TooltipPayload } from '@/types/tooltip'

type RowArray<Value, Row> = Value extends readonly unknown[] ? RowItem<Value, Row> : Value

// A string index alone does not guarantee that the runtime object has a payload.
type ItemKeys<Item> = keyof {
  [Key in keyof Item as string extends Key ? never : number extends Key ? never : Key]: Item[Key]
}

type RowObject<Item, Row> = {
  [Key in keyof Item]: Key extends 'payload' ? Row : RowArray<Item[Key], Row>
} & ('payload' extends ItemKeys<Item> ? { payload: Row } : unknown)

type RowItem<Item, Row> = Item extends readonly unknown[]
  ? { [Index in keyof Item]: RowItem<Item[Index], Row> }
  : Item extends object ? RowObject<Item, Row> : Item

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

type SlotsOf<Component extends ComponentConstructor> = InstanceType<Component>['$slots']
type ContentPropsOf<Slots> = Slots extends { content?: (props: infer Props) => unknown } ? Props : never

// Tooltip and Legend content props hold a top-level `payload` array, which the generic row
// mapping would replace with a single row. They are recognised by their content slot type, so
// an aliased component (`{ Tip: Tooltip }`) keeps them.
type TypedSlots<Component extends ComponentConstructor, Row> =
  [ContentPropsOf<SlotsOf<Component>>] extends [never]
    ? RowSlots<SlotsOf<Component>, Row>
    : [ContentPropsOf<SlotsOf<Component>>] extends [TooltipContentProps]
        ? Omit<SlotsOf<Component>, 'content'> & { content?: (props: TypedTooltipContentProps<Row>) => VNodeChild }
        : [ContentPropsOf<SlotsOf<Component>>] extends [LegendContentProps]
            ? { content?: (props: Omit<LegendContentProps, 'payload'> & { payload: TypedLegendPayload<Row>[] }) => VNodeChild }
            : RowSlots<SlotsOf<Component>, Row>

/** The components passed to `defineChartComponents`, re-typed for one row type. */
export type TypedComponents<Row, Components> = {
  [Key in keyof Components]: Key extends keyof StandaloneComponents<Row>
    ? StandaloneComponents<Row>[Key]
    : Components[Key] extends ComponentConstructor
      ? TypedComponent<Components[Key], Row, TypedSlots<Components[Key], Row>>
      : Components[Key]
}

/** Select runtime components while giving their keys and item payloads a row type. */
export function defineChartComponents<Row>() {
  return function selectComponents<Components extends object>(components: Components): TypedComponents<Row, Components> {
    // The runtime references stay identical; only the consumer declarations narrow.
    return components as TypedComponents<Row, Components>
  }
}
