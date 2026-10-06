import { computed } from 'vue'
import type { AxisId } from '@/types/axis'
import type { AngleAxisSettings } from '@/types/axisSettings'
import type { ChartDataState } from '@/types/chartData'
import type { StackOffsetType } from '@/types/common'
import type { ComputedRef } from 'vue'
import type { ChartRegistries } from './registries'
import type { AxisScaleSources } from './axisScale'
import { createAxisScale } from './axisScale'
import type { PolarLayout } from './polar'
import { combineAppliedValues, combineDisplayedData, combineGraphicalItemsData, combineGraphicalItemsSettings, itemAxisPredicate } from '@/core/axis/data'
import { combineAxisDomain, combineNumericalDomain, getDomainDefinition } from '@/core/axis/domain'
import { combineDomainOfStackGroups, combineStackGroups } from '@/core/axis/stacks'
import { implicitAngleAxis, implicitRadialBarAngleAxis, implicitRadialBarRadiusAxis, implicitRadiusAxis } from '@/core/axis/polarSettings'
import { getValueByDataKey } from '@/core/data'

export function createPolarAxis(
  sources: AxisScaleSources & Pick<ChartRegistries, 'items' | 'axes'> & {
    dataWithIndexes: ComputedRef<ChartDataState>
    stackOffset: () => StackOffsetType
    polarLayout: PolarLayout
  },
  type: 'angleAxis' | 'radiusAxis',
  id: AxisId,
) {
  const settings = computed<AngleAxisSettings>(() => {
    const entries = sources.axes[type].entries.value
    for (let i = entries.length - 1; i >= 0; i--) {
      if (String(entries[i].id) === String(id))
        return entries[i]
    }
    if (sources.layout() === 'radial')
      return type === 'angleAxis' ? implicitRadialBarAngleAxis : implicitRadialBarRadiusAxis
    return type === 'angleAxis' ? implicitAngleAxis : implicitRadiusAxis
  })
  const items = computed(() => combineGraphicalItemsSettings(
    sources.items.polar.entries.value,
    settings.value,
    itemAxisPredicate(type, id),
  ))
  const graphicalData = computed(() => combineGraphicalItemsData(items.value))
  const displayedData = computed(() => {
    const { chartData = [] } = sources.dataWithIndexes.value
    return combineDisplayedData(graphicalData.value, { chartData, dataStartIndex: 0, dataEndIndex: chartData.length - 1 })
  })
  const appliedValues = computed(() => combineAppliedValues(displayedData.value, settings.value, items.value))
  const domainDefinition = computed(() => getDomainDefinition(settings.value))
  const numericalValues = computed(() => {
    const data = displayedData.value
    const axis = settings.value
    if (items.value.length) {
      return data.flatMap(row => items.value.map(item => ({
        value: getValueByDataKey(row, axis.dataKey ?? item.dataKey!),
        errorDomain: [],
      })))
    }
    return data.map(row => ({ value: axis.dataKey == null ? row : getValueByDataKey(row, axis.dataKey), errorDomain: [] }))
  })
  const stackGroups = computed(() => combineStackGroups(displayedData.value, items.value, sources.stackOffset()))
  const stackDomain = computed(() => combineDomainOfStackGroups(stackGroups.value, sources.dataWithIndexes.value, type))
  const numericalDomain = computed(() => combineNumericalDomain(settings.value, domainDefinition.value, stackDomain.value, numericalValues.value, undefined))
  const domain = computed(() => combineAxisDomain(settings.value, sources.layout(), displayedData.value, appliedValues.value, sources.stackOffset(), type, numericalDomain.value))
  const range = type === 'angleAxis' ? sources.polarLayout.angleRange : sources.polarLayout.radiusRange
  return { settings, items, graphicalData, displayedData, appliedValues, domainDefinition, numericalValues, stackGroups, stackDomain, domain, ...createAxisScale(sources, type, settings, domain, appliedValues, range) }
}
