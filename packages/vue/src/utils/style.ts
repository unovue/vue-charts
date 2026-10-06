import type { CSSProperties } from 'vue'
import { isNumber } from './validate'

/**
 * Converts a style value to a string with 'px' if it's a number
 * @param value The style value to convert
 * @returns The converted style value
 */
export function toPx(value: string | number | undefined): string | undefined {
  if (value === undefined)
    return undefined
  return isNumber(value) ? `${value}px` : value
}

/**
 * Converts style object values to use 'px' for numeric height/width values
 * @param style The style object to convert
 * @returns A new style object with converted values
 */
export function normalizeStyle(style: CSSProperties = {}): CSSProperties {
  const { height, width, minHeight, maxHeight, minWidth, maxWidth, ...rest } = style
  return {
    height: toPx(height),
    width: toPx(width),
    minHeight: toPx(minHeight),
    maxHeight: toPx(maxHeight),
    minWidth: toPx(minWidth),
    maxWidth: toPx(maxWidth),
    ...rest,
  }
}
