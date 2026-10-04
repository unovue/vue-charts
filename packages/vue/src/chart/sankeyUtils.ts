import { type SankeyGraph, type SankeyLink, type SankeyNode, sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { toRaw } from 'vue'
import { warn } from '@/utils/log'

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

function validLinks(data: ComputeSankeyLayoutArgs['data']): SankeyInputLink[] {
  const isNodeIndex = (index: number | string): index is number =>
    typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < data.nodes.length
  const links = data.links.flatMap((link) => {
    const { source, target, value } = link
    if (!isNodeIndex(source) || !isNodeIndex(target) || !Number.isFinite(value) || value <= 0)
      return []
    return [{ ...toRaw(link), source, target }]
  })
  const outgoing: number[][] = Array.from({ length: data.nodes.length }, () => [])
  links.forEach((link, index) => outgoing[link.source].push(index))
  const state = new Uint8Array(data.nodes.length)
  const backEdges = new Set<number>()

  // Visit nodes and outgoing edges in input order. An explicit DFS stack also
  // avoids overflowing the JavaScript call stack on a long valid chain.
  for (let node = 0; node < data.nodes.length; node++) {
    if (state[node])
      continue
    state[node] = 1
    const stack = [{ node, next: 0 }]
    while (stack.length) {
      const frame = stack[stack.length - 1]
      const edge = outgoing[frame.node][frame.next++]
      if (edge === undefined) {
        state[frame.node] = 2
        stack.pop()
        continue
      }
      const target = links[edge].target
      if (state[target] === 1) {
        backEdges.add(edge)
      }
      else if (state[target] === 0) {
        state[target] = 1
        stack.push({ node: target, next: 0 })
      }
    }
  }
  const kept = links.filter((_, index) => !backEdges.has(index))
  const dropped = data.links.length - kept.length
  warn(dropped === 0, 'Sankey dropped %s invalid or cyclic links.', dropped)
  return kept
}

export function computeSankeyLayout(args: ComputeSankeyLayoutArgs): ComputeSankeyLayoutResult {
  const { data, width, height, nodePadding, nodeWidth, iterations, margin } = args

  // d3-sankey mutates input — clone every node/link.
  // toRaw() strips Vue Proxies (project rule: D3 + Vue Proxy is broken).
  const cloned: SankeyGraph<SankeyInputNode, SankeyInputLink> = {
    nodes: data.nodes.map(n => ({ ...toRaw(n) })),
    links: validLinks(data),
  }

  // Without any flow d3-sankey scales node heights by 0/0 and returns NaN coordinates.
  if (!cloned.links.length)
    return { nodes: [], links: [] }

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
