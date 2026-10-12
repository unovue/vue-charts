import { color } from 'd3-color'

function luminance(value: number): number {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

/** Variables and translucent fills need an explicit foreground from the theme. */
export function labelColor(fill: string): string {
  const parsed = color(fill)?.rgb()
  if (!parsed || parsed.opacity !== 1)
    return 'var(--v-charts-label-foreground, currentColor)'

  const light = luminance(parsed.r) * 0.2126
    + luminance(parsed.g) * 0.7152 + luminance(parsed.b) * 0.0722
  const dark = luminance(10)
  const foreground = (1.05 / (light + 0.05)) > ((light + 0.05) / (dark + 0.05))
    ? '#ffffff'
    : '#0a0a0a'
  return `var(--v-charts-label-foreground, ${foreground})`
}
