import type { DataKey } from '@/types'
import { getValueByDataKey } from '@/utils/chart'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

export interface TreemapLayoutNode {
  x: number
  y: number
  width: number
  height: number
  depth: number
  name: string
  value: number
  payload: Record<string, any>
  color?: string
  root: number
}

export interface TreemapLayoutOptions {
  data: Record<string, any>[]
  width: number
  height: number
  dataKey: DataKey<Record<string, any>>
  aspectRatio?: number
  nameKey?: DataKey<Record<string, any>>
  colorPanel?: string[]
}

export function computeTreemapLayout(options: TreemapLayoutOptions): TreemapLayoutNode[] {
  const { data, width, height, dataKey, aspectRatio = 4 / 3, nameKey = 'name', colorPanel } = options

  if (!data || data.length === 0 || width <= 0 || height <= 0)
    return []

  const root = hierarchy({ children: data } as any)
    .sum((d: any) => {
      if (d.children && d.children.length > 0)
        return 0
      const val = getValueByDataKey(d, dataKey)
      return typeof val === 'number' && val > 0 ? val : 0
    })
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  treemap()
    .size([width, height])
    .tile(treemapSquarify.ratio(aspectRatio))
    .round(true)(root)

  return root.leaves().map((leaf) => {
    const d = leaf.data as any
    let ancestor = leaf
    while (ancestor.depth > 1 && ancestor.parent) ancestor = ancestor.parent
    const rootIndex = ancestor.parent ? ancestor.parent.children!.indexOf(ancestor) : 0

    return {
      x: leaf.x0!,
      y: leaf.y0!,
      width: leaf.x1! - leaf.x0!,
      height: leaf.y1! - leaf.y0!,
      depth: leaf.depth,
      name: getValueByDataKey(d, nameKey, ''),
      value: leaf.value ?? 0,
      payload: d,
      root: rootIndex,
      color: colorPanel ? colorPanel[rootIndex % colorPanel.length] : undefined,
    }
  })
}
