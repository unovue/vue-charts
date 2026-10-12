import { ref, watch } from 'vue'
import { scalePoint } from 'd3-scale'
import range from 'es-toolkit/compat/range'
import type { BrushState } from '../type'
import type { ChartData } from '@/types/chartData'

export function useBrushState(
  getX: () => number | undefined,
  getWidth: () => number | undefined,
  getTravellerWidth: () => number,
  chartData: () => ChartData | undefined,
  startIndex: () => number,
  endIndex: () => number,
) {
  const brushState = ref<BrushState>({
    isTravellerMoving: false,
    isTravellerFocused: false,
    isSlideMoving: false,
    isTextActive: false,
    startX: undefined,
    endX: undefined,
    slideMoveStartX: undefined,
    movingTravellerId: undefined,
    brushMoveStartX: undefined,
    scale: undefined,
    scaleValues: undefined,
  })

  // Track previous dimensions to detect resize vs index-only changes
  let prevX: number | undefined
  let prevWidth: number | undefined
  let prevTravellerWidth: number | undefined

  const createScale = (data: ChartData, si: number, ei: number, x: number, width: number, tw: number) => {
    if (!data?.length)
      return null

    const scale = scalePoint<number>()
      .domain(range(0, data.length))
      .range([x, x + width - tw])

    const scaleValues = scale.domain().map(entry => scale(entry)!)

    return {
      startX: scale(si)!,
      endX: scale(ei)!,
      scale,
      scaleValues,
    }
  }

  watch(
    [chartData, getX, getWidth, getTravellerWidth, startIndex, endIndex],
    ([data, x, width, tw, si, ei]) => {
      if (!data?.length || x == null || width == null)
        return

      const result = createScale(data, si, ei, x, width, tw)
      if (!result)
        return

      const isDimensionChange = x !== prevX || width !== prevWidth || tw !== prevTravellerWidth
      prevX = x
      prevWidth = width
      prevTravellerWidth = tw

      const isInteracting = brushState.value.isSlideMoving || brushState.value.isTravellerMoving || brushState.value.isTravellerFocused

      if (isDimensionChange) {
        // Dimension change (resize): always recalculate positions from the new scale
        brushState.value.startX = result.startX
        brushState.value.endX = result.endX
        brushState.value.scale = result.scale
        brushState.value.scaleValues = result.scaleValues
      }
      else if (isInteracting) {
        // Index change during active drag/focus: only update scale/scaleValues
        brushState.value.scale = result.scale
        brushState.value.scaleValues = result.scaleValues
      }
      else {
        // No interaction, no dimension change: full update
        brushState.value.startX = result.startX
        brushState.value.endX = result.endX
        brushState.value.scale = result.scale
        brushState.value.scaleValues = result.scaleValues
      }
    },
    { immediate: true },
  )

  return { brushState }
}
