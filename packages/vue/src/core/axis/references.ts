import type {
  ReferenceAreaSettings,
  ReferenceDotSettings,
  ReferenceElementSettings,
  ReferenceLineSettings,
} from '@/types/reference'
import type { AxisId, AxisType, NumberDomain } from '@/types/axis'
import { onlyAllowNumbers } from './data'

export function filterReferenceElements<T extends ReferenceElementSettings>(
  elements: ReadonlyArray<T>,
  axisType: AxisType,
  axisId: AxisId,
): ReadonlyArray<T> {
  return elements
    .filter(el => el.ifOverflow === 'extendDomain')
    .filter((el) => {
      if (axisType === 'xAxis') {
        return el.xAxisId === axisId
      }
      return el.yAxisId === axisId
    })
}

export function combineDotsDomain(
  dots: ReadonlyArray<ReferenceDotSettings> | undefined,
  axisType: AxisType,
): NumberDomain | undefined {
  const allCoords = onlyAllowNumbers((dots ?? []).map(dot => (axisType === 'xAxis' ? dot.x : dot.y)))
  if (allCoords.length === 0) {
    return undefined
  }
  return [Math.min(...allCoords), Math.max(...allCoords)]
}

export function combineAreasDomain(
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

export function combineLinesDomain(
  lines: ReadonlyArray<ReferenceLineSettings> | undefined,
  axisType: AxisType,
): NumberDomain | undefined {
  const allCoords = onlyAllowNumbers((lines ?? []).map(line => (axisType === 'xAxis' ? line.x : line.y)))
  if (allCoords.length === 0) {
    return undefined
  }
  return [Math.min(...allCoords), Math.max(...allCoords)]
}
