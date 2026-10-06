import { computed, shallowRef } from 'vue'
import type { Registry } from '@/model/registry'
import type { HorizontalAlignmentType, LegendPayload, VerticalAlignmentType } from '@/components/DefaultLegendContent'
import type { CartesianPosition } from '@/cartesian/getCartesianPosition'
import type { LayoutType, Size } from '@/types'

export type LegendSettings = {
  layout: LayoutType
  align: HorizontalAlignmentType
  verticalAlign: VerticalAlignmentType
  position?: CartesianPosition
  offset?: number
}

/**
 * The properties inside this state update independently of each other and quite often.
 * When selecting, never select the whole state because you are going to get
 * unnecessary re-renders. Select only the properties you need.
 */
export type LegendState = {
  hidden: ReadonlySet<string>
  settings: LegendSettings
  size: Size
  /**
   * This is a 2D array of LegendPayloads. The first dimension is for each graphical item.
   * Some items may have multiple legend items, so the second dimension is for each legend item.
   */
  payload: ReadonlyArray<ReadonlyArray<LegendPayload>>
}

export function createChartLegend(entries: Registry<readonly LegendPayload[]>) {
  const state = shallowRef<Omit<LegendState, 'payload'>>({
    settings: { layout: 'horizontal', align: 'center', verticalAlign: 'middle' },
    size: { width: 0, height: 0 },
    hidden: new Set(),
  })

  function setHidden(keys: string[] | undefined) {
    const hidden = new Set(keys)
    const previous = state.value.hidden
    if (previous.size === hidden.size && [...hidden].every(key => previous.has(key)))
      return
    state.value = { ...state.value, hidden }
  }

  function setLegendSize(size: Size) {
    if (state.value.size.width === size.width && state.value.size.height === size.height)
      return
    state.value = { ...state.value, size: { width: size.width, height: size.height } }
  }

  function setLegendSettings(settings: LegendSettings) {
    const previous = state.value.settings
    if (previous.layout === settings.layout && previous.align === settings.align && previous.verticalAlign === settings.verticalAlign
      && previous.position === settings.position && previous.offset === settings.offset) {
      return
    }
    state.value = { ...state.value, settings: { ...settings } }
  }

  return {
    state: computed(() => state.value),
    entries,
    setHidden,
    setLegendSize,
    setLegendSettings,
  }
}
