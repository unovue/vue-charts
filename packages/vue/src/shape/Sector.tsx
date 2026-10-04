/**
 * @fileOverview Sector - SVG arc path shape for pie/donut chart segments
 */
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { classProp } from '@/types'
import type { VuePropsToType, WithSVGProps } from '@/types'
import { getPercentValue, mathSign } from '@/utils/data'
import { RADIAN, polarToCartesian } from '@/utils/polar'
import { svgAttrs } from '@/utils/VueUtils'

const SectorVueProps = {
  cx: { type: Number as PropType<number>, default: 0 },
  cy: { type: Number as PropType<number>, default: 0 },
  innerRadius: { type: Number as PropType<number>, default: 0 },
  outerRadius: { type: Number as PropType<number>, default: 0 },
  startAngle: { type: Number as PropType<number>, default: 0 },
  endAngle: { type: Number as PropType<number>, default: 0 },
  cornerRadius: { type: [Number, String] as PropType<number | string>, default: 0 },
  forceCornerRadius: { type: Boolean as PropType<boolean>, default: false },
  cornerIsExternal: { type: Boolean as PropType<boolean>, default: false },
  class: classProp,
}

export type SectorProps = VuePropsToType<typeof SectorVueProps>
export type SectorPropsWithSVG = WithSVGProps<typeof SectorVueProps>

function getDeltaAngle(startAngle: number, endAngle: number) {
  const sign = mathSign(endAngle - startAngle)
  const deltaAngle = Math.min(Math.abs(endAngle - startAngle), 359.999)
  return sign * deltaAngle
}

interface TangentCircleDef {
  cx: number
  cy: number
  radius: number
  angle: number
  sign: number
  isExternal?: boolean
  cornerRadius: number
  cornerIsExternal?: boolean
}

function getTangentCircle({
  cx,
  cy,
  radius,
  angle,
  sign,
  isExternal,
  cornerRadius,
  cornerIsExternal,
}: TangentCircleDef) {
  const centerRadius = cornerRadius * (isExternal ? 1 : -1) + radius
  const theta = Math.asin(cornerRadius / centerRadius) / RADIAN
  const centerAngle = cornerIsExternal ? angle : angle + sign * theta
  const center = polarToCartesian(cx, cy, centerRadius, centerAngle)
  const circleTangency = polarToCartesian(cx, cy, radius, centerAngle)
  const lineTangencyAngle = cornerIsExternal ? angle - sign * theta : angle
  const lineTangency = polarToCartesian(cx, cy, centerRadius * Math.cos(theta * RADIAN), lineTangencyAngle)
  return { center, circleTangency, lineTangency, theta }
}

function getSectorPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const angle = getDeltaAngle(startAngle, endAngle)
  const tempEndAngle = startAngle + angle

  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, tempEndAngle)
  const largeArcFlag = +(Math.abs(angle) > 180)
  const sweepOuter = +(startAngle > tempEndAngle)

  let path = `M ${outerStart.x},${outerStart.y}`
    + ` A ${outerRadius},${outerRadius},0,${largeArcFlag},${sweepOuter},${outerEnd.x},${outerEnd.y}`

  if (innerRadius > 0) {
    const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)
    const innerEnd = polarToCartesian(cx, cy, innerRadius, tempEndAngle)
    const sweepInner = +(startAngle <= tempEndAngle)
    path += ` L ${innerEnd.x},${innerEnd.y}`
      + ` A ${innerRadius},${innerRadius},0,${largeArcFlag},${sweepInner},${innerStart.x},${innerStart.y} Z`
  }
  else {
    path += ` L ${cx},${cy} Z`
  }

  return path
}

