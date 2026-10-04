import type { BaseAxisProps } from '@/cartesian/axis/type'
import type { PolarViewBoxRequired } from '@/cartesian/type'
import type { NormalizedStackId } from '@/shape'
import type { BaseAxisWithScale, StackGroup } from '@/state/selectors/axisSelectors'
import type { TooltipEntrySettings, TooltipPayloadEntry } from '@/state/chartTooltip'
import type { ChartCoordinate, ChartOffsetRequired, ChartPointer, Coordinate, DataKey, LayoutType, StackOffsetType, TickItem, ValueType } from '@/types'
import type { AxisRange, AxisType, NumberDomain } from '@/types/axis'
import type { AxisPropsNeededForTicksGenerator, AxisTick, StackId } from '@/types/tick'
import { findEntryInArray, mathSign } from '@/utils/data'
import { formatAngleOfSector, getAngleOfPoint, polarToCartesian, reverseFormatAngleOfSector } from '@/utils/polar'
import { isNan, isNullish, isNumOrStr, isNumber } from '@/utils/validate'
import { get, isNaN, sortBy } from 'es-toolkit/compat'
import type { Series, SeriesPoint } from 'd3-shape'
import { stack as shapeStack, stackOffsetExpand, stackOffsetNone, stackOffsetSilhouette, stackOffsetWiggle, stackOrderNone } from 'd3-shape'
import { toRaw } from 'vue'

/**
 * Get the ticks of an axis
 * @param  {object}  axis The configuration of an axis
 * @param {boolean} isGrid Whether or not are the ticks in grid
 * @param {boolean} isAll Return the ticks of all the points or not
 * @return {Array}  Ticks
 */
