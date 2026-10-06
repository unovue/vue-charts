import { computed } from 'vue'
import type { AxisId } from '@/types/axis'
import type { Size } from '@/types/common'
import type { XAxisSettings, YAxisSettings } from '@/types/axisSettings'
import type { AxisModel } from './axis'
import type { AxisScaleSources } from './axisScale'
import type { ChartRegistries } from './registries'
import { gridAxis, xAxisPosition, yAxisPosition } from '@/core/axis/position'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'

export function createAxisLayout(
  sources: AxisScaleSources & Pick<ChartRegistries, 'axes'> & { size: () => Size },
  axis: AxisModel<XAxisSettings> | AxisModel<YAxisSettings>,
  type: 'xAxis' | 'yAxis',
  id: AxisId,
) {
  const size = computed(() => {
    const settings = axis.settings.value
    const offset = sources.offset()
    if ('height' in settings)
      return { width: offset.width, height: settings.height }
    return { width: typeof settings.width === 'number' ? settings.width : DEFAULT_Y_AXIS_WIDTH, height: offset.height }
  })
  const position = computed(() => {
    const settings = axis.settings.value
    if ('height' in settings)
      return xAxisPosition(sources.axes.xAxis.entries.value, settings, sources.offset(), sources.size().height, id)
    return yAxisPosition(sources.axes.yAxis.entries.value, settings, sources.offset(), sources.size().width, id)
  })
  const grid = computed(() => gridAxis(axis.settings.value, sources.layout(), type, axis.categoricalDomain.value, axis.duplicateDomain.value, axis.niceTicks.value, axis.range.value, axis.realScaleType.value, axis.scale.value))
  return { size, position, grid }
}
