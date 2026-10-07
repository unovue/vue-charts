import { computed } from 'vue'
import { createRegistry } from './registry'
import type { HorizontalAlignmentType, LegendPayload, VerticalAlignmentType } from '@/components/DefaultLegendContent'
import type { CartesianPosition } from '@/cartesian/getCartesianPosition'
import type { LayoutType, Size } from '@/types'

export interface LegendSettings {
  layout: LayoutType
  align: HorizontalAlignmentType
  verticalAlign: VerticalAlignmentType
  position?: CartesianPosition
  offset?: number
}

export function createChartLegend() {
  const entries = createRegistry<readonly LegendPayload[]>()
  const bindings = createRegistry<{
    settings: LegendSettings
    hidden: readonly string[] | undefined
    size: Size | undefined
  }>()
  const size = computed(() => bindings.entries.value.at(-1)?.size ?? { width: 0, height: 0 })
  const settings = computed(() => bindings.entries.value.at(-1)?.settings ?? {
    layout: 'horizontal' as const,
    align: 'center' as const,
    verticalAlign: 'middle' as const,
  })
  const hidden = computed(() => new Set(bindings.entries.value.at(-1)?.hidden))
  const payload = computed(() => entries.entries.value.flat())
  const state = computed(() => ({ settings: settings.value, hidden: hidden.value, size: size.value }))

  return { state, entries, payload, register: bindings.register }
}
