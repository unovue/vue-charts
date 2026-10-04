import { computed, shallowRef } from 'vue'
import type { Padding } from '@/types'

/**
 * From all Brush properties, only height has a default value and will be always defined.
 * Other properties are nullable and will be computed from offsets and margins if they are not set.
 */
export type BrushSettings = {
  x: number | undefined
  y: number | undefined
  width: number | undefined
  height: number
  padding: Padding
}

export function createChartBrush() {
  const defaults = (): BrushSettings => ({ x: 0, y: 0, width: 0, height: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } })
  const state = shallowRef<BrushSettings>(defaults())

  function setBrushSettings(settings: BrushSettings | null) {
    const next = settings ?? defaults()
    const current = state.value
    const samePadding = current.padding.top === next.padding.top && current.padding.right === next.padding.right
      && current.padding.bottom === next.padding.bottom && current.padding.left === next.padding.left
    if (current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height && samePadding)
      return
    state.value = { ...next, padding: samePadding ? current.padding : { ...next.padding } }
  }

  return { state: computed(() => state.value), setBrushSettings }
}
