import type { CartesianTickItem } from '@/types/tick'
import type { CartesianGridProps } from '@/cartesian/cartesian-grid/type'

export const CartesianGridDefaultProps: Partial<CartesianGridProps> = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  viewBox: { x: 0, y: 0, width: 0, height: 0 },
  // The orientation of axis
  orientation: 'bottom',
  // The ticks
  ticks: [] as ReadonlyArray<CartesianTickItem>,

  stroke: 'var(--v-charts-axis, #666)',
  tickLine: true,
  axisLine: true,
  // tick: true,
  mirror: false,

  minTickGap: 5,
  // The width or height of tick
  tickSize: 6,
  tickMargin: 2,
  interval: 'preserveEnd',
}
