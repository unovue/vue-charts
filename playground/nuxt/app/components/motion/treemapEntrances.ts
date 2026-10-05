// Treemap entrance candidates. Each maps a leaf's final rectangle and the clock to what is drawn,
// so they all compare on the same layout, data and timing as the library (1 s ease-out cubic).

export interface Rect { x: number, y: number, width: number, height: number }
export interface Leaf extends Rect { name: string, root: number, fill: string }
export interface Frame extends Rect { opacity: number, label: number }
export interface Scene {
  chart: Rect
  groups: Map<number, Rect>
  /** 0 for the largest leaf, 1 for the smallest. */
  sizeRank: Map<string, number>
}
export interface Entrance {
  id: string
  name: string
  description: string
  /** Seconds at normal speed. */
  duration: number
  /** Marks the library's current entrance. */
  current?: boolean
  draw: (leaf: Leaf, t: number, scene: Scene) => Frame
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function morph(from: Rect, to: Rect, t: number): Rect {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}
// Labels fade in over the last 40 % of a cell's own motion, once it is nearly in place.
const label = (e: number) => clamp((e - 0.6) / 0.4)
const frame = (rect: Rect, e: number, opacity = 1): Frame => ({ ...rect, opacity, label: label(e) })
// A cell's own eased progress when cells start one after another: `order` 0..1 spreads the starts
// over `spread` of the clock, and each cell then takes the rest.
function staggered(t: number, order: number, spread = 0.4) {
  return easeOutCubic(clamp((t - order * spread) / (1 - spread)))
}
function scaleAround(leaf: Rect, s: number): Rect {
  return { x: leaf.x + leaf.width * (1 - s) / 2, y: leaf.y + leaf.height * (1 - s) / 2, width: leaf.width * s, height: leaf.height * s }
}

export const treemapEntrances: Entrance[] = [
  {
    id: 'center',
    name: 'Grow from center',
    description: 'Each cell grows out of its own middle. The library\'s entrance today.',
    duration: 1,
    current: true,
    draw: (leaf, t) => {
      const e = easeOutCubic(t)
      return frame(scaleAround(leaf, e), e)
    },
  },
  {
    id: 'fade',
    name: 'Fade',
    description: 'Every cell is in place and only fades in. Calm, no geometry moves.',
    duration: 0.6,
    draw: (leaf, t) => {
      const e = easeOutCubic(t)
      return frame(leaf, e, e)
    },
  },
  {
    id: 'rise',
    name: 'Fade and rise',
    description: 'Cells fade in while settling up by 12 px, like cards entering a page.',
    duration: 0.8,
    draw: (leaf, t) => {
      const e = easeOutCubic(t)
      return frame({ ...leaf, y: leaf.y + 12 * (1 - e) }, e, e)
    },
  },
  {
    id: 'whole',
    name: 'Split from the whole',
    description: 'One block fills the chart and divides into its cells: the part-of-a-whole story.',
    duration: 1,
    draw: (leaf, t, scene) => {
      const e = easeOutCubic(t)
      return frame(morph(scene.chart, leaf, e), e)
    },
  },
  {
    id: 'groups',
    name: 'Split from groups',
    description: 'Each group starts as one block in its color and divides into its members.',
    duration: 1,
    draw: (leaf, t, scene) => {
      const e = easeOutCubic(t)
      return frame(morph(scene.groups.get(leaf.root) ?? leaf, leaf, e), e)
    },
  },
  {
    id: 'wipe',
    name: 'Wipe left to right',
    description: 'A straight edge sweeps across the chart and reveals the cells it passes.',
    duration: 1,
    draw: (leaf, t, scene) => {
      const e = easeOutCubic(t)
      const edge = scene.chart.x + scene.chart.width * e
      const width = clamp((edge - leaf.x) / leaf.width) * leaf.width
      return { ...leaf, width, opacity: 1, label: clamp((width / leaf.width - 0.6) / 0.4) }
    },
  },
  {
    id: 'corner',
    name: 'Grow from corner',
    description: 'Each cell unfolds from its top-left corner, the way the layout reads.',
    duration: 1,
    draw: (leaf, t) => {
      const e = easeOutCubic(t)
      return frame({ ...leaf, width: leaf.width * e, height: leaf.height * e }, e)
    },
  },
  {
    id: 'bottom',
    name: 'Grow from bottom',
    description: 'Each cell rises from its bottom edge, like bars in a bar chart.',
    duration: 1,
    draw: (leaf, t) => {
      const e = easeOutCubic(t)
      return frame({ ...leaf, y: leaf.y + leaf.height * (1 - e), height: leaf.height * e }, e)
    },
  },
  {
    id: 'size',
    name: 'Largest first',
    description: 'Cells fade and settle from 92 % one after another, biggest value first.',
    duration: 1.2,
    draw: (leaf, t, scene) => {
      const e = staggered(t, scene.sizeRank.get(leaf.name) ?? 0)
      return frame(scaleAround(leaf, 0.92 + 0.08 * e), e, e)
    },
  },
  {
    id: 'diagonal',
    name: 'Diagonal cascade',
    description: 'Cells fade and settle in a wave from the top-left corner to the bottom-right.',
    duration: 1.2,
    draw: (leaf, t, scene) => {
      const { chart } = scene
      const order = (leaf.x - chart.x + leaf.y - chart.y) / (chart.width + chart.height)
      const e = staggered(t, order)
      return frame(scaleAround(leaf, 0.92 + 0.08 * e), e, e)
    },
  },
]

export function sceneOf(leaves: Leaf[]): Scene {
  const bounds = (rects: Rect[]): Rect => {
    const x = Math.min(...rects.map(r => r.x))
    const y = Math.min(...rects.map(r => r.y))
    return { x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x, height: Math.max(...rects.map(r => r.y + r.height)) - y }
  }
  const groups = new Map<number, Rect>()
  for (const root of new Set(leaves.map(leaf => leaf.root)))
    groups.set(root, bounds(leaves.filter(leaf => leaf.root === root)))
  const bySize = [...leaves].sort((a, b) => b.width * b.height - a.width * a.height)
  return {
    chart: leaves.length ? bounds(leaves) : { x: 0, y: 0, width: 0, height: 0 },
    groups,
    sizeRank: new Map(bySize.map((leaf, i) => [leaf.name, bySize.length > 1 ? i / (bySize.length - 1) : 0])),
  }
}
