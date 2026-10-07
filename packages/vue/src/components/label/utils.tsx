import type { CartesianViewBoxRequired, PolarViewBoxRequired, ViewBox } from '@/types/viewBox'
import type { Data, LabelViewProps } from '@/components/label/types'
import type { Coordinate } from '@/types'
import { isNumber, isPercent } from '@/utils'
import { getPercentValue, mathSign } from '@/utils/data'

export function parseViewBox(props: Data & {
  angle?: number
  r?: number
  radius?: number
  top?: number
  left?: number
  labelViewBox?: ViewBox
  viewBox?: ViewBox
}): ViewBox | undefined {
  const {
    cx,
    cy,
    angle,
    startAngle,
    endAngle,
    r,
    radius,
    innerRadius,
    outerRadius,
    x,
    y,
    top,
    left,
    width,
    height,
    clockWise,
    labelViewBox,
  } = props

  if (labelViewBox) {
    return labelViewBox
  }

  if (isNumber(width) && isNumber(height)) {
    if (isNumber(x) && isNumber(y)) {
      return { x, y, width, height }
    }
    if (isNumber(top) && isNumber(left)) {
      return { x: top, y: left, width, height }
    }
  }

  if (isNumber(x) && isNumber(y)) {
    return { x, y, width: 0, height: 0 }
  }

  if (isNumber(cx) && isNumber(cy)) {
    return {
      cx,
      cy,
      startAngle: startAngle || angle || 0,
      endAngle: endAngle || angle || 0,
      innerRadius: innerRadius || 0,
      outerRadius: outerRadius || radius || r || 0,
      clockWise,
    }
  }

  if (props.viewBox) {
    return props.viewBox
  }

  return undefined
}

/** A label's box with every field set: missing sizes and angles are 0. */
export type LabelViewBox = CartesianViewBoxRequired | PolarViewBoxRequired

/**
 * Fills the fields a caller's `viewBox` leaves out, once, so position math never reads
 * `undefined` and renders NaN. A box with a numeric `cx` is polar.
 */
export function normalizeViewBox(viewBox: ViewBox): LabelViewBox {
  if ('cx' in viewBox && isNumber(viewBox.cx)) {
    return {
      cx: viewBox.cx,
      cy: viewBox.cy ?? 0,
      innerRadius: viewBox.innerRadius ?? 0,
      outerRadius: viewBox.outerRadius ?? 0,
      startAngle: viewBox.startAngle ?? 0,
      endAngle: viewBox.endAngle ?? 0,
      clockWise: viewBox.clockWise ?? false,
    }
  }
  const box = viewBox as Partial<CartesianViewBoxRequired>
  return { x: box.x ?? 0, y: box.y ?? 0, width: box.width ?? 0, height: box.height ?? 0 }
}

export function isPolar(viewBox: LabelViewBox): viewBox is PolarViewBoxRequired {
  return 'cx' in viewBox
}

const RADIAN = Math.PI / 180

function polarToCartesian(cx: number, cy: number, radius: number, angle: number): Coordinate {
  return {
    x: cx + Math.cos(-RADIAN * angle) * radius,
    y: cy + Math.sin(-RADIAN * angle) * radius,
  }
}

type PolarLabelPosition = 'insideStart' | 'insideEnd' | 'end'

function getDeltaAngle(startAngle: number, endAngle: number) {
  const sign = mathSign(endAngle - startAngle)
  const deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360)
  return sign * deltaAngle
}

export function renderRadialLabel(
  labelProps: LabelViewProps,
  position: PolarLabelPosition,
  label: string | number | undefined,
  attrs: Record<string, unknown>,
  viewBox: PolarViewBoxRequired,
  generatedId: string,
) {
  const { offset = 5, class: className, id: labelId } = labelProps
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise } = viewBox
  const radius = (innerRadius + outerRadius) / 2
  const deltaAngle = getDeltaAngle(startAngle, endAngle)
  const sign = deltaAngle >= 0 ? 1 : -1
  let labelAngle: number
  let direction: boolean | undefined

  switch (position) {
    case 'insideStart':
      labelAngle = startAngle + sign * offset
      direction = clockWise
      break
    case 'insideEnd':
      labelAngle = endAngle - sign * offset
      direction = !clockWise
      break
    case 'end':
      labelAngle = endAngle + sign * offset
      direction = clockWise
      break
    default:
      throw new Error(`Unsupported position ${position}`)
  }

  direction = deltaAngle <= 0 ? direction : !direction

  const startPoint = polarToCartesian(cx, cy, radius, labelAngle)
  const endPoint = polarToCartesian(cx, cy, radius, labelAngle + (direction ? 1 : -1) * 359)
  const path = `M${startPoint.x},${startPoint.y} A${radius},${radius},0,1,${direction ? 0 : 1},${endPoint.x},${endPoint.y}`
  const id = labelId ?? generatedId

  return (
    <text data-slot="label" {...attrs} dominant-baseline="central" class={['v-charts-radial-bar-label', className]}>
      <defs>
        <path id={id} d={path} />
      </defs>
      <textPath xlinkHref={`#${id}`}>{label}</textPath>
    </text>
  )
}

