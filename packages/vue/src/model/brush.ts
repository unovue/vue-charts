import { computed } from 'vue'
import type { Padding } from '@/types'
import type { BrushStartEndIndex } from '@/types/chartData'
import { createRegistry } from './registry'

export interface BrushSettings {
  x: number | undefined
  y: number | undefined
  width: number | undefined
  height: number
  padding: Padding
  /** The Brush's requested window: its controlled `range` or its own state; `null` = all rows. */
  range: BrushStartEndIndex | null
  onRangeChange?: (range: BrushStartEndIndex) => void
}

export function createChartBrush() {
  const settings = createRegistry<BrushSettings>()
  const registered = computed(() => settings.entries.value.at(-1))
  const state = computed(() => registered.value ?? {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    range: null,
    onRangeChange: undefined,
  })
  /** `undefined` when no Brush is registered. */
  const range = computed(() => registered.value?.range)
  return { state, range, register: settings.register }
}
