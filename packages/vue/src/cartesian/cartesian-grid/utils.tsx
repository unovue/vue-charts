import type { VNodeChild } from 'vue'
import { filterProps } from '@/utils/VueUtils'

/**
 * Render a grid line item.
 * Priority: slot > default <line> with optional SVG attr overrides from `option`.
 */
export function renderLineItem(
  slot: ((props: Record<string, unknown>) => VNodeChild) | undefined,
  option: boolean | object,
  props: { x1?: number, x2?: number, y1?: number, y2?: number, key?: string } & Record<string, unknown>,
) {
  if (slot) {
    return slot(props)
  }

  const { x1, y1, x2, y2, key, ...others } = { ...props }
  const { x: _x, y: _y, width: _width, height: _height, offset: _offset, ...restOfFilteredProps } = filterProps(others, false)!
  return <line {...restOfFilteredProps} x1={x1} y1={y1} x2={x2} y2={y2} fill="none" key={key} />
}
