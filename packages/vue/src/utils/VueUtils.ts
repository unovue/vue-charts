import type { FilteredSvgElementType } from '@/utils/svg'
import { FilteredElementKeyMap, SVGElementPropKeys } from '@/utils/svg'
import { EventKeys } from '@/types'

const svgKeys = new Set(SVGElementPropKeys)
const eventKeys = new Set(EventKeys)

/**
 * Checks if the property is valid to spread onto an SVG element or onto a specific component
 * @param {unknown} property property value currently being compared
 * @param {string} key property key currently being compared
 * @param {boolean} includeEvents if events are included in spreadable props
 * @param {boolean} svgElementType checks against map of SVG element types to attributes
 * @returns {boolean} is prop valid
 */
function isValidSpreadableProp(property: unknown, key: string, includeEvents?: boolean, svgElementType?: FilteredSvgElementType) {
  /**
   * If the svg element type is explicitly included, check against the filtered element key map
   * to determine if there are attributes that should only exist on that element type.
   * @todo Add an internal cjs version of https://github.com/wooorm/svg-element-attributes for full coverage.
   */
  const matchingElementTypeKeys = (svgElementType && FilteredElementKeyMap?.[svgElementType]) ?? []

  return (
    key.startsWith('data-')
    || (typeof property !== 'function'
      && ((svgElementType && matchingElementTypeKeys.includes(key)) || svgKeys.has(key)))
    || (includeEvents && eventKeys.has(key))
  )
}

export function filterProps(props: Record<string, unknown> | boolean | unknown, includeEvents: boolean, svgElementType?: FilteredSvgElementType) {
  if (!props || typeof props === 'function' || typeof props === 'boolean') {
    return null
  }

  const inputProps = props as Record<string, unknown>

  if (typeof inputProps !== 'object' && typeof inputProps !== 'function') {
    return null
  }

  const out: Record<string, unknown> = {}

  /**
   * Props are blindly spread onto SVG elements. This loop filters out properties that we don't want to spread.
   * Items filtered out are as follows:
   *   - functions in properties that are SVG attributes (functions are included when includeEvents is true)
   *   - props that are SVG attributes but don't matched the passed svgElementType
   *   - any prop that is not in SVGElementPropKeys (or in EventKeys if includeEvents is true)
   */
  Object.keys(inputProps).forEach((key) => {
    if (isValidSpreadableProp(inputProps?.[key], key, includeEvents, svgElementType)) {
      out[key] = inputProps[key]
    }
  })

  return out
}

// SVG attributes whose real name is mixed case; every other camelCase key is a presentation
// attribute written in React style (strokeWidth) whose SVG name is kebab-case (stroke-width).
const mixedCaseAttributes = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'patternUnits', 'patternContentUnits', 'patternTransform', 'clipPathUnits', 'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'textLength', 'lengthAdjust', 'startOffset', 'spreadMethod', 'stdDeviation', 'baseFrequency', 'numOctaves', 'tableValues', 'kernelMatrix', 'kernelUnitLength', 'pathLength', 'maskUnits', 'maskContentUnits', 'filterUnits', 'primitiveUnits', 'xChannelSelector', 'yChannelSelector', 'stitchTiles', 'surfaceScale', 'specularExponent', 'specularConstant', 'diffuseConstant', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'limitingConeAngle', 'edgeMode', 'targetX', 'targetY', 'repeatCount', 'repeatDur', 'calcMode', 'keyTimes', 'keySplines', 'keyPoints', 'attributeName', 'attributeType', 'systemLanguage', 'requiredExtensions'])
// What to do with an attribute key, decided once per key name: a Vue listener, an attribute
// kept as is, an SVG attribute under its SVG name, or dropped (chart data such as payload).
type KeyKind = 'listener' | 'keep' | 'drop' | { name: string }
const keyKinds = new Map<string, KeyKind>()
function kindOf(key: string): KeyKind {
  let kind = keyKinds.get(key)
  if (kind === undefined) {
    const name = mixedCaseAttributes.has(key) ? key : key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)
    kind = /^on[A-Z]/.test(key)
      ? 'listener'
      : key === 'class' || key === 'style' || key === 'points' || key.startsWith('data-') || key.startsWith('aria-')
        ? 'keep'
        : svgKeys.has(key) || svgKeys.has(name) || svgKeys.has(key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())) || key === 'transform'
          ? { name }
          : 'drop'
    keyKinds.set(key, kind)
  }
  return kind
}

/**
 * The attributes of `source` that belong on an SVG element, under their SVG names. Chart data
 * passed along as props (payload, dataKey, tooltipPosition…) never reaches the DOM.
 * Vue listeners (onClick, onMouseenter) are kept.
 */
export function svgAttrs(source: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!source)
    return out
  for (const key in source) {
    const value = source[key]
    if (value === undefined)
      continue
    const kind = kindOf(key)
    if (kind === 'drop')
      continue
    if (kind === 'listener') {
      if (typeof value === 'function' || Array.isArray(value))
        out[key] = value
    }
    else if (kind === 'keep') {
      out[key] = value
    }
    else if (typeof value !== 'function' && typeof value !== 'object') {
      out[kind.name] = value
    }
  }
  return out
}
