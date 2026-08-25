import type { CSSProperties } from 'vue'
import type { LayoutType, Margin } from '@/types'
import type { CartesianPosition } from '@/cartesian/getCartesianPosition'
import type { HorizontalAlignmentType, VerticalAlignmentType } from '@/components/DefaultLegendContent'
import { isNumber } from '@/utils'

type PositionInput = {
  layout?: LayoutType
  align?: HorizontalAlignmentType
  verticalAlign?: VerticalAlignmentType
}

export function getLayoutForPosition(position: CartesianPosition | undefined): LayoutType {
  if (position === 'left' || position === 'right' || position === 'insideLeft' || position === 'insideRight') {
    return 'vertical'
  }

  return 'horizontal'
}

export function getOutsidePositionOffset(
  position: CartesianPosition | undefined,
  offset: number,
  box: { width: number, height: number },
): { top?: number, left?: number } {
  if (position === 'top') {
    return { top: box.height + offset }
  }
  if (position === 'bottom') {
    return { top: -box.height - offset }
  }
  if (position === 'left') {
    return { left: box.width + offset }
  }
  if (position === 'right') {
    return { left: -box.width - offset }
  }
  return {}
}

export function getDefaultPosition(
  style: CSSProperties | undefined,
  props: PositionInput,
  margin: Margin,
  chartWidth: number,
  chartHeight: number,
  box: { width: number, height: number },
): CSSProperties {
  const { layout, align, verticalAlign } = props
  let hPos: CSSProperties = {}
  let vPos: CSSProperties = {}

  if (!style
    || ((style.left === undefined || style.left === null)
      && (style.right === undefined || style.right === null))) {
    if (align === 'center' && layout === 'vertical') {
      hPos = { left: `${((chartWidth || 0) - box.width) / 2}px` }
    }
    else {
      hPos = align === 'right'
        ? { right: `${(margin?.right) || 0}px` }
        : { left: `${(margin?.left) || 0}px` }
    }
  }

  if (!style
    || ((style.top === undefined || style.top === null)
      && (style.bottom === undefined || style.bottom === null))) {
    if (verticalAlign === 'middle') {
      vPos = { top: `${((chartHeight || 0) - box.height) / 2}px` }
    }
    else {
      vPos = verticalAlign === 'bottom'
        ? { bottom: `${(margin?.bottom) || 0}px` }
        : { top: `${(margin?.top) || 0}px` }
    }
  }

  return { ...hPos, ...vPos }
}

export function getWidthOrHeight(
  layout: LayoutType | undefined,
  height: number | undefined,
  width: number | undefined,
  maxWidth: number,
): null | { height?: number, width?: number } {
  if (layout === 'vertical' && isNumber(height)) {
    return { height }
  }
  if (layout === 'horizontal') {
    return { width: width || maxWidth }
  }
  return null
}

export function defaultUniqBy(entry: any) {
  return entry.value
}
