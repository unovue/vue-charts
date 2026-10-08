import type {
  ReferenceAreaSettings,
  ReferenceDotSettings,
  ReferenceElementSettings,
  ReferenceLineSettings,
} from '@/types/reference'
import type { AxisId, AxisType, NumberDomain } from '@/types/axis'
import { onlyAllowNumbers } from './data'
import { sameAxis } from './key'

export function filterReferenceElements<T extends ReferenceElementSettings>(
  elements: ReadonlyArray<T>,
  axisType: AxisType,
  axisId: AxisId,
): ReadonlyArray<T> {
  return elements
    .filter(el => el.ifOverflow === 'extendDomain')
    .filter((el) => {
      if (axisType === 'xAxis') {
        return sameAxis(el.xAxisId, axisId)
      }
      return sameAxis(el.yAxisId, axisId)
    })
}

export function dotsDomain(
  dots: ReadonlyArray<ReferenceDotSettings> | undefined,
  axisType: AxisType,
): NumberDomain | undefined {
  const allCoords = onlyAllowNumbers((dots ?? []).map(dot => (axisType === 'xAxis' ? dot.x : dot.y)))
  if (allCoords.length === 0) {
    return undefined
  }
  return [Math.min(...allCoords), Math.max(...allCoords)]
}

export function areasDomain(
  areas: ReadonlyArray<ReferenceAreaSettings> | undefined,
  axisType: AxisType,
): NumberDomain | undefined {
  const allCoords = onlyAllowNumbers(
    (areas ?? []).flatMap(area => [axisType === 'xAxis' ? area.x1 : area.y1, axisType === 'xAxis' ? area.x2 : area.y2]),
  )
  if (allCoords.length === 0) {
    return undefined
  }
  return [Math.min(...allCoords), Math.max(...allCoords)]
}

export function linesDomain(
  lines: ReadonlyArray<ReferenceLineSettings> | undefined,
  axisType: AxisType,
): NumberDomain | undefined {
  const allCoords = onlyAllowNumbers((lines ?? []).map(line => (axisType === 'xAxis' ? line.x : line.y)))
  if (allCoords.length === 0) {
    return undefined
  }
  return [Math.min(...allCoords), Math.max(...allCoords)]
}
