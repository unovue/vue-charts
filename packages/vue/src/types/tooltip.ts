import type { ChartCoordinate, ChartDataKey, Coordinate, VueClassValue } from '@/types/base'
import type { VNodeChild } from 'vue'

/** Numeric item position; null means no selection. */
export type TooltipIndex = number | null

export type TooltipEventType = 'axis' | 'item'

export type TooltipTrigger = 'hover' | 'click'

export type TooltipType = 'none'

export type ValueType = number | string | Array<number | string>

export type NameType = number | string

export type Formatter<TValue extends ValueType, TName extends NameType> = (
  value: TValue,
  name: TName,
  item: Payload<TValue, TName>,
  index: number,
  payload: ReadonlyArray<Payload<TValue, TName>>,
) => VNodeChild

export interface Payload<TValue extends ValueType, TName extends NameType> {
  type?: TooltipType
  color?: string
  // formatter?: Formatter<TValue, TName>
  name?: TName
  value?: TValue
  unit?: string | number
  fill?: string
  dataKey?: ChartDataKey
  nameKey?: ChartDataKey
  payload?: unknown
  chartType?: string
  stroke?: string
  strokeDasharray?: string | number
  strokeWidth?: number | string
  class?: VueClassValue
  hide?: boolean
  formatter?: Formatter<TValue, TName>

}

import type { AxisId } from './axisSettings'

/**
 * One Tooltip can display multiple TooltipPayloadEntries at a time.
 */
export type TooltipPayloadEntry = Payload<ValueType, NameType>

/**
 * So what happens is that the tooltip payload is decided based on the available data, and the dataKey.
 * The dataKey can either be defined on the graphical element (like Line, or Bar)
 * or on the tooltip itself.
 *
 * The data can be defined in the chart element, or in the graphical item.
 *
 * So this type is all the settings, other than the data + dataKey complications.
 */
export type TooltipEntrySettings = Omit<TooltipPayloadEntry, 'payload' | 'value'> & {
  nameKey: ChartDataKey | undefined
}

/**
 * This is what Tooltip renders.
 */
export type TooltipPayload = ReadonlyArray<TooltipPayloadEntry>

/** Position in the chart's keyboard target order; null clears selection. */
export type TooltipActiveIndex = number | null

/** Hierarchy lookup keys stay separate from numeric selection indexes. */
export type TooltipPayloadSearcher<T = unknown, R = T> = (
  data: T,
  payloadKey: string,
  nameKey?: ChartDataKey,
) => R | undefined

type TooltipKeyboardItem = {
  /** Stable identity, independent of the current payload lookup path. */
  identity?: unknown
  index: number
  payloadKey?: string
  coordinate: Coordinate
  onClick?: (event: KeyboardEvent) => void
}

export type TooltipPayloadConfiguration = {
  model?: {
    /** Standalone selection owns the root rather than a series. */
    root?: boolean
    index: () => TooltipActiveIndex | undefined
    request: (index: TooltipActiveIndex) => void
  }
  keyboardItems?: ReadonlyArray<TooltipKeyboardItem>
  /** Pointer-only targets do not enter keyboard order. */
  pointerItems?: ReadonlyArray<TooltipKeyboardItem>
  /**
   * Value and name per item (numeric index or payload key) when they are not fields of the
   * payload: hierarchy totals come from layout, and a cell's payload is its domain object.
   */
  values?: Readonly<Record<string, ValueType | null>>
  names?: Readonly<Record<string, string>>
  /** Per-entry swatch colours (Pie sectors, Funnel trapezoids), by item index; see core/color entryColor. */
  colors?: ReadonlyArray<string | undefined>

  // This is the data that is the same for all tooltip payloads, regardless of activeIndex
  settings: TooltipEntrySettings
  /** Arrays use the numeric item index; hierarchies use the target payload key. */
  dataDefinedOnItem: unknown
  /**
   * Opportunity for the graphical item to define its own Tooltip coordinates
   * instead of relying on the axes.
   *
   * If undefined, then Recharts will use mouse interaction coordinates, or the axis coordinates,
   * with some defaults (like, top/left of the chart).
   */
  positions: Readonly<Partial<Record<number, Coordinate>>> | ReadonlyArray<Coordinate | undefined> | undefined
}

