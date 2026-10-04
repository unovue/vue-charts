import { computed, shallowRef } from 'vue'
import type { AxisId } from './chartCartesianAxis'
import type { IfOverflow } from '@/types'

export type ReferenceElementSettings = {
  yAxisId: AxisId
  xAxisId: AxisId
  ifOverflow: IfOverflow
}

export type ReferenceDotSettings = ReferenceElementSettings & {
  x: unknown
  y: unknown
  r: number
}

export type ReferenceAreaSettings = ReferenceElementSettings & {
  x1: unknown
  x2: unknown
  y1: unknown
  y2: unknown
}

export type ReferenceLineSettings = ReferenceElementSettings & {
  x: unknown
  y: unknown
}

export type ReferenceElementState = {
  dots: ReadonlyArray<ReferenceDotSettings>
  areas: ReadonlyArray<ReferenceAreaSettings>
  lines: ReadonlyArray<ReferenceLineSettings>
}

export function createChartReferenceElements() {
  const state = shallowRef<ReferenceElementState>({ dots: [], areas: [], lines: [] })

  function addDot(dot: ReferenceDotSettings) {
    state.value = { ...state.value, dots: [...state.value.dots, dot] }
  }

  function removeDot(dot: ReferenceDotSettings) {
    const index = state.value.dots.indexOf(dot)
    if (index < 0)
      return
    state.value = { ...state.value, dots: state.value.dots.filter((_, i) => i !== index) }
  }

  function addArea(area: ReferenceAreaSettings) {
    state.value = { ...state.value, areas: [...state.value.areas, area] }
  }

  function removeArea(area: ReferenceAreaSettings) {
    const index = state.value.areas.indexOf(area)
    if (index < 0)
      return
    state.value = { ...state.value, areas: state.value.areas.filter((_, i) => i !== index) }
  }

  function addLine(line: ReferenceLineSettings) {
    state.value = { ...state.value, lines: [...state.value.lines, line] }
  }

  function removeLine(line: ReferenceLineSettings) {
    const index = state.value.lines.indexOf(line)
    if (index < 0)
      return
    state.value = { ...state.value, lines: state.value.lines.filter((_, i) => i !== index) }
  }

  return { state: computed(() => state.value), addDot, removeDot, addArea, removeArea, addLine, removeLine }
}
