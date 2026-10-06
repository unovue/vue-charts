import { computed } from 'vue'
import type { ChartLayoutState } from '@/state/chartLayout'
import type { BrushSettings } from '@/state/chartBrush'
import type { LegendSettings } from '@/state/chartLegend'
import type { Size } from '@/types/common'
import type { ChartRegistries } from './registries'
import { combineBrushDimensions, combineChartOffset, combineChartViewBox, combineRegisteredAxes } from '@/core/layout'

interface LayoutSources {
  layout: () => ChartLayoutState
  brush: () => BrushSettings
  legendSettings: () => LegendSettings
  legendSize: () => Size
  axes: ChartRegistries['axes']
}

export function createLayout(sources: LayoutSources) {
  const width = computed(() => sources.layout().width)
  const height = computed(() => sources.layout().height)
  const margin = computed(() => sources.layout().margin)
  const xAxes = computed(() => combineRegisteredAxes(sources.axes.xAxis.entries.value))
  const yAxes = computed(() => combineRegisteredAxes(sources.axes.yAxis.entries.value))
  const brushHeight = computed(() => sources.brush().height)
  const legendSettings = computed(sources.legendSettings)
  const legendSize = computed(sources.legendSize)
  const offset = computed(() => combineChartOffset(
    { width: width.value, height: height.value },
    margin.value,
    brushHeight.value,
    xAxes.value,
    yAxes.value,
    legendSettings.value,
    legendSize.value,
  ))
  const viewBox = computed(() => combineChartViewBox(offset.value))
  const axisViewBox = computed(() => ({ x: 0, y: 0, width: width.value, height: height.value }))
  const brushDimensions = computed(() => combineBrushDimensions(sources.brush(), offset.value, margin.value))
  return { width, height, margin, offset, viewBox, axisViewBox, brushDimensions }
}

export type ChartGeometry = ReturnType<typeof createLayout>
