import { hierarchy, partition } from 'd3-hierarchy'

export interface SunburstData {
  [key: string]: any
  name: string
  value?: number
  fill?: string
  children?: SunburstData[]
}

export interface SunburstLayoutNode {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  depth: number
  name: string
  value: number
  fill?: string
  payload: SunburstData
  tooltipIndex: string
}

export interface SunburstLayoutOptions {
  data: SunburstData
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  dataKey: string
  ringPadding?: number
  padding?: number
}

/**
 * Build a hierarchical tooltip index path string for a d3 hierarchy node.
 * E.g. 'children[0].children[1]'
 */
function buildTooltipIndex(node: any): string {
  const parts: string[] = []
  let current = node
  while (current.parent) {
    const idx = current.parent.children!.indexOf(current)
    parts.unshift(`children[${idx}]`)
    current = current.parent
  }
  return parts.join('.')
}

export function computeSunburstLayout(options: SunburstLayoutOptions): SunburstLayoutNode[] {
  const { data, cx, cy, innerRadius, outerRadius, startAngle, endAngle, dataKey, ringPadding = 0, padding = 0 } = options

  if (!data.children || data.children.length === 0)
    return []

  const root = hierarchy(data)
    .sum((d: any) => {
      if (d.children && d.children.length > 0)
        return 0
      const val = d[dataKey]
      return typeof val === 'number' && val > 0 ? val : 0
    })
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  // partition gives x0/x1 in [0, 1] (angular fraction) and y0/y1 in [0, 1] (depth fraction)
  partition<SunburstData>().size([1, 1])(root)

  const angleRange = endAngle - startAngle
  const radiusRange = outerRadius - innerRadius

  const nodes: SunburstLayoutNode[] = []

  root.descendants().forEach((d: any) => {
    // Skip root node
    if (d.depth === 0)
      return

    // Angular padding: shrink each sector by half padding on each side (in degrees)
    const nodeStartAngle = startAngle + d.x0 * angleRange + padding / 2
    const nodeEndAngle = startAngle + d.x1 * angleRange - padding / 2

    // Radial padding: add ringPadding to inner, subtract from outer
    const nodeInnerRadius = innerRadius + d.y0 * radiusRange + ringPadding / 2
    const nodeOuterRadius = innerRadius + d.y1 * radiusRange - ringPadding / 2

    // Skip degenerate sectors
    if (nodeEndAngle <= nodeStartAngle || nodeOuterRadius <= nodeInnerRadius)
      return

    nodes.push({
      cx,
      cy,
      innerRadius: nodeInnerRadius,
      outerRadius: nodeOuterRadius,
      startAngle: nodeStartAngle,
      endAngle: nodeEndAngle,
      depth: d.depth,
      name: d.data.name,
      value: d.value ?? 0,
      fill: d.data.fill,
      payload: d.data,
      tooltipIndex: buildTooltipIndex(d),
    })
  })

  return nodes
}
