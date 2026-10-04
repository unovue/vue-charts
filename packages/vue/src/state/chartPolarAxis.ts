import { computed, shallowRef } from 'vue'
import type { AxisId, BaseCartesianAxis, TicksSettings } from './chartCartesianAxis'

export type RadiusAxisSettings = BaseCartesianAxis & TicksSettings

export type AngleAxisSettings = BaseCartesianAxis & TicksSettings

export type PolarAxisState = {
  radiusAxis: Record<AxisId, RadiusAxisSettings>
  angleAxis: Record<AxisId, AngleAxisSettings>
}

export function createChartPolarAxis() {
  const state = shallowRef<PolarAxisState>({ radiusAxis: {}, angleAxis: {} })

  function sameAxis(previous: RadiusAxisSettings | undefined, next: RadiusAxisSettings) {
    return previous != null && previous.id === next.id && previous.scale === next.scale && previous.type === next.type
      && previous.dataKey === next.dataKey && previous.unit === next.unit && previous.name === next.name
      && previous.allowDuplicatedCategory === next.allowDuplicatedCategory && previous.allowDataOverflow === next.allowDataOverflow
      && previous.reversed === next.reversed && previous.includeHidden === next.includeHidden && previous.domain === next.domain
      && previous.allowDecimals === next.allowDecimals && previous.tickCount === next.tickCount && previous.ticks === next.ticks && previous.tick === next.tick
  }

  function addRadiusAxis(axis: RadiusAxisSettings) {
    if (sameAxis(state.value.radiusAxis[axis.id!], axis))
      return
    state.value = { ...state.value, radiusAxis: { ...state.value.radiusAxis, [axis.id!]: axis } }
  }

  function removeRadiusAxis(axis: RadiusAxisSettings) {
    if (!Object.hasOwn(state.value.radiusAxis, axis.id!))
      return
    const radiusAxis = { ...state.value.radiusAxis }
    delete radiusAxis[axis.id!]
    state.value = { ...state.value, radiusAxis }
  }

  function addAngleAxis(axis: AngleAxisSettings) {
    if (sameAxis(state.value.angleAxis[axis.id!], axis))
      return
    state.value = { ...state.value, angleAxis: { ...state.value.angleAxis, [axis.id!]: axis } }
  }

  function removeAngleAxis(axis: AngleAxisSettings) {
    if (!Object.hasOwn(state.value.angleAxis, axis.id!))
      return
    const angleAxis = { ...state.value.angleAxis }
    delete angleAxis[axis.id!]
    state.value = { ...state.value, angleAxis }
  }

  return { state: computed(() => state.value), addRadiusAxis, removeRadiusAxis, addAngleAxis, removeAngleAxis }
}