function getSectorWithCorner(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  cornerRadius: number,
  forceCornerRadius: boolean,
  cornerIsExternal: boolean,
  startAngle: number,
  endAngle: number,
): string {
  const sign = mathSign(endAngle - startAngle)
  const {
    circleTangency: soct,
    lineTangency: solt,
    theta: sot,
  } = getTangentCircle({
    cx,
    cy,
    radius: outerRadius,
    angle: startAngle,
    sign,
    cornerRadius,
    cornerIsExternal,
  })
  const {
    circleTangency: eoct,
    lineTangency: eolt,
    theta: eot,
  } = getTangentCircle({
    cx,
    cy,
    radius: outerRadius,
    angle: endAngle,
    sign: -sign,
    cornerRadius,
    cornerIsExternal,
  })
  const outerArcAngle = cornerIsExternal
    ? Math.abs(startAngle - endAngle)
    : Math.abs(startAngle - endAngle) - sot - eot

  if (outerArcAngle < 0) {
    if (forceCornerRadius) {
      return `M ${solt.x},${solt.y}`
        + ` a${cornerRadius},${cornerRadius},0,0,1,${cornerRadius * 2},0`
        + ` a${cornerRadius},${cornerRadius},0,0,1,${-cornerRadius * 2},0`
    }
    return getSectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle)
  }

  let path = `M ${solt.x},${solt.y}`
    + ` A${cornerRadius},${cornerRadius},0,0,${+(sign < 0)},${soct.x},${soct.y}`
    + ` A${outerRadius},${outerRadius},0,${+(outerArcAngle > 180)},${+(sign < 0)},${eoct.x},${eoct.y}`
    + ` A${cornerRadius},${cornerRadius},0,0,${+(sign < 0)},${eolt.x},${eolt.y}`

  if (innerRadius > 0) {
    const {
      circleTangency: sict,
      lineTangency: silt,
      theta: sit,
    } = getTangentCircle({
      cx,
      cy,
      radius: innerRadius,
      angle: startAngle,
      sign,
      isExternal: true,
      cornerRadius,
      cornerIsExternal,
    })
    const {
      circleTangency: eict,
      lineTangency: eilt,
      theta: eit,
    } = getTangentCircle({
      cx,
      cy,
      radius: innerRadius,
      angle: endAngle,
      sign: -sign,
      isExternal: true,
      cornerRadius,
      cornerIsExternal,
    })
    const innerArcAngle = cornerIsExternal
      ? Math.abs(startAngle - endAngle)
      : Math.abs(startAngle - endAngle) - sit - eit

    if (innerArcAngle < 0 && cornerRadius === 0) {
      return `${path}L${cx},${cy}Z`
    }

    path += `L${eilt.x},${eilt.y}`
      + ` A${cornerRadius},${cornerRadius},0,0,${+(sign < 0)},${eict.x},${eict.y}`
      + ` A${innerRadius},${innerRadius},0,${+(innerArcAngle > 180)},${+(sign > 0)},${sict.x},${sict.y}`
      + ` A${cornerRadius},${cornerRadius},0,0,${+(sign < 0)},${silt.x},${silt.y}Z`
  }
  else {
    path += `L${cx},${cy}Z`
  }

  return path
}

export const Sector = defineComponent<SectorPropsWithSVG>({
  name: 'Sector',
  props: SectorVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    return () => {
      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, cornerRadius, forceCornerRadius, cornerIsExternal } = props
      if (outerRadius <= 0 || outerRadius < innerRadius || startAngle === endAngle) {
        return null
      }

      const deltaRadius = outerRadius - innerRadius
      const cr = getPercentValue(cornerRadius, deltaRadius, 0, true)
      let path: string

      if (cr > 0 && Math.abs(startAngle - endAngle) < 360) {
        path = getSectorWithCorner(
          cx,
          cy,
          innerRadius,
          outerRadius,
          Math.min(cr, deltaRadius / 2),
          forceCornerRadius,
          cornerIsExternal,
          startAngle,
          endAngle,
        )
      }
      else {
        path = getSectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle)
      }

      return (
        <path
          {...svgAttrs(attrs)}
          class={['v-charts-sector', props.class]}
          d={path}
        />
      )
    }
  },
})
