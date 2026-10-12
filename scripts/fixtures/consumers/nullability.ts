import { useActiveTooltipCoordinate } from 'vccs'

export function readTooltipCoordinate() {
  const coordinate = useActiveTooltipCoordinate()
  // @ts-expect-error No selection means the coordinate can be undefined.
  coordinate.value.x
  return coordinate.value?.x
}
