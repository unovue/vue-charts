import { type SankeyGraph, type SankeyLink, type SankeyNode, sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { toRaw } from 'vue'

export interface SankeyInputNode {
  name?: string
  [key: string]: any
}

export interface SankeyInputLink {
  source: number | string
  target: number | string
  value: number
  [key: string]: any
}

export type SankeyLayoutNode = SankeyNode<SankeyInputNode, SankeyInputLink>
export type SankeyLayoutLink = SankeyLink<SankeyInputNode, SankeyInputLink>

export interface ComputeSankeyLayoutArgs {
  data: { nodes: SankeyInputNode[], links: SankeyInputLink[] }
  width: number
  height: number
  nodePadding: number
  nodeWidth: number
  iterations: number
  margin: { top: number, right: number, bottom: number, left: number }
}

export interface ComputeSankeyLayoutResult {
  nodes: SankeyLayoutNode[]
  links: SankeyLayoutLink[]
}

export function computeSankeyLayout(args: ComputeSankeyLayoutArgs): ComputeSankeyLayoutResult {
  const { data, width, height, nodePadding, nodeWidth, iterations, margin } = args

  // d3-sankey mutates input — clone every node/link.
  // toRaw() strips Vue Proxies (project rule: D3 + Vue Proxy is broken).
  const cloned: SankeyGraph<SankeyInputNode, SankeyInputLink> = {
    nodes: data.nodes.map(n => ({ ...toRaw(n) })),
    links: data.links.map(l => ({ ...toRaw(l) })),
  }

  const layout = sankey<SankeyInputNode, SankeyInputLink>()
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .extent([
      [margin.left, margin.top],
      [Math.max(margin.left + 1, width - margin.right), Math.max(margin.top + 1, height - margin.bottom)],
    ])
    .iterations(iterations)

  const result = layout(cloned)

  // d3-sankey can overshoot extent bounds by ~1e-7 due to floating-point
  // accumulation in its iterative relaxation. Clamp to extent so consumers
  // can rely on `n.y1 <= height - margin.bottom`.
  const x0Min = margin.left
  const x1Max = Math.max(margin.left + 1, width - margin.right)
  const y0Min = margin.top
  const y1Max = Math.max(margin.top + 1, height - margin.bottom)
  for (const n of result.nodes) {
    if (n.x0 != null && n.x0 < x0Min)
      n.x0 = x0Min
    if (n.x1 != null && n.x1 > x1Max)
      n.x1 = x1Max
    if (n.y0 != null && n.y0 < y0Min)
      n.y0 = y0Min
    if (n.y1 != null && n.y1 > y1Max)
      n.y1 = y1Max
  }

  return { nodes: result.nodes, links: result.links }
}

export const linkPathGenerator: (link: SankeyLayoutLink) => string | null
  = sankeyLinkHorizontal<SankeyInputNode, SankeyInputLink>() as any
