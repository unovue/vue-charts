import { computed } from 'vue'
import type { AxisId } from '@/types/axis'
import type { AngleAxisSettings } from '@/types/axisSettings'
import type { StackOffsetType } from '@/types/common'
import type { ChartRegistries } from './registries'
import type { AxisScaleSources } from './axisScale'
import { axisKey } from '@/core/axis/key'
import { createAxisScale } from './axisScale'
import type { createChartData } from './dataRange'
import type { PolarLayout } from './polar'
import { appliedValues as getAppliedValues, graphicalItemsData, graphicalItemsSettings, itemAxisPredicate } from '@/core/axis/data'
import { axisDomain, getDomainDefinition, numericalDomain as getNumericalDomain } from '@/core/axis/domain'
import { stackDomain as getStackDomain, stackGroups as getStackGroups } from '@/core/axis/stacks'
import { implicitAngleAxis, implicitRadialBarAngleAxis, implicitRadialBarRadiusAxis, implicitRadiusAxis } from '@/core/axis/polarSettings'
import { getValueByDataKey } from '@/core/data'

export function createPolarAxis(
  sources: AxisScaleSources & Pick<ChartRegistries, 'items' | 'axes'> & {
    dataRange: ReturnType<typeof createChartData>
    stackOffset: () => StackOffsetType
    reverseStackOrder: () => boolean
    polarLayout: PolarLayout
  },
  type: 'angleAxis' | 'radiusAxis',
  id: AxisId,
) {
  const settings = computed<AngleAxisSettings>(() => {
    const axis = sources.axes[type].byId.value.get(axisKey(id))
    if (axis)
      return axis
    if (sources.layout() === 'radial')
      return type === 'angleAxis' ? implicitRadialBarAngleAxis : implicitRadialBarRadiusAxis
    return type === 'angleAxis' ? implicitAngleAxis : implicitRadiusAxis
  })
  const items = computed(() => graphicalItemsSettings(
    sources.items.polar.entries.value,
    settings.value,
    itemAxisPredicate(type, id),
  ))
  const graphicalData = computed(() => graphicalItemsData(items.value))
  const displayedData = computed(() => sources.dataRange.displayedData({ data: graphicalData.value }, 'all') ?? [])
  const appliedValues = computed(() => getAppliedValues(displayedData.value, settings.value, items.value))
  const domainDefinition = computed(() => getDomainDefinition(settings.value))
  const numericalValues = computed(() => {
    const data = displayedData.value
    const axis = settings.value
    if (items.value.length) {
      return data.flatMap(row => items.value.map(item => ({
        value: getValueByDataKey(row, axis.dataKey ?? item.dataKey),
        errorDomain: [],
      })))
    }
    return data.map(row => ({ value: axis.dataKey == null ? row : getValueByDataKey(row, axis.dataKey), errorDomain: [] }))
  })
  const stackGroups = computed(() => getStackGroups(displayedData.value, items.value, sources.stackOffset(), sources.reverseStackOrder()))
  const stackDomain = computed(() => getStackDomain(stackGroups.value, sources.dataRange.state.value, type))
  const numericalDomain = computed(() => getNumericalDomain(settings.value, domainDefinition.value, stackDomain.value, numericalValues.value, undefined))
  const domain = computed(() => axisDomain(settings.value, sources.layout(), displayedData.value, appliedValues.value, sources.stackOffset(), type, numericalDomain.value))
  const range = type === 'angleAxis' ? sources.polarLayout.angleRange : sources.polarLayout.radiusRange
  return { settings, displayedData, stackGroups, domain, ...createAxisScale(sources, type, settings, domain, appliedValues, range) }
}
