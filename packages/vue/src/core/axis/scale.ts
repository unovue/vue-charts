import type { BaseAxisWithScale, TicksSettings } from '@/types/axisSettings'
import { sortBy as orderByCoordinate, upperFirst } from 'es-toolkit/compat'
import type { CategoricalDomain } from '@/types/categorical'
import * as d3Scales from 'd3-scale'
import type { AxisDomain, AxisRange, AxisType, BaseCartesianAxis, NumberDomain } from '@/types/axis'

type AxisWithTicksSettings = BaseCartesianAxis & Partial<TicksSettings>
import type { LayoutType, TickItem } from '@/types/common'
import type { AppliedChartData } from '@/types/chartData'
import type { RechartsScale } from '@/types/scale'
import { flushTiny, isCategoricalAxis } from '@/utils/validate'
import { hasDuplicate, mathSign } from '@/utils/data'
import { isWellFormedNumberDomain } from '@/utils/isDomainSpecifiedByUser'
import { getNiceTickValues, getTickValuesFixedDomain } from '@/utils/scale/getNiceTickValues'
import { getDomainDefinition } from './domain'

type XorYType = Exclude<AxisType, 'zAxis'>
type XorYorZType = AxisType

export function realScaleType(
  axisConfig: BaseCartesianAxis | undefined,
  hasBar: boolean,
  chartType: string,
): string | undefined {
  if (axisConfig == null) {
    return undefined
  }
  const { scale, type } = axisConfig
  if (scale === 'auto') {
    if (
      type === 'category'
      && chartType
      && (chartType.includes('LineChart')
        || chartType.includes('AreaChart')
        || (chartType.includes('ComposedChart') && !hasBar))
    ) {
      return 'point'
    }
    if (type === 'category') {
      return 'band'
    }

    return 'linear'
  }
  if (typeof scale === 'string') {
    const name = `scale${upperFirst(scale)}`

    return name in d3Scales ? name : 'point'
  }
  return undefined
}

function getD3ScaleFromType(realScaleType: string | undefined) {
  if (realScaleType == null) {
    return undefined
  }
  if (realScaleType in d3Scales) {
    const factory = d3Scales[realScaleType as keyof typeof d3Scales]
    // Standard d3 scale constructors accept no arguments and return a scale.
    return typeof factory === 'function' ? (factory as () => RechartsScale)() : undefined
  }
  const name = `scale${upperFirst(realScaleType)}`
  if (name in d3Scales) {
    const factory = d3Scales[name as keyof typeof d3Scales]
    // Standard d3 scale constructors accept no arguments and return a scale.
    return typeof factory === 'function' ? (factory as () => RechartsScale)() : undefined
  }
  return undefined
}

function guardScale<S extends RechartsScale>(scale: S): S {
  return new Proxy(scale, {
    apply(target, thisArg, args) {
      const value = args[0]
      if (typeof value === 'object' && value !== null && typeof value.valueOf !== 'function')
        return undefined
      return Reflect.apply(target, thisArg, args)
    },
  })
}

export function scaleFunction(
  axis: BaseCartesianAxis | undefined,
  realScaleType: string | undefined,
  axisDomain: NumberDomain | CategoricalDomain | undefined,
  axisRange: AxisRange | undefined,
): RechartsScale | undefined {
  if (axis == null || axisDomain == null || axisRange == null) {
    return undefined
  }
  if (typeof axis.scale === 'function') {
    // The custom scale boundary accepts typed domains; the assigned numeric range is used internally.
    const customScale = axis.scale.copy() as unknown as RechartsScale
    return guardScale(customScale.domain(axisDomain).range(axisRange))
  }
  const d3ScaleFunction = getD3ScaleFromType(realScaleType)
  if (d3ScaleFunction == null) {
    return undefined
  }
  const domain = axisDomain.map(value => typeof value === 'number' ? flushTiny(value) : value)
  const scale = d3ScaleFunction.domain(domain).range(axisRange)
  // I don't like this function because it mutates the scale. We should come up with a way to compute the domain up front.
  checkDomainOfScale(scale)
  return guardScale(scale)
}

export function niceTicks(
  axisDomain: NumberDomain | CategoricalDomain | undefined,
  axisSettings: AxisWithTicksSettings,
  realScaleType: string | undefined,
): ReadonlyArray<number> | undefined {
  const domainDefinition: AxisDomain = getDomainDefinition(axisSettings)
  if (realScaleType !== 'auto' && realScaleType !== 'linear') {
    return undefined
  }

  if (
    axisSettings != null
    && axisSettings.tickCount
    && Array.isArray(domainDefinition)
    && (domainDefinition[0] === 'auto' || domainDefinition[1] === 'auto')
    && isWellFormedNumberDomain(axisDomain)
  ) {
    return getNiceTickValues(axisDomain, axisSettings.tickCount, axisSettings.allowDecimals)
  }

  if (axisSettings != null && axisSettings.tickCount && axisSettings.type === 'number' && axisDomain != null) {
    return getTickValuesFixedDomain(axisDomain as NumberDomain, axisSettings.tickCount, axisSettings.allowDecimals)
  }

  return undefined
}

