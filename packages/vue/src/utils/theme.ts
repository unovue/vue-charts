import { labelColor } from './labelColor'

export const chartThemeTokens = [
  '--v-charts-focus',
  '--v-charts-background',
  '--v-charts-grid',
  '--v-charts-axis',
  '--v-charts-text',
  '--v-charts-muted',
  '--v-charts-cursor',
  '--v-charts-tooltip-background',
  '--v-charts-tooltip-border',
  '--v-charts-tooltip-foreground',
  '--v-charts-inactive',
  '--v-charts-label-foreground',
  '--v-charts-series',
  '--v-charts-series-1',
  '--v-charts-series-2',
  '--v-charts-series-3',
  '--v-charts-series-4',
  '--v-charts-series-5',
  '--v-charts-series-6',
  '--v-charts-series-7',
  '--v-charts-series-8',
  '--v-charts-status-up',
  '--v-charts-status-degraded',
  '--v-charts-status-down',
  '--v-charts-status-maintenance',
] as const

const seriesPalette = [
  '#2563eb',
  '#f97316',
  '#14b8a6',
  '#a855f7',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
] as const

export function seriesColor(index: number): string {
  const position = Math.max(0, index) % seriesPalette.length
  return `var(--v-charts-series-${position + 1}, var(--v-charts-series, ${seriesPalette[position]}))`
}

/** Default palette labels; themes that replace the palette must set the label token. */
export function seriesForeground(index: number): string {
  const position = Math.max(0, index) % seriesPalette.length
  return labelColor(seriesPalette[position])
}
