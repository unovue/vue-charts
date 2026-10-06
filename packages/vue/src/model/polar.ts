import { polarViewBox } from '@/core/axis/polar'
import { computed } from 'vue'
import type { ChartOffsetRequired, LayoutType, Size } from '@/types/common'
import type { PolarChartOptions } from '@/types/polarOptions'
import { getMaxRadius } from '@/utils/polar'
import { getPercentValue } from '@/utils/data'

export function createPolarLayout(sources: {
  layout: () => LayoutType
  size: () => Size
  offset: () => ChartOffsetRequired
  polar: () => PolarChartOptions | null
}) {
  const maxRadius = computed(() => getMaxRadius(sources.size().width, sources.size().height, sources.offset()))
  const innerRadius = computed(() => sources.polar() == null
    ? undefined
    : getPercentValue(sources.polar()!.innerRadius, maxRadius.value, 0))
  const outerRadius = computed(() => sources.polar() == null
    ? undefined
    : getPercentValue(sources.polar()!.outerRadius, maxRadius.value, maxRadius.value * 0.8))
  const angleRange = computed<readonly [number, number]>(() => {
    const options = sources.polar()
    return options ? [options.startAngle, options.endAngle] : [0, 0]
  })
  const radiusRange = computed<readonly [number, number] | undefined>(() =>
    innerRadius.value == null || outerRadius.value == null ? undefined : [innerRadius.value, outerRadius.value])
  const viewBox = computed(() => polarViewBox(sources.layout(), sources.polar(), innerRadius.value, outerRadius.value, sources.size()))
  return { maxRadius, innerRadius, outerRadius, angleRange, radiusRange, viewBox }
}

export type PolarLayout = ReturnType<typeof createPolarLayout>
