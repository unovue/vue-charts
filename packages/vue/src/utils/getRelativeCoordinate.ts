export type RelativePointer = { relativeX: number, relativeY: number }

type MousePointer = { clientX: number, clientY: number, currentTarget: Element | HTMLElement }

function isSvgPointer(pointer: MousePointer): pointer is MousePointer & { currentTarget: SVGGraphicsElement } {
  return 'getBBox' in pointer.currentTarget && typeof pointer.currentTarget.getBBox === 'function'
}

/**
 * Converts a screen-space mouse coordinate to SVG coordinate space using the
 * SVG element's own current transformation matrix (CTM).
 *
 * Using getScreenCTM().inverse() is the canonical SVG approach and correctly
 * handles viewBox mapping, preserveAspectRatio letterboxing, and CSS transforms
 * in one shot — no manual scale math required.
 */
function svgCoordinate(svg: SVGSVGElement, clientX: number, clientY: number): RelativePointer {
  const ctm = svg.getScreenCTM()
  if (!ctm) {
    return { relativeX: Math.round(clientX), relativeY: Math.round(clientY) }
  }
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const svgPt = pt.matrixTransform(ctm.inverse())
  return {
    relativeX: Math.round(svgPt.x),
    relativeY: Math.round(svgPt.y),
  }
}

export function getRelativeCoordinate(event: MousePointer): RelativePointer {
  const target = event.currentTarget

  if (isSvgPointer(event)) {
    // currentTarget is an SVG graphics element; use its root SVG's CTM
    const svg = (target as SVGElement).ownerSVGElement as SVGSVGElement | null
    if (svg?.getScreenCTM) {
      return svgCoordinate(svg, event.clientX, event.clientY)
    }
    // Fallback: derive scale from bounding rect vs getBBox dimensions
    const rect = target.getBoundingClientRect()
    const bbox = (target as SVGGraphicsElement).getBBox()
    const scaleX = bbox.width > 0 ? rect.width / bbox.width : 1
    const scaleY = bbox.height > 0 ? rect.height / bbox.height : 1
    return {
      relativeX: Math.round((event.clientX - rect.left) / scaleX),
      relativeY: Math.round((event.clientY - rect.top) / scaleY),
    }
  }

  // currentTarget is an HTMLElement (the chart wrapper div).
  // Find the child SVG and use its screen CTM for accurate coordinate mapping.
  // This handles viewBox + preserveAspectRatio letterboxing (e.g. when the wrapper
  // is flex-shrunk in one axis only, the SVG scales uniformly and adds an offset on
  // the other axis — getScreenCTM captures all of this automatically).
  const el = target as HTMLElement
  const svgEl = el.querySelector<SVGSVGElement>('svg')
  if (svgEl?.getScreenCTM) {
    return svgCoordinate(svgEl, event.clientX, event.clientY)
  }

  // Final fallback: no SVG found; derive scale from element dimensions
  const rect = target.getBoundingClientRect()
  const styleWidth = el.style ? parseFloat(el.style.width) : NaN
  const styleHeight = el.style ? parseFloat(el.style.height) : NaN
  const coordWidth = styleWidth > 0 ? styleWidth : el.offsetWidth
  const coordHeight = styleHeight > 0 ? styleHeight : el.offsetHeight
  const scaleX = coordWidth > 0 ? rect.width / coordWidth : 1
  const scaleY = coordHeight > 0 ? rect.height / coordHeight : 1
  return {
    relativeX: Math.round((event.clientX - rect.left) / scaleX),
    relativeY: Math.round((event.clientY - rect.top) / scaleY),
  }
}
