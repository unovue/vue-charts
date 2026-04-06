import type { LayoutType } from '@/types'
import type { AxisType } from '@/types/axis'

export function isNan(value: any): boolean {
  // eslint-disable-next-line eqeqeq
  return typeof value == 'number' && value != +value
}

export function isNumber(value: unknown): value is number {
  return (typeof value === 'number' || value instanceof Number) && !isNan(value)
}

/**
 * validate the width and height props of a chart element
 * @param  {object} el A chart element
 * @return {boolean}   true If the props width and height are number, and greater than 0
 */
export function validateWidthHeight({ width, height }: { width?: number, height?: number }): boolean {
  if (!isNumber(width) || width <= 0 || !isNumber(height) || height <= 0) {
    return false
  }

  return true
}

export function isWellBehavedNumber(n: unknown): n is number {
  return Number.isFinite(n)
}

export function isPercent(value: string | number): value is `${number}%` {
  return typeof value === 'string' && value.indexOf('%') === value.length - 1
}

export function isCategoricalAxis(layout: LayoutType, axisType: AxisType) {
  return (layout === 'horizontal' && axisType === 'xAxis')
    || (layout === 'vertical' && axisType === 'yAxis')
    || (layout === 'centric' && axisType === 'angleAxis')
    || (layout === 'radial' && axisType === 'radiusAxis')
}

export function isVisible(
  sign: number,
  tickPosition: number,
  getSize: () => number,
  start: number,
  end: number,
): boolean {
  /* Since getSize() is expensive (it reads the ticks' size from the DOM), we do this check first to avoid calculating
   * the tick's size. */
  if (sign * tickPosition < sign * start || sign * tickPosition > sign * end) {
    return false
  }

  const size = getSize()

  return sign * (tickPosition - (sign * size) / 2 - start) >= 0 && sign * (tickPosition + (sign * size) / 2 - end) <= 0
}

/**
 * Checks if the value is null or undefined
 * @param {any} value The value to check
 * @returns {boolean} true if the value is null or undefined
 */
export function isNullish(value: unknown): boolean {
  return value === null || typeof value === 'undefined'
}

export const isNumOrStr = (value: unknown): value is number | string => isNumber(value) || typeof value === 'string'
