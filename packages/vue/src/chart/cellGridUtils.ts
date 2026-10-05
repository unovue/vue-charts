/** One rectangle of a cell chart (Tracker, CalendarHeatmap). Geometry is in SVG pixels. */
export interface GridCell<P = unknown> {
  /** Stable identity across data changes, e.g. the ISO date. Never geometry. */
  key: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  /** Grid position for keyboard navigation. */
  row: number
  column: number
  /** Accessible text and default tooltip name, e.g. "Sep 3, 2026". */
  label: string
  /** Default tooltip value, e.g. "4" or "Operational". */
  value: string | number | null
  /** The number behind the cell when `value` is formatted text, e.g. for an entrance by value. */
  amount?: number | null
  /** Text drawn centered on the cell, e.g. "42%"; hidden when it does not fit. */
  text?: string
  /** Strong fill: the text is drawn light on it. */
  strong?: boolean
  payload: P
}

const DAY_MS = 86_400_000
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * A calendar day as a whole number of days since 1970-01-01. Strings must be `YYYY-MM-DD`;
 * a `Date` counts by its local calendar date, so a local midnight never shifts to the previous
 * day the way `toISOString()` would.
 */
export function toDayNumber(input: string | Date | null | undefined): number | undefined {
  if (input instanceof Date) {
    const time = input.getTime()
    return Number.isNaN(time) ? undefined : Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()) / DAY_MS
  }
  if (typeof input !== 'string')
    return undefined
  const match = ISO_DAY.exec(input)
  if (!match)
    return undefined
  const [, y, m, d] = match.map(Number)
  const day = Date.UTC(y, m - 1, d) / DAY_MS
  // Reject impossible dates such as 2026-02-30 or 2026-13-01 instead of rolling them over.
  const parsed = new Date(day * DAY_MS)
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d ? day : undefined
}

export function dayNumberToIso(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(day: number): number {
  return new Date(day * DAY_MS).getUTCDay()
}

export function formatDay(day: number, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(new Date(day * DAY_MS))
}

/**
 * The fill for each intensity level: level 0 is the empty color, the last level is the full
 * color, and the steps between mix the two so any CSS color or variable works as a base.
 */
export function levelColors(color: string, empty: string, levels: number): string[] {
  const count = Math.max(1, Math.floor(levels))
  return Array.from({ length: count + 1 }, (_, level) => {
    if (level === 0)
      return empty
    if (level === count)
      return color
    return `color-mix(in oklab, ${color} ${Math.round(level / count * 100)}%, ${empty})`
  })
}

/** A continuous mix: ratio 0 is `empty`, 1 is `color`. */
export function mixColor(color: string, empty: string, ratio: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  if (percent === 0)
    return empty
  if (percent === 100)
    return color
  return `color-mix(in oklab, ${color} ${percent}%, ${empty})`
}

/** Level 0 for zero or less, otherwise 1…levels in equal steps up to `max`. */
export function levelOf(value: number, max: number, levels: number): number {
  if (!(value > 0) || !(max > 0))
    return 0
  return Math.min(levels, Math.max(1, Math.ceil(value / max * levels)))
}
