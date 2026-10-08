import type { AxisId } from '@/types/axis'

/**
 * The one identity rule for axis ids: `y-axis-id="1"` (a string attribute) and
 * `:y-axis-id="1"` (a number) name the same axis.
 */
export function axisKey(id: AxisId): string {
  return String(id)
}

export function sameAxis(a: AxisId | undefined, b: AxisId | undefined): boolean {
  return a !== undefined && b !== undefined && axisKey(a) === axisKey(b)
}
