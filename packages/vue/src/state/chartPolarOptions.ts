import { computed, shallowRef } from 'vue'

export type PolarChartOptions = {
  cx: number | string
  cy: number | string
  startAngle: number
  endAngle: number
  innerRadius: number | string
  outerRadius: number | string
}

export function createChartPolarOptions() {
  const state = shallowRef<PolarChartOptions | null>(null)

  function updatePolarOptions(options: PolarChartOptions) {
    const current = state.value
    if (current?.cx === options.cx && current.cy === options.cy && current.startAngle === options.startAngle
      && current.endAngle === options.endAngle && current.innerRadius === options.innerRadius && current.outerRadius === options.outerRadius) {
      return
    }
    state.value = { ...options }
  }

  return { state: computed(() => state.value), updatePolarOptions }
}