export function getTicksOfAxis(axis: null | AxisPropsNeededForTicksGenerator, isGrid?: boolean, isAll?: boolean): ReadonlyArray<TickItem> | null {
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

export function getValueByDataKey<T>(obj: T, dataKey: DataKey<T>, defaultValue?: any) {
  if (isNullish(obj) || isNullish(dataKey)) {
    return defaultValue
  }

  if (isNumOrStr(dataKey)) {
    // 使用 toRaw 获取原始对象，避免与 Vue 响应式系统冲突
    const rawObj = toRaw(obj)
    // An exact own key takes precedence, including an explicitly undefined value.
    if (Object.prototype.hasOwnProperty.call(rawObj, dataKey)) {
      const value = Reflect.get(Object(rawObj), dataKey)
      return value === undefined ? defaultValue : value
    }
    return get(rawObj, dataKey, defaultValue)
  }

  if (typeof dataKey === 'function') {
    return dataKey(obj)
  }

  return defaultValue
}

export const MIN_VALUE_REG = /^dataMin\s*-\s*(\d+(\.\d+)?)$/
export const MAX_VALUE_REG = /^dataMax\s*\+\s*(\d+(\.\d+)?)$/

/**
 * Calculate the size between two category
 * @param  {object} axis  The options of axis
 * @param  {Array}  ticks The ticks of axis
 * @param  {boolean} isBar if items in axis are bars
 * @return {number} Size
 */
export function getBandSizeOfAxis(axis?: BaseAxisWithScale, ticks?: ReadonlyArray<TickItem>, isBar?: boolean): number | undefined {
  if (axis && axis.scale && axis.scale.bandwidth) {
    const bandWidth = axis.scale.bandwidth()

    if (!isBar || bandWidth > 0) {
      return bandWidth
    }
  }

  if (axis && ticks && ticks.length >= 2) {
    const orderedTicks = sortBy(ticks, o => o.coordinate)
    let bandSize = Infinity

    for (let i = 1, len = orderedTicks.length; i < len; i++) {
      const cur = orderedTicks[i]
      const prev = orderedTicks[i - 1]

      bandSize = Math.min((cur.coordinate || 0) - (prev.coordinate || 0), bandSize)
    }

    return bandSize === Infinity ? 0 : bandSize
  }

  return isBar ? undefined : 0
}

/**
 * Both value and domain are tuples of two numbers
 * - but the type stays as array of numbers until we have better support in rest of the app
 * @param value input that will be truncated
 * @param domain boundaries
 * @returns tuple of two numbers
 */
export function truncateByDomain(value: SeriesPoint<Record<number, number>>, domain: ReadonlyArray<number>): [number, number] | SeriesPoint<Record<number, number>> {
  if (!domain || domain.length !== 2 || !isNumber(domain[0]) || !isNumber(domain[1])) {
    return value
  }

  const minValue = Math.min(domain[0], domain[1])
  const maxValue = Math.max(domain[0], domain[1])

  const result: [number, number] = [value[0], value[1]]
  if (!isNumber(value[0]) || value[0] < minValue) {
    result[0] = minValue
  }

  if (!isNumber(value[1]) || value[1] > maxValue) {
    result[1] = maxValue
  }

  if (result[0] > maxValue) {
    result[0] = maxValue
  }

  if (result[1] < minValue) {
    result[1] = minValue
  }

  return result
}

export function getNormalizedStackId(publicStackId: StackId | undefined): NormalizedStackId | undefined {
  return publicStackId == null ? undefined : String(publicStackId)
}

export function getCateCoordinateOfLine<T extends Record<string, unknown>>({
  axis,
  ticks,
  bandSize,
  entry,
  index,
  dataKey,
}: {
  axis: {
    dataKey?: DataKey<T>
    allowDuplicatedCategory?: boolean
    type?: BaseAxisProps['type']
    scale: (v: number) => number
  }
  ticks: Array<TickItem>
  bandSize: number
  entry: T
  index: number
  dataKey?: DataKey<T>
}): number | null {
  if (axis.type === 'category') {
    // find coordinate of category axis by the value of category
    // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
    if (!axis.allowDuplicatedCategory && axis.dataKey && !isNullish(entry[axis.dataKey])) {
      // @ts-expect-error why does this use direct object access instead of getValueByDataKey?
      const matchedTick = findEntryInArray(ticks, 'value', entry[axis.dataKey])

      if (matchedTick) {
        return matchedTick.coordinate + bandSize / 2
      }
    }

    return ticks[index] ? ticks[index].coordinate + bandSize / 2 : null
  }

  const value = getValueByDataKey(entry, !isNullish(dataKey) ? dataKey! : axis.dataKey!)

  return !isNullish(value) ? axis.scale(value) : null
}

export function getChartPointer(event: Pick<MouseEvent, 'clientX' | 'clientY' | 'currentTarget'>): ChartPointer | undefined {
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

export function getTooltipEntry({
  tooltipEntrySettings,
  dataKey,
  payload,
  value,
  name,
}: {
  tooltipEntrySettings: TooltipEntrySettings
  dataKey: DataKey<any>
  payload: any
  value: ValueType
  name: string | undefined
}): TooltipPayloadEntry {
  return {
    ...tooltipEntrySettings,
    dataKey,
    payload,
    value,
    name,
  }
}

export type RangeObj = {
  x?: number
  y?: number
  cx?: number
  cy?: number
  angle?: number
  radius?: number
}

export function calculateTooltipPos(rangeObj: RangeObj, layout: LayoutType): number | undefined {
  if (layout === 'horizontal') {
    return rangeObj.x
  }
  if (layout === 'vertical') {
    return rangeObj.y
  }
  if (layout === 'centric') {
    return rangeObj.angle
  }

  return rangeObj.radius
}

export function inRangeOfSector({ x, y }: Coordinate, viewBox: PolarViewBoxRequired): RangeObj | null {
  const { radius, angle } = getAngleOfPoint({ x, y }, viewBox)
  const { innerRadius, outerRadius } = viewBox

  if (radius < innerRadius || radius > outerRadius) {
    return null
  }

  if (radius === 0) {
    return null
  }

  const { startAngle, endAngle } = formatAngleOfSector(viewBox)
  let formatAngle = angle
  let inRange

  if (startAngle <= endAngle) {
    while (formatAngle > endAngle) {
      formatAngle -= 360
    }
    while (formatAngle < startAngle) {
      formatAngle += 360
    }
    inRange = formatAngle >= startAngle && formatAngle <= endAngle
  }
  else {
    while (formatAngle > startAngle) {
      formatAngle -= 360
    }
    while (formatAngle < endAngle) {
      formatAngle += 360
    }
    inRange = formatAngle >= endAngle && formatAngle <= startAngle
  }

  if (inRange) {
    return { ...viewBox, radius, angle: reverseFormatAngleOfSector(formatAngle, viewBox) }
  }

  return null
}

export function inRange(
  x: number,
  y: number,
  layout: LayoutType,
  polarViewBox: PolarViewBoxRequired | undefined,
  offset: ChartOffsetRequired,
): RangeObj | null {
  if (layout === 'horizontal' || layout === 'vertical') {
    const isInRange
      = x >= offset.left && x <= offset.left + offset.width && y >= offset.top && y <= offset.top + offset.height

    return isInRange ? { x, y } : null
  }

  if (polarViewBox) {
    return inRangeOfSector({ x, y }, polarViewBox)
  }

  return null
}

export function calculateActiveTickIndex(coordinate: number, ticks: ReadonlyArray<TickItem>, unsortedTicks: ReadonlyArray<TickItem>, axisType: AxisType | undefined, range: AxisRange | undefined): number {
  let index = -1
  const len = ticks?.length ?? 0

  // if there are 1 or fewer ticks then the active tick is at index 0
  if (len <= 1) {
    return 0
  }

  if (axisType === 'angleAxis' && range != null && Math.abs(Math.abs(range[1] - range[0]) - 360) <= 1e-6) {
    // ticks are distributed in a circle
    for (let i = 0; i < len; i++) {
      const before = i > 0 ? unsortedTicks[i - 1].coordinate : unsortedTicks[len - 1].coordinate
      const cur = unsortedTicks[i].coordinate
      const after = i >= len - 1 ? unsortedTicks[0].coordinate : unsortedTicks[i + 1].coordinate
      let sameDirectionCoord

      if (mathSign(cur - before) !== mathSign(after - cur)) {
        const diffInterval = []
        if (mathSign(after - cur) === mathSign(range[1] - range[0])) {
          sameDirectionCoord = after

          const curInRange = cur + range[1] - range[0]
          diffInterval[0] = Math.min(curInRange, (curInRange + before) / 2)
          diffInterval[1] = Math.max(curInRange, (curInRange + before) / 2)
        }
        else {
          sameDirectionCoord = before

          const afterInRange = after + range[1] - range[0]
          diffInterval[0] = Math.min(cur, (afterInRange + cur) / 2)
          diffInterval[1] = Math.max(cur, (afterInRange + cur) / 2)
        }
        const sameInterval = [
          Math.min(cur, (sameDirectionCoord + cur) / 2),
          Math.max(cur, (sameDirectionCoord + cur) / 2),
        ]

        if (
          (coordinate > sameInterval[0] && coordinate <= sameInterval[1])
          || (coordinate >= diffInterval[0] && coordinate <= diffInterval[1])
        ) {
          (index = unsortedTicks[i].index!)
          break
        }
      }
      else {
        const minValue = Math.min(before, after)
        const maxValue = Math.max(before, after)

        if (coordinate > (minValue + cur) / 2 && coordinate <= (maxValue + cur) / 2) {
          index = unsortedTicks[i].index!
          break
        }
      }
    }
  }
  else {
    // ticks are distributed in a single direction
    for (let i = 0; i < len; i++) {
      if (
        (i === 0 && coordinate <= (ticks[i].coordinate + ticks[i + 1].coordinate) / 2)
        || (i > 0
          && i < len - 1
          && coordinate > (ticks[i].coordinate + ticks[i - 1].coordinate) / 2
          && coordinate <= (ticks[i].coordinate + ticks[i + 1].coordinate) / 2)
        || (i === len - 1 && coordinate > (ticks[i].coordinate + ticks[i - 1].coordinate) / 2)
      ) {
        index = ticks[i].index!
        break
      }
    }
  }

  return index
}

export function getActiveCoordinate(layout: LayoutType, tooltipTicks: readonly TickItem[], activeIndex: number, rangeObj: RangeObj): ChartCoordinate {
  const entry = tooltipTicks.find(tick => tick && tick.index === activeIndex)

  if (entry) {
    if (layout === 'horizontal') {
      return { x: entry.coordinate!, y: rangeObj.y! }
    }
    if (layout === 'vertical') {
      return { x: rangeObj.x!, y: entry.coordinate }
    }
    if (layout === 'centric') {
      const angle = entry.coordinate
      const { radius } = rangeObj

      return {
        ...rangeObj,
        ...polarToCartesian(rangeObj.cx!, rangeObj.cy!, radius!, angle),
        angle,
        radius,
      }
    }

    const radius = entry.coordinate
    const { angle } = rangeObj

    return {
      ...rangeObj,
      ...polarToCartesian(rangeObj.cx!, rangeObj.cy!, radius, angle!),
      angle,
      radius,
    }
  }

  return { x: 0, y: 0 }
}

function makeDomainFinite(domain: NumberDomain): NumberDomain {
  return [domain[0] === Infinity ? 0 : domain[0], domain[1] === -Infinity ? 0 : domain[1]]
}

function getDomainOfSingle(data: Array<Array<any>>): number[] {
  const flat = data.flat(2).filter(isNumber)
  return [Math.min(...flat), Math.max(...flat)]
}

export function getDomainOfStackGroups(stackGroups: Record<StackId, StackGroup> | undefined, startIndex: number, endIndex: number): NumberDomain | undefined {
  if (stackGroups == null) {
    return undefined
  }
  return makeDomainFinite(
    Object.keys(stackGroups).reduce(
      (result, stackId): NumberDomain => {
        const group = stackGroups[stackId]
        const { stackedData } = group
        const domain = stackedData.reduce(
          (res, entry) => {
            const s = getDomainOfSingle(entry.slice(startIndex, endIndex + 1))

            return [Math.min(res[0], s[0]), Math.max(res[1], s[1])]
          },
          [Infinity, -Infinity],
        )

        return [Math.min(domain[0], result[0]), Math.max(domain[1], result[1])]
      },
      [Infinity, -Infinity],
    ),
  )
}

const EPS = 1e-4

export function checkDomainOfScale(scale: any) {
  const domain = scale.domain()

  if (!domain || domain.length <= 2) {
    return
  }

  const len = domain.length
  const range = scale.range()
  const minValue = Math.min(range[0], range[1]) - EPS
  const maxValue = Math.max(range[0], range[1]) + EPS
  const first = scale(domain[0])
  const last = scale(domain[len - 1])

  if (first < minValue || first > maxValue || last < minValue || last > maxValue) {
    scale.domain([domain[0], domain[len - 1]])
  }
}

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

type OffsetAccessor = (series: Array<Series<Record<string, unknown>, string>>, order: number[]) => void

export const offsetSign: OffsetAccessor = (series) => {
  const n = series.length
  if (n <= 0) {
    return
  }

  for (let j = 0, m = series[0].length; j < m; ++j) {
    let positive = 0
    let negative = 0

    for (let i = 0; i < n; ++i) {
      const value = isNan(series[i][j][1]) ? series[i][j][0] : series[i][j][1]

      if (value >= 0) {
        series[i][j][0] = positive
        series[i][j][1] = positive + value
        positive = series[i][j][1]
      }
      else {
        series[i][j][0] = negative
        series[i][j][1] = negative + value
        negative = series[i][j][1]
      }
    }
  }
}
/**
 * Replaces all negative values with zero when stacking data.
 *
 * If all values in the series are positive then this behaves the same as 'none' stacker.
 *
 * @param {Array} series from d3-shape Stack
 * @return {Array} series with applied offset
 */
export const offsetPositive: OffsetAccessor = (series) => {
  const n = series.length
  if (n <= 0) {
    return
  }

  for (let j = 0, m = series[0].length; j < m; ++j) {
    let positive = 0

    for (let i = 0; i < n; ++i) {
      const value = isNan(series[i][j][1]) ? series[i][j][0] : series[i][j][1]

      if (value >= 0) {
        series[i][j][0] = positive
        series[i][j][1] = positive + value
        positive = series[i][j][1]
      }
      else {
        series[i][j][0] = 0
        series[i][j][1] = 0
      }
    }
  }
}

const STACK_OFFSET_MAP: Record<string, OffsetAccessor> = {
  sign: offsetSign,
  // @ts-expect-error definitelytyped types are incorrect
  expand: stackOffsetExpand,
  // @ts-expect-error definitelytyped types are incorrect
  none: stackOffsetNone,
  // @ts-expect-error definitelytyped types are incorrect
  silhouette: stackOffsetSilhouette,
  // @ts-expect-error definitelytyped types are incorrect
  wiggle: stackOffsetWiggle,
  positive: offsetPositive,
}
export function getStackedData(data: ReadonlyArray<Record<string, unknown>>, dataKeys: ReadonlyArray<DataKey<any>>, offsetType: StackOffsetType): ReadonlyArray<Series<Record<string, unknown>, DataKey<any>>> {
  const offsetAccessor: OffsetAccessor = STACK_OFFSET_MAP[offsetType]
  const stack = shapeStack<Record<string, unknown>, DataKey<any>>()
    .keys(dataKeys)
    .value((d, key) => +getValueByDataKey(d, key, 0))
    .order(stackOrderNone)
    // @ts-expect-error definitelytyped types are incorrect
    .offset(offsetAccessor)

  return stack(data)
}

export function getBaseValueOfBar({ numericAxis }: { numericAxis: BaseAxisWithScale }): number | unknown {
  const domain = numericAxis.scale.domain()

  if (numericAxis.type === 'number') {
    // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
    const minValue = Math.min(domain[0], domain[1])
    // @ts-expect-error type number means the domain has numbers in it but this relationship is not known to typescript
    const maxValue = Math.max(domain[0], domain[1])

    if (minValue <= 0 && maxValue >= 0) {
      return 0
    }
    if (maxValue < 0) {
      return maxValue
    }

    return minValue
  }

  return domain[0]
}

export function getCateCoordinateOfBar({
  axis,
  ticks,
  offset,
  bandSize,
  entry,
  index,
}: {
  axis: BaseAxisWithScale
  ticks: ReadonlyArray<TickItem>
  offset: number
  bandSize: number
  entry: any
  index: number
}): number | null {
  if (axis.type === 'category') {
    return ticks[index] ? ticks[index].coordinate + offset : null
  }
  const value = getValueByDataKey(entry, axis.dataKey, axis.scale.domain()[index])

  return !isNullish(value) ? axis.scale(value) - bandSize / 2 + offset : null
}
