export { truncateByDomain, getNormalizedStackId, getCateCoordinateOfLine, getBaseValueOfBar, getCateCoordinateOfBar } from '@/core/coordinates'
export { getTooltipEntry } from '@/core/tooltip'
export { getBandSizeOfAxis, checkDomainOfScale } from '@/core/axis/scale'
export { getDomainOfStackGroups, getStackedData } from '@/core/axis/stacks'
export { MIN_VALUE_REG, MAX_VALUE_REG } from '@/core/axis/userDomain'
import { getValueByDataKey as readDataKey } from '@/core/data'
import type {
  ChartPointer,
  DataKey,
  TickItem,
} from '@/types'
import type { AxisPropsNeededForTicksGenerator, AxisTick } from '@/types/tick'
import { mathSign } from '@/utils/data'

import { isNaN } from 'es-toolkit/compat'
import { toRaw } from 'vue'

/**
 * Get the ticks of an axis
 * @param  {object}  axis The configuration of an axis
 * @param {boolean} isGrid Whether or not are the ticks in grid
 * @param {boolean} isAll Return the ticks of all the points or not
 * @return {Array}  Ticks
 */
export function getTicksOfAxis(
  axis: null | AxisPropsNeededForTicksGenerator,
  isGrid?: boolean,
  isAll?: boolean,
): ReadonlyArray<TickItem> | null {
  if (!axis) {
    return null
  }
  const {
    duplicateDomain,
    type,
    range,
    scale,
    realScaleType,
    isCategorical,
    categoricalDomain,
    tickCount,
    ticks,
    niceTicks,
    axisType,
  } = axis

  if (!scale) {
    return null
  }

  const offsetForBand = realScaleType === 'scaleBand' ? scale.bandwidth!() / 2 : 2
  let offset = (isGrid || isAll) && type === 'category' && scale.bandwidth ? scale.bandwidth() / offsetForBand : 0

  offset = axisType === 'angleAxis' && range!.length >= 2 ? mathSign(range![0] - range![1]) * 2 * offset : offset

  // The ticks set by user should only affect the ticks adjacent to axis line
  if (isGrid && (ticks || niceTicks)) {
    const result = (ticks! || niceTicks!).map((entry: AxisTick, index: number): TickItem => {
      const scaleContent = duplicateDomain ? duplicateDomain.indexOf(entry) : entry

      return {
        // If the scaleContent is not a number, the coordinate will be NaN.
        // That could be the case for example with a PointScale and a string as domain.
        coordinate: scale(scaleContent) + offset,
        value: entry,
        offset,
        index,
      }
    })

    return result.filter((row: TickItem) => !isNaN(row.coordinate))
  }

  // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
  if (isCategorical && categoricalDomain) {
    return categoricalDomain.map(
      (entry: any, index: number): TickItem => ({
        coordinate: scale(entry) + offset,
        value: entry,
        index,
        offset,
      }),
    )
  }

  if (scale.ticks && !isAll) {
    return scale
      .ticks(tickCount!)
      .map(
        (entry: any, index: number): TickItem => ({ coordinate: scale(entry) + offset, value: entry, offset, index }),
      )
  }

  // When axis has duplicated text, serial numbers are used to generate scale
  return scale.domain().map(
    (entry: any, index: number): TickItem => ({
      coordinate: scale(entry) + offset,
      value: duplicateDomain ? duplicateDomain[entry] : entry,
      index,
      offset,
    }),
  )
}

export function getChartPointer(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'currentTarget'>,
): ChartPointer | undefined {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const scaleX = rect.width / target.offsetWidth
  const scaleY = rect.height / target.offsetHeight
  return {
    /*
     * Here it's important to use:
     * - event.clientX and event.clientY to get the mouse position relative to the viewport, including scroll.
     * - pageX and pageY are not used because they are relative to the whole document, and ignore scroll.
     * - rect.left and rect.top are used to get the position of the chart relative to the viewport.
     * - offsetX and offsetY are not used because they are relative to the offset parent
     *  which may or may not be the same as the clientX and clientY, depending on the position of the chart in the DOM
     *  and surrounding element styles. CSS position: relative, absolute, fixed, will change the offset parent.
     * - scaleX and scaleY are necessary for when the chart element is scaled using CSS `transform: scale(N)`.
     */
    chartX: Math.round((event.clientX - rect.left) / scaleX),
    chartY: Math.round((event.clientY - rect.top) / scaleY),
  }
}

export { calculateTooltipPos, inRangeOfSector, inRange, calculateActiveTickIndex, getActiveCoordinate } from '@/core/interaction'
export type { RangeObj } from '@/core/interaction'

export function getTooltipNameProp(
  nameFromItem: string | number | undefined | unknown,
  dataKey: DataKey<any> | undefined,
): string | undefined {
  if (nameFromItem) {
    return String(nameFromItem)
  }
  if (typeof dataKey === 'string') {
    return dataKey
  }
  return undefined
}

export function isClipDot(dot: any): boolean {
  if (dot && typeof dot === 'object' && 'clipDot' in dot) {
    return Boolean(dot.clipDot)
  }
  return true
}

export function getValueByDataKey<T>(
  obj: T,
  dataKey: DataKey<T> | undefined,
  defaultValue?: unknown,
) {
  return readDataKey(typeof dataKey === 'function' ? obj : toRaw(obj), dataKey, defaultValue)
}