export function getAttrsOfPolarLabel(props: LabelViewProps, viewBox: PolarViewBoxRequired) {
  const { offset = 5, position } = props
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = viewBox
  const midAngle = (startAngle + endAngle) / 2

  if (position === 'outside') {
    const { x, y } = polarToCartesian(cx, cy, outerRadius + offset, midAngle)

    return {
      x,
      y,
      textAnchor: x >= cx ? 'start' : 'end',
      verticalAnchor: 'middle',
    }
  }

  if (position === 'center') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'middle',
    }
  }

  if (position === 'centerTop') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'start',
    }
  }

  if (position === 'centerBottom') {
    return {
      x: cx,
      y: cy,
      textAnchor: 'middle',
      verticalAnchor: 'end',
    }
  }

  const r = (innerRadius + outerRadius) / 2
  const { x, y } = polarToCartesian(cx, cy, r, midAngle)

  return {
    x,
    y,
    textAnchor: 'middle',
    verticalAnchor: 'middle',
  }
}

export function getAttrsOfCartesianLabel(props: LabelViewProps, viewBox: CartesianViewBoxRequired) {
  const { offset = 5, position } = props
  const parent = props.parentViewBox && normalizeViewBox(props.parentViewBox)
  const parentViewBox = parent && !isPolar(parent) ? parent : undefined
  const { x, y, width, height } = viewBox

  // Define vertical offsets and position inverts based on the value being positive or negative
  const verticalSign = height >= 0 ? 1 : -1
  const verticalOffset = verticalSign * offset
  const verticalEnd = verticalSign > 0 ? 'end' : 'start'
  const verticalStart = verticalSign > 0 ? 'start' : 'end'

  // Define horizontal offsets and position inverts based on the value being positive or negative
  const horizontalSign = width >= 0 ? 1 : -1
  const horizontalOffset = horizontalSign * offset
  const horizontalEnd = horizontalSign > 0 ? 'end' : 'start'
  const horizontalStart = horizontalSign > 0 ? 'start' : 'end'

  if (position === 'top') {
    const attrs = {
      x: x + width / 2,
      y: y - verticalSign * offset,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd,
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            height: Math.max(y - parentViewBox.y, 0),
            width,
          }
        : {}),
    }
  }

  if (position === 'bottom') {
    const attrs = {
      x: x + width / 2,
      y: y + height + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart,
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            height: Math.max(
              parentViewBox.y + parentViewBox.height - (y + height),
              0,
            ),
            width,
          }
        : {}),
    }
  }

  if (position === 'left') {
    const attrs = {
      x: x - horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle',
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            width: Math.max(attrs.x - parentViewBox.x, 0),
            height,
          }
        : {}),
    }
  }

  if (position === 'right') {
    const attrs = {
      x: x + width + horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle',
    }
    return {
      ...attrs,
      ...(parentViewBox
        ? {
            width: Math.max(
              parentViewBox.x + parentViewBox.width - attrs.x,
              0,
            ),
            height,
          }
        : {}),
    }
  }

  const sizeAttrs = parentViewBox ? { width, height } : {}

  if (position === 'insideLeft') {
    return {
      x: x + horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle',
      ...sizeAttrs,
    }
  }

  if (position === 'insideRight') {
    return {
      x: x + width - horizontalOffset,
      y: y + height / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle',
      ...sizeAttrs,
    }
  }

  if (position === 'insideTop') {
    return {
      x: x + width / 2,
      y: y + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottom') {
    return {
      x: x + width / 2,
      y: y + height - verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  if (position === 'insideTopLeft') {
    return {
      x: x + horizontalOffset,
      y: y + verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideTopRight') {
    return {
      x: x + width - horizontalOffset,
      y: y + verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottomLeft') {
    return {
      x: x + horizontalOffset,
      y: y + height - verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottomRight') {
    return {
      x: x + width - horizontalOffset,
      y: y + height - verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  const at = typeof position === 'object' ? position : undefined
  if (
    at?.x != null && at.y != null
    && (isNumber(at.x) || isPercent(at.x))
    && (isNumber(at.y) || isPercent(at.y))
  ) {
    return {
      x: x + getPercentValue(at.x, width),
      y: y + getPercentValue(at.y, height),
      textAnchor: 'end',
      verticalAnchor: 'end',
      ...sizeAttrs,
    }
  }

  return {
    x: x + width / 2,
    y: y + height / 2,
    textAnchor: 'middle',
    verticalAnchor: 'middle',
    ...sizeAttrs,
  }
}
