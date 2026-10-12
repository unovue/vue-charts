export type ScaleType =
  | 'auto'
  | 'linear'
  | 'pow'
  | 'sqrt'
  | 'log'
  | 'identity'
  | 'time'
  | 'band'
  | 'point'
  | 'ordinal'
  | 'quantile'
  | 'quantize'
  | 'utc'
  | 'sequential'
  | 'symlog'
  | 'threshold'

/**
 * A subset of d3-scale that Recharts is using
 */
export interface RechartsScale {
  domain: (() => ReadonlyArray<unknown>) & ((newDomain: ReadonlyArray<unknown>) => this)
  range: (() => ReadonlyArray<unknown>) & ((newRange: ReadonlyArray<unknown>) => this)
  bandwidth?: () => number
  ticks?: (count?: number) => number[]
  (args: unknown): number
}

/** A custom scale is copied before the chart assigns its domain and numeric range. */
interface CustomAxisScale {
  (value: never): unknown
  copy: () => CustomAxisScale
  domain: (() => ReadonlyArray<unknown>) & ((values: Iterable<never>) => CustomAxisScale)
  range: (() => ReadonlyArray<unknown>) & ((values: Iterable<number>) => CustomAxisScale)
  bandwidth?: () => number
  ticks?: (count?: number) => ReadonlyArray<unknown>
}

export type AxisScale = ScaleType | CustomAxisScale
