import type { CategoricalDomain } from '@/types/categorical'
import type { AppliedChartData, ChartData } from '@/types/chartData'
import type { AxisDomain, AxisType, BaseCartesianAxis, NumberDomain } from '@/types/axis'
import type { LayoutType, StackOffsetType } from '@/types/common'
import type { TicksSettings } from '@/types/tick'
import type { AppliedChartDataWithErrorDomain } from './data'
import { onlyAllowNumbers } from './data'
import { range } from 'es-toolkit/compat'
import { hasDuplicate } from '@/utils/data'
import { flushTiny, isCategoricalAxis, isNumOrStr, isNumber } from '@/utils/validate'
import {
  numericalDomainSpecifiedWithoutRequiringData,
  parseNumericalUserDomain,
} from './userDomain'

export const defaultNumericDomain: AxisDomain = [0, 'auto']

function onlyAllowNumbersAndStringsAndDates(
  item: { value: unknown },
): string | number | Date | undefined {
  const { value } = item
  if (isNumOrStr(value) || value instanceof Date) {
    return value
  }
  return undefined
}

function computeNumericalDomain(
  dataWithErrorDomains: ReadonlyArray<AppliedChartDataWithErrorDomain>,
): NumberDomain | undefined {
  const allDataSquished = dataWithErrorDomains
    // This flatMap has to be flat because we're creating a new array in the return value
    .flatMap(d => [d.value, d.errorDomain])
    // This flat is needed because a) errorDomain is an array, and b) value may be a number, or it may be a range (for Area, for example)
    .flat(1)
  const onlyNumbers = onlyAllowNumbers(allDataSquished)
  if (onlyNumbers.length === 0) {
    return undefined
  }
  return [Math.min(...onlyNumbers), Math.max(...onlyNumbers)]
}

function computeDomainOfTypeCategory(
  allDataSquished: AppliedChartData,
  axisSettings: BaseCartesianAxis,
  isCategorical: boolean,
): CategoricalDomain {
  const categoricalDomain = allDataSquished.map(onlyAllowNumbersAndStringsAndDates).filter(v => v != null)
  if (
    isCategorical
    && (axisSettings.dataKey == null || (axisSettings.allowDuplicatedCategory && hasDuplicate(categoricalDomain)))
  ) {
    /*
     * 1. In an absence of dataKey, Recharts will use array indexes as its categorical domain
     * 2. When category axis has duplicated text, serial numbers are used to generate scale
     */
    return range(0, allDataSquished.length)
  }
  if (axisSettings.allowDuplicatedCategory) {
    return categoricalDomain
  }
  return Array.from(new Set(categoricalDomain))
}

export function getDomainDefinition(
  axisSettings: BaseCartesianAxis & Partial<TicksSettings>,
): AxisDomain {
  if (axisSettings == null || !('domain' in axisSettings)) {
    return defaultNumericDomain
  }

  if (axisSettings.domain != null) {
    return axisSettings.domain
  }
  if (axisSettings.ticks != null) {
    if (axisSettings.type === 'number') {
      const allValues = onlyAllowNumbers(axisSettings.ticks)
      return [Math.min(...allValues), Math.max(...allValues)]
    }
    if (axisSettings.type === 'category') {
      return axisSettings.ticks.map(String)
    }
  }
  return axisSettings?.domain ?? defaultNumericDomain
}

export function mergeDomains(
  ...domains: ReadonlyArray<NumberDomain | undefined>
): NumberDomain | undefined {
  const allDomains = domains.filter(Boolean)
  if (allDomains.length === 0) {
    return undefined
  }
  const allValues = allDomains.flat()
  const allNumbers = allValues.filter(isNumber)
  if (allNumbers.length === 0) {
    return undefined
  }
  const min = Math.min(...allNumbers)
  const max = Math.max(...allNumbers)
  return [min, max]
}

export function numericalDomain(
  axisSettings: BaseCartesianAxis,
  domainDefinition: AxisDomain | undefined,
  domainOfStackGroups: NumberDomain | undefined,
  allDataWithErrorDomains: ReadonlyArray<AppliedChartDataWithErrorDomain>,
  referenceElementsDomain: NumberDomain | undefined,
): NumberDomain | undefined {
  const domainFromUserPreference: NumberDomain | undefined = numericalDomainSpecifiedWithoutRequiringData(
    domainDefinition,
    axisSettings.allowDataOverflow,
  )
  if (domainFromUserPreference != null) {
    // We're done! No need to compute anything else.
    return domainFromUserPreference
  }

  const domain = parseNumericalUserDomain(
    domainDefinition,
    mergeDomains(domainOfStackGroups, referenceElementsDomain, computeNumericalDomain(allDataWithErrorDomains)),
    axisSettings.allowDataOverflow,
  )
  return domain && [flushTiny(domain[0]), flushTiny(domain[1])]
}

const expandDomain: NumberDomain = [0, 1]

export function axisDomain(
  axisSettings: BaseCartesianAxis,
  layout: LayoutType,
  displayedData: ChartData | undefined,
  allAppliedValues: AppliedChartData,
  stackOffsetType: StackOffsetType,
  axisType: AxisType,
  numericalDomain: NumberDomain | undefined,
): NumberDomain | CategoricalDomain | undefined {
  if ((axisSettings == null || displayedData == null || displayedData.length === 0) && numericalDomain === undefined) {
    return undefined
  }

  const { dataKey, type } = axisSettings
  const isCategorical = isCategoricalAxis(layout, axisType)
  if (isCategorical && dataKey == null) {
    // Recharts v2 compat: PolarRadiusAxis defaults domain=[0,'auto'] (2 entries).
    // When forced to band scale, parseSpecifiedDomain extends the data-derived domain
    // to match the specified domain length, creating extra bands that make bars thinner.
    const domainLen = Array.isArray(axisSettings.domain) ? axisSettings.domain.length : 0
    return range(0, Math.max(displayedData?.length ?? 0, domainLen))
  }

  if (type === 'category') {
    return computeDomainOfTypeCategory(allAppliedValues, axisSettings, isCategorical)
  }
  if (stackOffsetType === 'expand') {
    return expandDomain
  }
  return numericalDomain
}
