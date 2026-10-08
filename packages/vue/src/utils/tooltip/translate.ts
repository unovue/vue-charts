import type { CSSProperties } from 'vue'
import { isNumber } from '@/utils/validate'
import type { AllowInDimension, Coordinate } from '@/types'
import type { CartesianViewBox } from '@/types/viewBox'

type Dimension2D = 'x' | 'y'

const CSS_CLASS_PREFIX = 'v-charts-tooltip-wrapper'

const TOOLTIP_HIDDEN: CSSProperties = { visibility: 'hidden' }

function getTooltipCSSClassName({
  coordinate,
  translateX,
  translateY,
}: {
  translateX: number | undefined
  translateY: number | undefined
  coordinate: Partial<Coordinate> | undefined
}) {
  return [CSS_CLASS_PREFIX, {
    [`${CSS_CLASS_PREFIX}-right`]:
      isNumber(translateX) && coordinate && isNumber(coordinate.x) && translateX >= coordinate.x,
    [`${CSS_CLASS_PREFIX}-left`]:
      isNumber(translateX) && coordinate && isNumber(coordinate.x) && translateX < coordinate.x,
    [`${CSS_CLASS_PREFIX}-bottom`]:
      isNumber(translateY) && coordinate && isNumber(coordinate.y) && translateY >= coordinate.y,
    [`${CSS_CLASS_PREFIX}-top`]:
      isNumber(translateY) && coordinate && isNumber(coordinate.y) && translateY < coordinate.y,
  }]
}

function getTooltipTranslateXY({
  allowEscapeViewBox,
  coordinate,
  key,
  offsetTopLeft,
  position,
  reverseDirection,
  tooltipDimension,
  viewBox,
  viewBoxDimension,
}: {
  allowEscapeViewBox: AllowInDimension
  coordinate: Coordinate
  key: Dimension2D
  offsetTopLeft: number
  position: Partial<Coordinate>
  reverseDirection: AllowInDimension
  tooltipDimension: number
  viewBox: CartesianViewBox
  viewBoxDimension: number | undefined
}): number {
  if (position && isNumber(position[key])) {
    return position[key]
  }

  const negative = coordinate[key] - tooltipDimension - (offsetTopLeft > 0 ? offsetTopLeft : 0)
  const positive = coordinate[key] + offsetTopLeft

  if (allowEscapeViewBox[key]) {
    return reverseDirection[key] ? negative : positive
  }

  const viewBoxKey = viewBox[key]
  if (viewBoxKey == null) {
    return 0
  }

  if (reverseDirection[key]) {
    const tooltipBoundary = negative
    const viewBoxBoundary = viewBoxKey
    if (tooltipBoundary < viewBoxBoundary) {
      return Math.max(positive, viewBoxKey)
    }
    return Math.max(negative, viewBoxKey)
  }

  if (viewBoxDimension == null) {
    return 0
  }
  const tooltipBoundary = positive + tooltipDimension
  const viewBoxBoundary = viewBoxKey + viewBoxDimension
  if (tooltipBoundary > viewBoxBoundary) {
    return Math.max(negative, viewBoxKey)
  }
  return Math.max(positive, viewBoxKey)
}

function getTransformStyle({
  translateX,
  translateY,
  useTranslate3d,
}: {
  useTranslate3d: boolean
  translateX: number
  translateY: number
}): CSSProperties {
  return {
    transform: useTranslate3d
      ? `translate3d(${translateX}px, ${translateY}px, 0)`
      : `translate(${translateX}px, ${translateY}px)`,
  }
}

export function getTooltipTranslate({
  allowEscapeViewBox,
  coordinate,
  offsetTopLeft,
  position,
  reverseDirection,
  tooltipBox,
  useTranslate3d,
  viewBox,
}: {
  allowEscapeViewBox: AllowInDimension
  coordinate: Coordinate | undefined
  offsetTopLeft: number
  position: Partial<Coordinate>
  reverseDirection: AllowInDimension
  tooltipBox: { width: number, height: number }
  useTranslate3d: boolean
  viewBox: CartesianViewBox
}): { cssProperties: CSSProperties, cssClasses: ReturnType<typeof getTooltipCSSClassName>, transform: CSSProperties | undefined } {
  let cssProperties: CSSProperties, translateX: number | undefined, translateY: number | undefined
  if (tooltipBox.height > 0 && tooltipBox.width > 0 && coordinate) {
    translateX = getTooltipTranslateXY({
      allowEscapeViewBox,
      coordinate,
      key: 'x',
      offsetTopLeft,
      position,
      reverseDirection,
      tooltipDimension: tooltipBox.width,
      viewBox,
      viewBoxDimension: viewBox.width,
    })

    translateY = getTooltipTranslateXY({
      allowEscapeViewBox,
      coordinate,
      key: 'y',
      offsetTopLeft,
      position,
      reverseDirection,
      tooltipDimension: tooltipBox.height,
      viewBox,
      viewBoxDimension: viewBox.height,
    })
    cssProperties = {}
  }
  else {
    cssProperties = TOOLTIP_HIDDEN
  }
  return {
    cssProperties,
    cssClasses: getTooltipCSSClassName({
      translateX,
      translateY,
      coordinate,
    }),
    transform: getTransformStyle({
      translateX: translateX ?? 0,
      translateY: translateY ?? 0,
      useTranslate3d,
    }),
  }
}