export function axisDomainWithNiceTicks(
  axisSettings: BaseCartesianAxis,
  domain: NumberDomain | CategoricalDomain | undefined,
  niceTicks: ReadonlyArray<number> | undefined,
  axisType: XorYType,
): NumberDomain | CategoricalDomain | undefined {
  if (
    /*
     * Angle axis for some reason uses nice ticks when rendering axis tick labels,
     * but doesn't use nice ticks for extending domain like all the other axes do.
     * Not really sure why? Is there a good reason,
     * or is it just because someone added support for nice ticks to the other axes and forgot this one?
     */
    axisType !== 'angleAxis'
    && axisSettings?.type === 'number'
    && isWellFormedNumberDomain(domain)
    && Array.isArray(niceTicks)
    && niceTicks.length > 0
  ) {
    const minFromDomain = domain[0]
    const minFromTicks = niceTicks[0]
    const maxFromDomain = domain[1]
    const maxFromTicks = niceTicks[niceTicks.length - 1]
    return [Math.min(minFromDomain, minFromTicks), Math.max(maxFromDomain, maxFromTicks)]
  }
  return domain
}

export function sortBy(a: unknown, b: unknown): number {
  const aNum = Number(a)
  const bNum = Number(b)
  if (Number.isNaN(aNum) && Number.isNaN(bNum)) {
    return 0
  }
  if (Number.isNaN(aNum)) {
    return -1
  }
  if (Number.isNaN(bNum)) {
    return 1
  }
  return aNum - bNum
}

export function duplicateDomain(
  chartLayout: LayoutType,
  appliedValues: AppliedChartData,
  axis: BaseCartesianAxis,
  axisType: XorYorZType,
): ReadonlyArray<unknown> | undefined {
  if (axis == null) {
    return undefined
  }
  const { allowDuplicatedCategory, type, dataKey } = axis
  const isCategorical = isCategoricalAxis(chartLayout, axisType)
  const allData = appliedValues.map(av => av.value)
  if (dataKey && isCategorical && type === 'category' && allowDuplicatedCategory && hasDuplicate(allData)) {
    return allData
  }
  return undefined
}

export function categoricalDomain(
  layout: LayoutType,
  appliedValues: AppliedChartData,
  axis: AxisWithTicksSettings,
  axisType: XorYType,
): ReadonlyArray<unknown> | undefined {
  if (axis == null || axis.dataKey == null) {
    return undefined
  }
  const { type, scale } = axis
  const isCategorical = isCategoricalAxis(layout, axisType)
  if (isCategorical && (type === 'number' || scale !== 'auto')) {
    return appliedValues.map(d => d.value)
  }
  return undefined
}

export function graphicalItemTicks(
  layout: LayoutType,
  axis: Pick<AxisWithTicksSettings, 'tickCount'> | undefined,
  scale: RechartsScale | undefined,
  axisRange: AxisRange | undefined,
  duplicateDomain: ReadonlyArray<unknown> | undefined,
  categoricalDomain: ReadonlyArray<unknown> | undefined,
  axisType: XorYType,
): TickItem[] | null {
  if (axis == null || scale == null || axisRange == null || axisRange[0] === axisRange[1]) {
    return null
  }
  const isCategorical = isCategoricalAxis(layout, axisType)

  const { tickCount } = axis

  let offset = 0

  offset
    = axisType === 'angleAxis' && axisRange?.length >= 2 ? mathSign(axisRange[0] - axisRange[1]) * 2 * offset : offset

  // When axis is a categorical axis, but the type of axis is number or the scale of axis is not "auto"
  if (isCategorical && categoricalDomain) {
    return categoricalDomain.map(
      (entry: unknown, index: number): TickItem => ({
        coordinate: scale(entry) + offset,
        value: entry,
        index,
        offset,
      }),
    )
  }

  if (scale.ticks) {
    return (
      scale
        .ticks(tickCount)
        .map((entry: unknown): TickItem => ({ coordinate: scale(entry) + offset, value: entry, offset }))
    )
  }

  // When axis has duplicated text, serial numbers are used to generate scale
  return scale.domain().map(
    (entry: unknown, index: number): TickItem => ({
      coordinate: scale(entry) + offset,
      value: duplicateDomain ? duplicateDomain[entry as number] : entry,
      index,
      offset,
    }),
  )
}

export function inverseTickScale(ticks: readonly TickItem[] | undefined) {
  if (!ticks?.length)
    return undefined
  return function snap(pixel: number) {
    let closest = ticks[0]
    for (const tick of ticks) {
      if (Math.abs(tick.coordinate - pixel) < Math.abs(closest.coordinate - pixel))
        closest = tick
    }
    return closest.value
  }
}

export function getBandSizeOfAxis(
  axis?: BaseAxisWithScale,
  ticks?: ReadonlyArray<TickItem>,
  isBar?: boolean,
): number | undefined {
  if (axis && axis.scale && axis.scale.bandwidth) {
    const bandWidth = axis.scale.bandwidth()

    if (!isBar || bandWidth > 0) {
      return bandWidth
    }
  }

  if (axis && ticks && ticks.length >= 2) {
    const orderedTicks = orderByCoordinate(ticks, o => o.coordinate)
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

export function checkDomainOfScale(scale: RechartsScale) {
  const domain = scale.domain()

  if (!domain || domain.length <= 2) {
    return
  }

  const len = domain.length
  const range = scale.range()
  const minValue = Math.min(Number(range[0]), Number(range[1])) - 1e-4
  const maxValue = Math.max(Number(range[0]), Number(range[1])) + 1e-4
  const first = scale(domain[0])
  const last = scale(domain[len - 1])

  if (first < minValue || first > maxValue || last < minValue || last > maxValue) {
    scale.domain([domain[0], domain[len - 1]])
  }
}
