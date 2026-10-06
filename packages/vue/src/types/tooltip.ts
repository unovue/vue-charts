import type { ChartCoordinate, ChartDataKey, Coordinate, VueClassValue } from '@/types/base'
import type { VNodeChild } from 'vue'

/**
 * null means no active index
 * string means: whichever index from the chart data it is.
 * Different charts have different requirements on data shapes,
 * and are also responsible for providing a function that will accept this index
 * and return data.
 */
export type TooltipIndex = string | null

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

/**
 * null means no active index
 * string means: whichever index from the chart data it is.
 * Different charts have different requirements on data shapes,
 * and are also responsible for providing a function that will accept this index
 * and return data.
 */
export type TooltipActiveIndex = number | null

/**
 * Different items have different data shapes so the state has no opinion on what the data shape should be;
 * the only requirement is that the chart also provides a searcher function
 * that accepts the data, and a key, and returns whatever the payload in Tooltip should be.
 */
// Payload searchers form a runtime boundary for array and hierarchy data.
// eslint-disable-next-line ts/no-explicit-any -- Searcher providers accept either arrays or hierarchy data at this runtime boundary.
export type TooltipPayloadSearcher<T = any, R = T> = (
  data: T,
  index: TooltipIndex,
  nameKey?: ChartDataKey,
) => R | undefined

type TooltipKeyboardItem = {
  /** Stable identity, independent of the current payload lookup path. */
  identity?: unknown
  index: string
  coordinate: Coordinate
  onClick?: (event: KeyboardEvent) => void
}

export type TooltipPayloadConfiguration = {
  model?: {
    index: () => TooltipActiveIndex | undefined
    request: (index: TooltipActiveIndex) => void
  }
  keyboardItems?: ReadonlyArray<TooltipKeyboardItem>
  /** Pointer-only targets do not enter keyboard order. */
  pointerItems?: ReadonlyArray<TooltipKeyboardItem>
  /** Hierarchy totals come from layout; parent rows need not store a value. */
  values?: Readonly<Record<string, number>>

  // This is the data that is the same for all tooltip payloads, regardless of activeIndex
  settings: TooltipEntrySettings
  /**
   * This is the data that the item has provided, all of it mixed together.
   * Later as user is interacting with the chart, a selector will use this
   * data + activeIndex, pass it to the TooltipPayloadSearcher, and render the result in a Tooltip.
   */
  dataDefinedOnItem: unknown
  /**
   * Opportunity for the graphical item to define its own Tooltip coordinates
   * instead of relying on the axes.
   *
   * If undefined, then Recharts will use mouse interaction coordinates, or the axis coordinates,
   * with some defaults (like, top/left of the chart).
   */
  positions: Record<NonNullable<TooltipIndex>, Coordinate> | ReadonlyArray<Coordinate> | undefined
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

export type TooltipSettingsState = {
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
 * Each of the interaction states is represented as TooltipInteractionState,
 * and then the selectors and Tooltip will decide which of the interaction states to use.
 */
export type TooltipInteractionState = {
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

export type TooltipSyncState = TooltipInteractionState & {
  /**
   * Tooltip synchronization is a feature that allows multiple charts to share the same interaction state.
   * This comes with one specialty - the syncMethod. `syncMethod=value` allows the user to synchronise charts
   * based on the active label (which is rendered as the title of the Tooltip).
   * To allow that, we need the label to be stored in the sync state.
   */
  label: string | undefined
}

/** Selection requests carry the entry identity and interaction coordinate. */
export type TooltipActionPayload = {
  configuration?: TooltipPayloadConfiguration

  activeIndex: TooltipIndex
  activeDataKey: ChartDataKey | undefined
  activeCoordinate?: ChartCoordinate | undefined
}
