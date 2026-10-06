import { computed } from 'vue'
import type { Padding } from '@/types'
import { createRegistry } from './registry'

export interface BrushSettings {
  x: number | undefined
  y: number | undefined
  width: number | undefined
  height: number
  padding: Padding
}

export function createChartBrush() {
  const settings = createRegistry<BrushSettings>()
  const state = computed(() => settings.entries.value.at(-1) ?? {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  return { state, register: settings.register }
}
