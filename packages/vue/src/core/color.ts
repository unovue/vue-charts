import type { CartesianGraphicalItemType } from '@/types/graphical'
import { seriesColor } from '@/utils/theme'

export type SeriesType = CartesianGraphicalItemType | 'pie' | 'radar' | 'radialBar' | 'funnel'

/**
 * The colour that stands for a whole series: its legend icon, tooltip swatch and active dot.
 * Outline series (area, line, radar) are their stroke unless it is hidden; filled shapes are
 * their fill.
 */
export function mainColor(type: SeriesType, { stroke, fill }: { stroke?: string, fill?: string }): string | undefined {
  if (type === 'area' || type === 'line' || type === 'radar')
    return stroke && stroke !== 'none' ? stroke : fill
  return fill
}

function fillOf(source: unknown): string | undefined {
  return source != null && typeof source === 'object' && 'fill' in source && typeof source.fill === 'string'
    ? source.fill
    : undefined
}

/**
 * The colour of one data entry (a sector, trapezoid or bar): a `<Cell fill>` wins, then the
 * row's own `fill`, then the series fill, then the palette colour for its position.
 */
export function entryColor({ cell, row, seriesFill, index }: { cell?: unknown, row?: unknown, seriesFill?: string, index: number }): string {
  return fillOf(cell) ?? fillOf(row) ?? seriesFill ?? seriesColor(index)
}
