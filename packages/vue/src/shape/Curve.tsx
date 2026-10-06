/**
 * @fileOverview Curve
 */
import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import {
  type CurveFactory,
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
  curveBumpX,
  curveBumpY,
  curveLinear,
  curveLinearClosed,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  area as shapeArea,
  line as shapeLine,
} from 'd3-shape'
import { classProp } from '@/types'
import type { LayoutType, VuePropsToType, WithSVGProps } from '@/types'
import { upperFirst } from 'es-toolkit/compat'
import { isNumber } from '@/utils'
import { svgAttrs } from '@/utils/VueUtils'

interface CurveFactories {
  [index: string]: CurveFactory
}

const CURVE_FACTORIES: CurveFactories = {
  curveBasisClosed,
  curveBasisOpen,
  curveBasis,
  curveBumpX,
  curveBumpY,
  curveLinearClosed,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
}

export type CurveType =
  | 'basis'
  | 'basisClosed'
  | 'basisOpen'
  | 'bumpX'
  | 'bumpY'
  | 'bump'
  | 'linear'
  | 'linearClosed'
  | 'natural'
  | 'monotoneX'
  | 'monotoneY'
  | 'monotone'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | CurveFactory

export interface Point {
  readonly x: number
  readonly y: number
  readonly payload?: unknown
}

const defined = (p: Point) => p.x === +p.x && p.y === +p.y
const getX = (p: Point) => p.x
const getY = (p: Point) => p.y

function getCurveFactory(type: CurveType, layout: LayoutType | undefined) {
  if (typeof type === 'function') {
    return type
  }

  const name = `curve${upperFirst(type)}`

  if ((name === 'curveMonotone' || name === 'curveBump') && layout) {
    return CURVE_FACTORIES[`${name}${layout === 'vertical' ? 'Y' : 'X'}`]
  }
  return CURVE_FACTORIES[name] || curveLinear
}

type GetPathProps = Pick<CurveProps, 'type' | 'points' | 'baseLine' | 'layout' | 'connectNulls'>

/**
 * Calculate the path of curve. Returns null if points is an empty array.
 * @return path or null
 */
export function getPath({
  type = 'linear',
  points = [],
  baseLine,
  layout,
  connectNulls = false,
}: GetPathProps): string | null {
  const curveFactory = getCurveFactory(type, layout)
  const formatPoints = connectNulls ? points.filter(entry => defined(entry)) : points
  let lineFunction

  if (Array.isArray(baseLine)) {
    const formatBaseLine = connectNulls ? baseLine.filter(base => defined(base)) : baseLine
    const areaPoints = formatPoints.map((entry, index) => ({ ...entry, base: formatBaseLine[index] }))
    if (layout === 'vertical') {
      lineFunction = shapeArea<Point & { base: Point }>()
        .y(getY)
        .x1(getX)
        .x0(d => d.base.x)
    }
    else {
      lineFunction = shapeArea<Point & { base: Point }>()
        .x(getX)
        .y1(getY)
        .y0(d => d.base.y)
    }
    lineFunction.defined(defined).curve(curveFactory)

    return lineFunction(areaPoints)
  }
  if (layout === 'vertical' && isNumber(baseLine)) {
    lineFunction = shapeArea<Point>().y(getY).x1(getX).x0(baseLine!)
  }
  else if (isNumber(baseLine)) {
    lineFunction = shapeArea<Point>().x(getX).y1(getY).y0(baseLine!)
  }
  else {
    lineFunction = shapeLine<Point>().x(getX).y(getY)
  }

  lineFunction.defined(defined).curve(curveFactory)

  return lineFunction(formatPoints)
}

export const CurveVueProps = {
  type: { type: [String, Function] as PropType<CurveType | CurveFactory> },
  layout: { type: String as PropType<LayoutType> },
  baseLine: { type: [Number, Array] as PropType<number | ReadonlyArray<Point>> },
  points: { type: Array as PropType<ReadonlyArray<Point>> },
  connectNulls: { type: Boolean },
  path: { type: String },
  class: classProp,
}

export type CurvePropsWithOutSVG = VuePropsToType<typeof CurveVueProps>

export type CurveProps = WithSVGProps<typeof CurveVueProps>
export const Curve = defineComponent<CurveProps>({
  name: 'Curve',
  props: CurveVueProps,
  inheritAttrs: false,
  setup(props, { attrs }) {
    const realPath = computed(() => {
      if ((!props.points || !props.points.length) && !props.path) {
        return undefined
      }
      return props.points && props.points.length ? getPath(props) : props.path
    })

    return () => {
      if (realPath.value === null && !props.path) {
        return null
      }

      return (
        <path
          {...svgAttrs(attrs)}
          class={['v-charts-curve', props.class]}
          d={realPath.value ?? undefined}
        />
      )
    }
  },
})
