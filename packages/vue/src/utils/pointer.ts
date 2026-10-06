import type { ChartPointer } from '@/types'

export function getChartPointer(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'currentTarget'>,
): ChartPointer | undefined {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const scaleX = rect.width / target.offsetWidth
  const scaleY = rect.height / target.offsetHeight
  return {
    /*
     * Here it's important to use:
     * - event.clientX and event.clientY to get the mouse position relative to the viewport, including scroll.
     * - pageX and pageY are not used because they are relative to the whole document, and ignore scroll.
     * - rect.left and rect.top are used to get the position of the chart relative to the viewport.
     * - offsetX and offsetY are not used because they are relative to the offset parent
     *  which may or may not be the same as the clientX and clientY, depending on the position of the chart in the DOM
     *  and surrounding element styles. CSS position: relative, absolute, fixed, will change the offset parent.
     * - scaleX and scaleY are necessary for when the chart element is scaled using CSS `transform: scale(N)`.
     */
    chartX: Math.round((event.clientX - rect.left) / scaleX),
    chartY: Math.round((event.clientY - rect.top) / scaleY),
  }
}
