import { combineRegisteredAxes } from '@/core/layout'
import type { AxisId } from '@/types/axis'
import type { XAxisSettings, YAxisSettings } from '@/types/axisSettings'
import type { ChartOffsetRequired } from '@/types/common'
import { DEFAULT_Y_AXIS_WIDTH } from '@/utils/const'

export function combineXAxisPosition(
  axes: readonly XAxisSettings[],
  axis: XAxisSettings,
  offset: ChartOffsetRequired,
  height: number,
  id: AxisId,
) {
  const peers = combineRegisteredAxes(axes).filter(a => a.orientation === axis.orientation && a.mirror === axis.mirror)
    .sort((a, b) => a.id! < b.id! ? -1 : a.id! > b.id! ? 1 : 0)
  let position = axis.orientation === 'top' ? offset.top : height - offset.bottom
  const before = (axis.orientation === 'top' && !axis.mirror) || (axis.orientation === 'bottom' && axis.mirror)
  for (const peer of peers) {
    if (String(peer.id) === String(id))
      return { x: offset.left, y: position - Number(before) * peer.height }
    position += (before ? -1 : 1) * peer.height
  }
  return { x: offset.left, y: 0 }
}

export function combineYAxisPosition(
  axes: readonly YAxisSettings[],
  axis: YAxisSettings,
  offset: ChartOffsetRequired,
  width: number,
  id: AxisId,
) {
  const peers = combineRegisteredAxes(axes).filter(a => a.orientation === axis.orientation && a.mirror === axis.mirror)
    .sort((a, b) => a.id! < b.id! ? -1 : a.id! > b.id! ? 1 : 0)
  let position = axis.orientation === 'left' ? offset.left : width - offset.right
  const before = (axis.orientation === 'left' && !axis.mirror) || (axis.orientation === 'right' && axis.mirror)
  for (const peer of peers) {
    const size = typeof peer.width === 'number' ? peer.width : DEFAULT_Y_AXIS_WIDTH
    if (String(peer.id) === String(id))
      return { x: position - Number(before) * size, y: offset.top }
    position += (before ? -1 : 1) * size
  }
  return { x: 0, y: offset.top }
}

export function combineGridAxis(
  axis: XAxisSettings | YAxisSettings,
  layout: import('@/types/common').LayoutType,
  type: 'xAxis' | 'yAxis',
  categoricalDomain: readonly unknown[] | undefined,
  duplicateDomain: readonly unknown[] | undefined,
  niceTicks: readonly number[] | undefined,
  range: import('@/types/axis').AxisRange | undefined,
  realScaleType: string | undefined,
  scale: import('@/types/scale').RechartsScale | undefined,
) {
  return { ...axis, axisType: type, categoricalDomain, duplicateDomain, isCategorical: layout === 'horizontal' ? type === 'xAxis' : type === 'yAxis', niceTicks, range, realScaleType, scale: scale! }
}
