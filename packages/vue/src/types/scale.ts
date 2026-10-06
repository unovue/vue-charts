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
  ticks?: (count?: number) => any
  (args: any): number
}
