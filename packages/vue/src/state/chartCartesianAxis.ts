import { computed, shallowRef } from 'vue'
import type { AxisRange } from './selectors/axisSelectors'
import type { SVGAttributes } from 'vue'
import type { RechartsScale, ScaleType } from '@/types/scale'
import type { AxisDomain, AxisDomainType, AxisInterval, YAxisWidth } from '@/types/axis'
import type { DataKey } from '@/types'
import type { AxisTick, TickFormatter } from '@/types/tick'

export type AxisId = string | number
export type XAxisPadding = { left?: number, right?: number } | 'gap' | 'no-gap'
export type YAxisPadding = { top?: number, bottom?: number } | 'gap' | 'no-gap'

export type XAxisOrientation = 'top' | 'bottom'
export type YAxisOrientation = 'left' | 'right'

/**
 * Properties shared in X, Y, and Z axes
 */
export type BaseCartesianAxis = {
  id?: AxisId
  scale: ScaleType | RechartsScale | undefined
  type: AxisDomainType
  /**
   * The axis functionality is severely restricted without a dataKey
   * - but there is still something left, and the prop is optional
   * so this can also be undefined even in real charts.
   * There are no defaults.
   */
  dataKey: DataKey<any> | undefined
  unit: string | undefined
  name: string | undefined
  allowDuplicatedCategory: boolean
  allowDataOverflow: boolean
  reversed: boolean
  includeHidden: boolean
  domain: AxisDomain | undefined
}

export type TicksSettings = {
  allowDecimals: boolean
  tickCount: number | undefined
  /**
   * Ticks can be any type when the axis is the type of category
   * Ticks must be numbers when the axis is the type of number
   */
  ticks: ReadonlyArray<AxisTick> | undefined
  tick: SVGAttributes | boolean
}

/**
 * These are the external props, visible for users as they set them using our public API.
 * There is all sorts of internal computed things based on these, but they will come through selectors.
 *
 * Properties shared between X and Y axes
 */
export type CartesianAxisSettings = BaseCartesianAxis &
  TicksSettings & {
    interval: AxisInterval
    mirror: boolean
    minTickGap: number
    angle: number
    hide: boolean
    tickFormatter: TickFormatter | undefined
  }

export type XAxisSettings = CartesianAxisSettings & {
  padding: XAxisPadding
  height: number
  orientation: XAxisOrientation
}

export type YAxisSettings = CartesianAxisSettings & {
  padding: YAxisPadding
  width: YAxisWidth
  orientation: YAxisOrientation
  /**
   * Internal: recent measured widths, used to detect A→B→A oscillation
   * when width is measured dynamically (width === 'auto').
   */
  widthHistory?: number[]
}

/**
 * Z axis is special because it's never displayed. It controls the size of Scatter dots,
 * but it never displays ticks anywhere.
 */
export type ZAxisSettings = BaseCartesianAxis & {
  range: AxisRange
}

export type CartesianAxisState = {
  xAxis: Record<AxisId, XAxisSettings>
  yAxis: Record<AxisId, YAxisSettings>
  zAxis: Record<AxisId, ZAxisSettings>
}

export function createChartCartesianAxis() {
  const state = shallowRef<CartesianAxisState>({ xAxis: {}, yAxis: {}, zAxis: {} })

  function addXAxis(axis: XAxisSettings) {
    const previous = state.value.xAxis[axis.id!]
    if (previous && Object.keys(previous).length === Object.keys(axis).length
      && Object.keys(axis).every(key => Object.is(Reflect.get(previous, key), Reflect.get(axis, key)))) {
      return
    }
    state.value = { ...state.value, xAxis: { ...state.value.xAxis, [axis.id!]: axis } }
  }

  function removeXAxis(axis: XAxisSettings) {
    if (!Object.hasOwn(state.value.xAxis, axis.id!))
      return
    const xAxis = { ...state.value.xAxis }
    delete xAxis[axis.id!]
    state.value = { ...state.value, xAxis }
  }

  function addYAxis(axis: YAxisSettings) {
    const previous = state.value.yAxis[axis.id!]
    if (previous && Object.keys(previous).length === Object.keys(axis).length
      && Object.keys(axis).every(key => Object.is(Reflect.get(previous, key), Reflect.get(axis, key)))) {
      return
    }
    state.value = { ...state.value, yAxis: { ...state.value.yAxis, [axis.id!]: axis } }
  }

  function removeYAxis(axis: YAxisSettings) {
    if (!Object.hasOwn(state.value.yAxis, axis.id!))
      return
    const yAxis = { ...state.value.yAxis }
    delete yAxis[axis.id!]
    state.value = { ...state.value, yAxis }
  }

  function addZAxis(axis: ZAxisSettings) {
    const previous = state.value.zAxis[axis.id!]
    if (previous && Object.keys(previous).length === Object.keys(axis).length
      && Object.keys(axis).every(key => Object.is(Reflect.get(previous, key), Reflect.get(axis, key)))) {
      return
    }
    state.value = { ...state.value, zAxis: { ...state.value.zAxis, [axis.id!]: axis } }
  }

  function removeZAxis(axis: ZAxisSettings) {
    if (!Object.hasOwn(state.value.zAxis, axis.id!))
      return
    const zAxis = { ...state.value.zAxis }
    delete zAxis[axis.id!]
    state.value = { ...state.value, zAxis }
  }

  function updateYAxisWidth({ id, width }: { id: AxisId, width: number }) {
    const axis = state.value.yAxis[id]
    if (!axis || axis.width === width)
      return
    const history = axis.widthHistory || []
    // Suppress subpixel A → B → A oscillation, as in the original reducer.
    if (history.length === 3 && history[0] === history[2] && width === history[1]
      && Math.abs(width - (history[0] ?? 0)) <= 1) {
      return
    }
    state.value = {
      ...state.value,
      yAxis: { ...state.value.yAxis, [id]: { ...axis, width, widthHistory: [...history, width].slice(-3) } },
    }
  }

  return { state: computed(() => state.value), addXAxis, removeXAxis, addYAxis, removeYAxis, addZAxis, removeZAxis, updateYAxisWidth }
}
