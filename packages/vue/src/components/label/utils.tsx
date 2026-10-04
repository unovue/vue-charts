import type { CartesianViewBox, PolarViewBox, ViewBox } from '@/cartesian/type'
import type { LabelProps } from '@/components/label/types'
import type { Coordinate } from '@/types'
import { isNumber, isPercent } from '@/utils'
import { getPercentValue, mathSign } from '@/utils/data'

export function parseViewBox(props: any): ViewBox | undefined {
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

export function isPolar(viewBox: CartesianViewBox | PolarViewBox): viewBox is PolarViewBox {
  return 'cx' in viewBox && isNumber(viewBox.cx)
}

export const RADIAN = Math.PI / 180

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number): Coordinate {
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
  labelProps: LabelProps,
  position: PolarLabelPosition,
  label: string | number | undefined,
  attrs: Record<string, any>,
  viewBox: PolarViewBox,
  generatedId: string,
) {
  const { offset = 5, class: className, id: labelId } = labelProps
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise } = viewBox
  const radius = (innerRadius! + outerRadius!) / 2
  const deltaAngle = getDeltaAngle(startAngle!, endAngle!)
  const sign = deltaAngle >= 0 ? 1 : -1
  let labelAngle: number
  let direction: boolean | undefined

  switch (position) {
    case 'insideStart':
      labelAngle = startAngle! + sign * offset
      direction = clockWise
      break
    case 'insideEnd':
      labelAngle = endAngle! - sign * offset
      direction = !clockWise
      break
    case 'end':
      labelAngle = endAngle! + sign * offset
      direction = clockWise
      break
    default:
      throw new Error(`Unsupported position ${position}`)
  }

  direction = deltaAngle <= 0 ? direction : !direction

  const startPoint = polarToCartesian(cx!, cy!, radius, labelAngle)
  const endPoint = polarToCartesian(cx!, cy!, radius, labelAngle + (direction ? 1 : -1) * 359)
  const path = `M${startPoint.x},${startPoint.y} A${radius},${radius},0,1,${direction ? 0 : 1},${endPoint.x},${endPoint.y}`
  const id = labelId ?? generatedId

  return (
    <text {...attrs} dominant-baseline="central" class={['v-charts-radial-bar-label', className]}>
      <defs>
        <path id={id} d={path} />
      </defs>
      <textPath xlinkHref={`#${id}`}>{label}</textPath>
    </text>
  )
}

export function getAttrsOfPolarLabel(props: LabelProps, viewBox?: PolarViewBox) {
  const { offset, position } = props
  const vb = viewBox ?? (props.viewBox as PolarViewBox)
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle } = vb
  const midAngle = (startAngle! + endAngle!) / 2

  if (position === 'outside') {
    const { x, y } = polarToCartesian(cx!, cy!, outerRadius! + offset!, midAngle)

    return {
      x,
      y,
      textAnchor: x! >= cx! ? 'start' : 'end',
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

  const r = (innerRadius! + outerRadius!) / 2
  const { x, y } = polarToCartesian(cx!, cy!, r, midAngle)

  return {
    x,
    y,
    textAnchor: 'middle',
    verticalAnchor: 'middle',
  }
}

export function getAttrsOfCartesianLabel(props: LabelProps, viewBox: CartesianViewBox) {
  const { parentViewBox, offset, position } = props
  const { x, y, width, height } = viewBox

  // Define vertical offsets and position inverts based on the value being positive or negative
  const verticalSign = height! >= 0 ? 1 : -1
  const verticalOffset = verticalSign * offset!
  const verticalEnd = verticalSign > 0 ? 'end' : 'start'
  const verticalStart = verticalSign > 0 ? 'start' : 'end'

  // Define horizontal offsets and position inverts based on the value being positive or negative
  const horizontalSign = width! >= 0 ? 1 : -1
  const horizontalOffset = horizontalSign * offset!
  const horizontalEnd = horizontalSign > 0 ? 'end' : 'start'
  const horizontalStart = horizontalSign > 0 ? 'start' : 'end'

  if (position === 'top') {
    const attrs = {
      x: x! + width! / 2,
      y: y! - verticalSign * offset!,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd,
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            height: Math.max(y! - (parentViewBox as CartesianViewBox).y!, 0),
            width: width!,
          }
        : {}),
    }
  }

  if (position === 'bottom') {
    const attrs = {
      x: x! + width! / 2,
      y: y! + height! + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart,
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            height: Math.max(
              (parentViewBox as CartesianViewBox).y! + (parentViewBox as CartesianViewBox).height! - (y! + height!),
              0,
            ),
            width: width!,
          }
        : {}),
    }
  }

  if (position === 'left') {
    const attrs = {
      x: x! - horizontalOffset,
      y: y! + height! / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle',
    }

    return {
      ...attrs,
      ...(parentViewBox
        ? {
            width: Math.max(attrs.x! - (parentViewBox as CartesianViewBox).x!, 0),
            height: height!,
          }
        : {}),
    }
  }

  if (position === 'right') {
    const attrs = {
      x: x! + width! + horizontalOffset,
      y: y! + height! / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle',
    }
    return {
      ...attrs,
      ...(parentViewBox
        ? {
            width: Math.max(
              (parentViewBox as CartesianViewBox).x! + (parentViewBox as CartesianViewBox).width! - attrs.x!,
              0,
            ),
            height: height!,
          }
        : {}),
    }
  }

  const sizeAttrs = parentViewBox ? { width, height } : {}

  if (position === 'insideLeft') {
    return {
      x: x! + horizontalOffset,
      y: y! + height! / 2,
      textAnchor: horizontalStart,
      verticalAnchor: 'middle',
      ...sizeAttrs,
    }
  }

  if (position === 'insideRight') {
    return {
      x: x! + width! - horizontalOffset,
      y: y! + height! / 2,
      textAnchor: horizontalEnd,
      verticalAnchor: 'middle',
      ...sizeAttrs,
    }
  }

  if (position === 'insideTop') {
    return {
      x: x! + width! / 2,
      y: y! + verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottom') {
    return {
      x: x! + width! / 2,
      y: y! + height! - verticalOffset,
      textAnchor: 'middle',
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  if (position === 'insideTopLeft') {
    return {
      x: x! + horizontalOffset,
      y: y! + verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideTopRight') {
    return {
      x: x! + width! - horizontalOffset,
      y: y! + verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalStart,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottomLeft') {
    return {
      x: x! + horizontalOffset,
      y: y! + height! - verticalOffset,
      textAnchor: horizontalStart,
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  if (position === 'insideBottomRight') {
    return {
      x: x! + width! - horizontalOffset,
      y: y! + height! - verticalOffset,
      textAnchor: horizontalEnd,
      verticalAnchor: verticalEnd,
      ...sizeAttrs,
    }
  }

  if (
    !!position
    && typeof position === 'object'
    && (isNumber(position.x) || isPercent(position.x!))
    && (isNumber(position.y) || isPercent(position.y!))
  ) {
    return {
      x: x! + getPercentValue(position.x!, width!),
      y: y! + getPercentValue(position.y!, height!),
      textAnchor: 'end',
      verticalAnchor: 'end',
      ...sizeAttrs,
    }
  }

  return {
    x: x! + width! / 2,
    y: y! + height! / 2,
    textAnchor: 'middle',
    verticalAnchor: 'middle',
    ...sizeAttrs,
  }
}