export type ActiveTooltipProps = {
  activeIndex: TooltipIndex
  activeCoordinate: ChartCoordinate | undefined
}

/**
 * So this informs the "tooltip event type". Tooltip event type can be either "axis" or "item"
 * and it is used for two things:
 * 1. Sets the active area
 * 2. Sets the background and cursor highlights
 *
 * Some charts only allow to have one type of tooltip event type, some allow both.
 * Those charts that allow both will have one default, and the "shared" prop will be used to switch between them.
 * Undefined means "use the chart default".
 *
 * Charts that only allow one tooltip event type, will ignore the shared prop.
 */
type SharedTooltipSettings = boolean | undefined

export type TooltipSettings = {
  activeIndex?: TooltipActiveIndex
  shared: SharedTooltipSettings
  trigger: TooltipTrigger
  axisId: AxisId
  /**
   * The `active` prop, despite its name, does not mean "always active".
   * It means "active after user interaction has ended".
   * By default, the tooltip is only active while the user is hovering over the chart.
   * With `active=true`, the tooltip will remain visible after mouse leave event.
   *
   * If you want to see the "active before user interaction" settings, see `defaultIndex`.
   *
   * Undefined means "depends on user interactions".
   */
  active: boolean | undefined
  /**
   * If you want to set the tooltip to be active before user interaction, you can set this property.
   */
  defaultIndex: TooltipIndex | undefined
}

/**
 * A generic state for user interaction with the chart.
 * User interaction can come through multiple channels: mouse events, keyboard events, or hardcoded in props, or synchronised from other charts.
 *
 * Each channel is represented as a TooltipInteraction, and the tooltip model decides which one wins.
 */
export type TooltipInteraction = {
  configuration?: TooltipPayloadConfiguration

  /**
   * If user interaction is in progress or not.
   * Why is this its own property? Why is this not computed from the index?
   * Certainly if index !== -1 then the tooltip is active, right?
   * Well not so fast. Recharts allows Tooltips can be set to `active=true`
   * which means the tooltip remains displayed after the user stops interacting.
   * - This implies that we cannot set index to <empty value> after interaction ends,
   *   because the chart must remember the last position just in case the `active` prop on Tooltip is set to true.
   */
  active: boolean
  /**
   * This is the current data index that is set for the chart.
   * This can come from mouse events, keyboard events, or hardcoded in props
   * in property `defaultIndex` on Tooltip.
   */
  index: TooltipIndex
  /**
   * DataKey filter.
   *
   * In case of multiple graphical items, this is the dataKey that is set for the item.
   * Very useful for `Tooltip.shared=false`, where activeIndex can display multiple values,
   * but we only want to display one of them.
   *
   * If we want to interact with all the graphical items, then this is undefined.
   * This is the case for eventTooltipType === 'axis' for example.
   */
  dataKey: ChartDataKey | undefined
  /**
   * The Coordinate where user last interacted with the chart. This needs saved so we can continue to render the tooltip at that point.
   * This is undefined on several occasions:
   * - before the user started interacting with the chart,
   * - when the chart is controlled programmatically through `defaultIndex` prop
   * - when the chart is controlled using keyboard interactions
   */
  coordinate: Coordinate | undefined
}

export type TooltipSyncInteraction = TooltipInteraction & {
  /**
   * Tooltip synchronization is a feature that allows multiple charts to share the same interaction state.
   * This comes with one specialty - the syncMethod. `syncMethod=value` allows the user to synchronise charts
   * based on the active label (which is rendered as the title of the Tooltip).
   * To allow that, we need the label to be stored in the sync state.
   */
  label: string | undefined
}

/** Selection requests carry the entry identity and interaction coordinate. */
export type TooltipTargetRequest = {
  type?: TooltipEventType
  active?: boolean
  configuration?: TooltipPayloadConfiguration

  index: TooltipIndex
  dataKey: ChartDataKey | undefined
  coordinate?: ChartCoordinate
}
