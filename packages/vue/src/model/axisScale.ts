import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { AxisRange, AxisType, BaseCartesianAxis, NumberDomain } from '@/types/axis'
import type { CategoricalDomain } from '@/types/categorical'
import type { AppliedChartData } from '@/types/chartData'
import type { ChartOffsetRequired, LayoutType } from '@/types/common'
import type { TicksSettings } from '@/types/axisSettings'
import { axisTicks } from '@/core/axis/ticks'
import {
  axisDomainWithNiceTicks,
  getBandSizeOfAxis,
  categoricalDomain as getCategoricalDomain,
  duplicateDomain as getDuplicateDomain,
  inverseTickScale as getInverseTickScale,
  niceTicks as getNiceTicks,
  realScaleType as getRealScaleType,
  graphicalItemTicks,
  scaleFunction,
  sortBy,
} from '@/core/axis/scale'
import { axisRangeWithReverse } from '@/core/axis/range'
import { combineInverseScaleFunction, createCategoricalInverse } from '@/utils/createCategoricalInverse'

export interface AxisScaleSources {
  layout: () => LayoutType
  name: () => string
  hasBar: () => boolean
  offset: () => ChartOffsetRequired
}

export function createAxisScale<S extends BaseCartesianAxis & Partial<TicksSettings>>(
  sources: AxisScaleSources,
  type: AxisType,
  settings: ComputedRef<S>,
  domain: ComputedRef<NumberDomain | CategoricalDomain | undefined>,
  appliedValues: ComputedRef<AppliedChartData>,
  range: ComputedRef<AxisRange | undefined>,
) {
  const realScaleType = computed(() => getRealScaleType(settings.value, sources.hasBar(), sources.name()))
  const tickSettings = computed(() => ({
    ...settings.value,
    tickCount: settings.value.tickCount,
    ticks: settings.value.ticks,
    allowDecimals: settings.value.allowDecimals === true,
  }))
  const niceTicks = computed(() => getNiceTicks(domain.value, tickSettings.value, realScaleType.value))
  const niceDomain = computed(() => type === 'zAxis'
    ? domain.value
    : axisDomainWithNiceTicks(settings.value, domain.value, niceTicks.value, type))
  const reversedRange = computed(() => axisRangeWithReverse(settings.value, range.value))
  const scale = computed(() => scaleFunction(settings.value, realScaleType.value, niceDomain.value, reversedRange.value))
  const duplicateDomain = computed(() => getDuplicateDomain(sources.layout(), appliedValues.value, settings.value, type))
  const categoricalDomain = computed(() => type === 'zAxis'
    ? undefined
    : getCategoricalDomain(sources.layout(), appliedValues.value, tickSettings.value, type))
  const ticks = computed(() => axisTicks(sources.layout(), tickSettings.value, realScaleType.value, scale.value, niceTicks.value, range.value, duplicateDomain.value, categoricalDomain.value, type))
  const graphicalTicks = computed(() => type === 'zAxis'
    ? null
    : graphicalItemTicks(sources.layout(), tickSettings.value, scale.value, range.value, duplicateDomain.value, categoricalDomain.value, type))
  const withScale = computed(() => scale.value ? { ...settings.value, scale: scale.value } : undefined)
  const bandSize = computed(() => getBandSizeOfAxis(withScale.value, graphicalTicks.value ?? undefined))
  const barBandSize = computed(() => getBandSizeOfAxis(withScale.value, graphicalTicks.value ?? undefined, true))
  const sortedValues = computed(() => appliedValues.value.map(item => item.value).sort(sortBy))
  const inverseScale = computed(() => combineInverseScaleFunction(scale.value))
  const inverseDataScale = computed(() => createCategoricalInverse(scale.value, sortedValues.value))
  const inverseTickScale = computed(() => getInverseTickScale(ticks.value))
  return { realScaleType, niceTicks, range, reversedRange, scale, duplicateDomain, categoricalDomain, ticks, graphicalTicks, withScale, bandSize, barBandSize, inverseScale, inverseDataScale, inverseTickScale }
}

export type AxisScaleModel<S extends BaseCartesianAxis & Partial<TicksSettings> = BaseCartesianAxis> =
  ReturnType<typeof createAxisScale<S>>
