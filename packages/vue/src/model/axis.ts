import { createAxisLayout } from './axisLayout'
import { createAxisScale } from './axisScale'
import type { AxisScaleModel, AxisScaleSources } from './axisScale'
import { createPolarAxis } from './polarAxis'
import type { PolarLayout } from './polar'
import { combineCalculatedPadding, combineSmallestDistance, combineXAxisRange, combineYAxisRange } from '@/core/axis/range'
import type { CategoricalDomain } from '@/types/categorical'
import type { ComputedRef, EffectScope } from 'vue'
import { computed, onScopeDispose } from 'vue'
import type { AxisId, AxisRange, AxisType, BaseCartesianAxis, NumberDomain } from '@/types/axis'
import type { XAxisSettings, YAxisSettings, ZAxisSettings } from '@/types/axisSettings'
import type { AppliedChartData, ChartData, ChartDataState } from '@/types/chartData'
import type { LayoutType, StackOffsetType } from '@/types/common'
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
import type { AxisRegistry, ChartRegistries } from './registries'

export type CartesianAxisType = 'xAxis' | 'yAxis' | 'zAxis'

export interface AxisModel<S extends BaseCartesianAxis = BaseCartesianAxis> extends AxisScaleModel<S> {
  readonly settings: ComputedRef<S>
  readonly displayedData: ComputedRef<ChartData>
  readonly stackGroups: ComputedRef<Record<string, StackGroup>>
  readonly domain: ComputedRef<NumberDomain | CategoricalDomain | undefined>
}

interface AxisModels {
  angleAxis: ReturnType<typeof createPolarAxis>
  radiusAxis: ReturnType<typeof createPolarAxis>
  xAxis: AxisModel<XAxisSettings> & ReturnType<typeof createAxisLayout>
  yAxis: AxisModel<YAxisSettings> & ReturnType<typeof createAxisLayout>
  zAxis: AxisModel<ZAxisSettings>
}

interface AxisSources extends AxisScaleSources, Pick<ChartRegistries, 'items' | 'axes' | 'references'> {
  size: () => import('@/types/common').Size
  barCategoryGap: () => number | string
  polarLayout: PolarLayout
  dataWithIndexes: ComputedRef<ChartDataState>
  layout: () => LayoutType
  stackOffset: () => StackOffsetType
}

export type AxisLookup = <T extends AxisType>(type: T, id: AxisId) => AxisModels[T]

function createAxis<S extends BaseCartesianAxis>(
  sources: AxisSources,
  type: CartesianAxisType,
  id: AxisId,
  registry: AxisRegistry<S>,
  implicit: S,
  readRange: (settings: S, applied: AppliedChartData) => AxisRange,
): AxisModel<S> {
  const settings = computed(() => registry.byId.value.get(String(id)) ?? implicit)
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
  const range = computed(() => readRange(settings.value, appliedValues.value))
  return {
    ...createAxisScale(sources, type, settings, domain, appliedValues, range),
    settings,
    displayedData,
    stackGroups,
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
  const lookup: { [T in AxisType]: (id: AxisId) => AxisModels[T] } = {
    xAxis: keyed(scope, (id) => {
      const model = createAxis(sources, 'xAxis', id, sources.axes.xAxis, implicitXAxis, (axis, values) => {
        const offset = sources.offset()
        const calculated = typeof axis.padding === 'string'
          ? combineCalculatedPadding(
              combineSmallestDistance(values, axis),
              sources.layout(),
              sources.barCategoryGap(),
              offset,
              axis.padding,
            )
          : 0
        return combineXAxisRange(offset, axis.padding, calculated)
      })
      return { ...model, ...createAxisLayout(sources, model, 'xAxis', id) }
    }),
    yAxis: keyed(scope, (id) => {
      const model = createAxis(sources, 'yAxis', id, sources.axes.yAxis, implicitYAxis, (axis, values) => {
        const offset = sources.offset()
        const calculated = typeof axis.padding === 'string'
          ? combineCalculatedPadding(
              combineSmallestDistance(values, axis),
              sources.layout(),
              sources.barCategoryGap(),
              offset,
              axis.padding,
            )
          : 0
        return combineYAxisRange(offset, sources.layout(), axis.padding, calculated)
      })
      return { ...model, ...createAxisLayout(sources, model, 'yAxis', id) }
    }),
    zAxis: keyed(scope, id => createAxis(sources, 'zAxis', id, sources.axes.zAxis, implicitZAxis, axis => axis.range)),
    angleAxis: keyed(scope, id => createPolarAxis(sources, 'angleAxis', id)),
    radiusAxis: keyed(scope, id => createPolarAxis(sources, 'radiusAxis', id)),
  }
  return function axis<T extends AxisType>(type: T, id: AxisId): AxisModels[T] {
    return lookup[type](id)
  }
}
