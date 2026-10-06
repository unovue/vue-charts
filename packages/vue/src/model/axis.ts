import type { CategoricalDomain } from '@/types/categorical'
import type { ComputedRef, EffectScope } from 'vue'
import { computed, onScopeDispose } from 'vue'
import type { AxisDomain, AxisId, BaseCartesianAxis, NumberDomain } from '@/types/axis'
import type { XAxisSettings, YAxisSettings, ZAxisSettings } from '@/types/axisSettings'
import type { AppliedChartData, ChartData, ChartDataState } from '@/types/chartData'
import type { LayoutType, StackOffsetType } from '@/types/common'
import type { AppliedChartDataWithErrorDomain } from '@/core/axis/data'
import type { StackGroup } from '@/core/axis/stacks'
import {
  combineAppliedNumericalValuesIncludingErrorValues,
  combineAppliedValues,
  combineDisplayedData,
  combineGraphicalItemsData,
  combineGraphicalItemsSettings,
  filterGraphicalNotStackedItems,
  itemAxisPredicate,
} from '@/core/axis/data'
import {
  combineAxisDomain,
  combineNumericalDomain,
  getDomainDefinition,
  mergeDomains,
} from '@/core/axis/domain'
import {
  combineAreasDomain,
  combineDotsDomain,
  combineLinesDomain,
  filterReferenceElements,
} from '@/core/axis/references'
import { combineDomainOfStackGroups, combineStackGroups } from '@/core/axis/stacks'
import { implicitXAxis, implicitYAxis, implicitZAxis } from '@/core/axis/settings'
import type { ChartRegistries } from './registries'
import type { Registry } from './registry'

export type CartesianAxisType = 'xAxis' | 'yAxis' | 'zAxis'

export interface AxisModel<S extends BaseCartesianAxis = BaseCartesianAxis> {
  readonly settings: ComputedRef<S>
  readonly dataWithIndexes: ComputedRef<ChartDataState>
  readonly graphicalData: ComputedRef<ChartData>
  readonly displayedData: ComputedRef<ChartData>
  readonly appliedValues: ComputedRef<AppliedChartData>
  readonly domainDefinition: ComputedRef<AxisDomain>
  readonly numericalValues: ComputedRef<readonly AppliedChartDataWithErrorDomain[]>
  readonly stackGroups: ComputedRef<Record<string, StackGroup>>
  readonly stackDomain: ComputedRef<NumberDomain | undefined>
  readonly domain: ComputedRef<NumberDomain | CategoricalDomain | undefined>
}

interface AxisModels {
  xAxis: AxisModel<XAxisSettings>
  yAxis: AxisModel<YAxisSettings>
  zAxis: AxisModel<ZAxisSettings>
}

interface AxisSources extends Pick<ChartRegistries, 'items' | 'axes' | 'references'> {
  dataWithIndexes: ComputedRef<ChartDataState>
  layout: () => LayoutType
  stackOffset: () => StackOffsetType
}

export type AxisLookup = <T extends CartesianAxisType>(type: T, id: AxisId) => AxisModels[T]

function createAxis<S extends BaseCartesianAxis>(
  sources: AxisSources,
  type: CartesianAxisType,
  id: AxisId,
  registry: Registry<S>,
  implicit: S,
): AxisModel<S> {
  const settings = computed(() => {
    const entries = registry.entries.value
    for (let i = entries.length - 1; i >= 0; i--) {
      if (String(entries[i].id) === String(id))
        return entries[i]
    }
    return implicit
  })
  const items = computed(() => combineGraphicalItemsSettings(
    sources.items.cartesian.entries.value,
    settings.value,
    itemAxisPredicate(type, id),
  ))
  const unstacked = computed(() => filterGraphicalNotStackedItems(items.value))
  const dataWithIndexes = sources.dataWithIndexes
  const graphicalData = computed(() => combineGraphicalItemsData(items.value))
  const displayedData = computed(() => combineDisplayedData(graphicalData.value, dataWithIndexes.value))
  const appliedValues = computed(() => combineAppliedValues(displayedData.value, settings.value, items.value))
  const domainDefinition = computed(() => getDomainDefinition(settings.value))
  const stackGroups = computed(() => combineStackGroups(displayedData.value, items.value, sources.stackOffset()))
  const stackDomain = computed(() => combineDomainOfStackGroups(stackGroups.value, dataWithIndexes.value, type))
  const numericalValues = computed(() => combineAppliedNumericalValuesIncludingErrorValues(
    displayedData.value,
    settings.value,
    unstacked.value,
    type,
  ))
  const dots = computed(() => filterReferenceElements(sources.references.dots.entries.value, type, id))
  const lines = computed(() => filterReferenceElements(sources.references.lines.entries.value, type, id))
  const areas = computed(() => filterReferenceElements(sources.references.areas.entries.value, type, id))
  const referencesDomain = computed(() => mergeDomains(
    combineDotsDomain(dots.value, type),
    combineAreasDomain(areas.value, type),
    combineLinesDomain(lines.value, type),
  ))
  const numericalDomain = computed(() => combineNumericalDomain(
    settings.value,
    domainDefinition.value,
    stackDomain.value,
    numericalValues.value,
    referencesDomain.value,
  ))
  const domain = computed(() => combineAxisDomain(
    settings.value,
    sources.layout(),
    displayedData.value,
    appliedValues.value,
    sources.stackOffset(),
    type,
    numericalDomain.value,
  ))
  return {
    settings,
    dataWithIndexes,
    graphicalData,
    displayedData,
    appliedValues,
    domainDefinition,
    numericalValues,
    stackGroups,
    stackDomain,
    domain,
  }
}

function keyed<V>(scope: EffectScope, build: (id: AxisId) => V) {
  const cache = new Map<AxisId, V>()
  onScopeDispose(() => cache.clear())
  return (id: AxisId): V => {
    const existing = cache.get(id)
    if (existing !== undefined)
      return existing
    // A child may request the first model; the chart owns its lifetime.
    const model = scope.run(() => build(id))
    if (model === undefined)
      throw new Error('vccs: cannot read an axis after its chart is disposed.')
    cache.set(id, model)
    return model
  }
}

export function createAxes(scope: EffectScope, sources: AxisSources): AxisLookup {
  const lookup: { [T in CartesianAxisType]: (id: AxisId) => AxisModels[T] } = {
    xAxis: keyed(scope, id => createAxis(sources, 'xAxis', id, sources.axes.xAxis, implicitXAxis)),
    yAxis: keyed(scope, id => createAxis(sources, 'yAxis', id, sources.axes.yAxis, implicitYAxis)),
    zAxis: keyed(scope, id => createAxis(sources, 'zAxis', id, sources.axes.zAxis, implicitZAxis)),
  }
  return function axis<T extends CartesianAxisType>(type: T, id: AxisId): AxisModels[T] {
    return lookup[type](id)
  }
}
